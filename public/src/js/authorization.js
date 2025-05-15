// IMPORTANT: Make sure to include the Keycloak JavaScript adapter before this script.
// For example: <script src="https://authorization.athebyme-market.ru/auth/js/keycloak.js"></script>

const keycloakConfig = {
    url: 'https://authorization.athebyme-market.ru/auth',
    realm: 'gomarket',
    clientId: 'gomarket-frontend'
};

const keycloak = new Keycloak(keycloakConfig);

const authService = {
    _isInitialized: false,
    _initPromise: null,

    init: function() {
        if (!this._initPromise) {
            this._initPromise = new Promise(async (resolve, reject) => {
                try {
                    const authenticated = await keycloak.init({
                        onLoad: 'check-sso', // Use 'login-required' to auto-redirect to login
                        promiseType: 'native',
                        // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html', // Optional: for silent token refresh in iframe
                        // checkLoginIframe: false, // Can be useful in some scenarios to disable default iframe checking
                    });
                    
                    this._isInitialized = true;
                    console.log(authenticated ? "Keycloak: Authenticated" : "Keycloak: Not authenticated");

                    if (authenticated) {
                        this._updateLocalStorage(); // Helper to store token/user for compatibility

                        keycloak.onTokenExpired = () => {
                            console.log('Keycloak token expired, attempting refresh.');
                            keycloak.updateToken(30) // minValidity 30 seconds
                                .then((refreshed) => {
                                    if (refreshed) {
                                        console.log('Keycloak token refreshed after expiry.');
                                        this._updateLocalStorage();
                                    } else {
                                        console.warn('Keycloak token not refreshed after expiry, might be still valid or session ended.');
                                    }
                                })
                                .catch(() => {
                                    console.error('Keycloak failed to refresh token after expiry.');
                                    // Consider calling keycloak.login() here if appropriate for your app flow
                                });
                        };
                    }
                    resolve(authenticated);
                } catch (error) {
                    console.error("Keycloak initialization failed:", error);
                    this._isInitialized = false;
                    reject(error);
                }
            });
        }
        return this._initPromise;
    },

    _ensureInitialized: async function() {
        if (!this._isInitialized && !this._initPromise) {
            // If init() was never called, it's a developer error.
            // However, we can try to initiate it.
            console.warn("AuthService.init() was not called. Attempting to initialize now. Ensure init() is called at application startup.");
            await this.init(); // This will create and return _initPromise
        } else if (this._initPromise) {
             // Wait for ongoing initialization to complete
            await this._initPromise;
        }
        // After waiting, if it's still not initialized, then there was a failure.
        if (!this._isInitialized) {
             throw new Error("Keycloak initialization failed or was not completed successfully.");
        }
    },
    
    _updateLocalStorage: function() {
        // This function updates localStorage for compatibility with any existing code
        // that might still read 'auth_token' or 'auth_user'.
        // Ideally, all parts of the application should use authService methods directly.
        if (keycloak.authenticated) {
            localStorage.setItem('auth_token', keycloak.token);
            const user = {
                username: keycloak.tokenParsed?.preferred_username,
                roles: keycloak.tokenParsed?.realm_access?.roles || [],
            };
            localStorage.setItem('auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    },

    login: async function() {
        // Ensure Keycloak is initialized before attempting login.
        // If init() hasn't been called, this will call it and wait.
        if (!this._isInitialized) {
            try {
                await this.init(); // Attempt to initialize if not already
            } catch (error) {
                console.error("Cannot proceed to login, Keycloak initialization failed.", error);
                // Optionally, you could throw this error or handle it by showing a UI message.
                return; // Stop if initialization failed
            }
        }
        // If after init, still not authenticated, then proceed to login.
        // If already authenticated, keycloak.login() might just refresh the page or do nothing specific.
        keycloak.login();
    },

    logout: async function() {
        try {
            await this._ensureInitialized(); // Ensure we don't call logout on an uninitialized instance
            // Redirect to the application's root page after logout from Keycloak.
            keycloak.logout({ redirectUri: window.location.origin + '/' });
        } catch (error) {
            console.error("Error during logout, Keycloak might not be initialized:", error);
            // Fallback or show error if _ensureInitialized throws
        } finally {
            // Always clear local storage items as a good measure,
            // though Keycloak redirect should handle session termination.
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    },

    isAuthenticated: function() {
        // Returns true if Keycloak is initialized and the user is authenticated.
        return this._isInitialized && keycloak.authenticated;
    },

    getUsername: function() {
        // Provides username if Keycloak is initialized and user is authenticated.
        // No need to await _ensureInitialized for simple synchronous getters if you ensure init() is called at startup.
        // However, accessing tokenParsed before keycloak.init is complete and successful is unsafe.
        if (this._isInitialized && keycloak.authenticated && keycloak.tokenParsed) {
            return keycloak.tokenParsed.preferred_username;
        }
        return null;
    },

    hasRole: function(role) {
        if (!(this._isInitialized && keycloak.authenticated)) return false;
        // Checks for both realm roles and client-specific roles.
        return keycloak.hasRealmRole(role) || keycloak.hasResourceRole(role, keycloakConfig.clientId);
    },

    getAuthHeader: function() {
        // Returns the Authorization header if authenticated.
        if (this._isInitialized && keycloak.authenticated && keycloak.token) {
            return { 'Authorization': `Bearer ${keycloak.token}` };
        }
        return {};
    },

    fetchAuthenticated: async function(url, options = {}) {
        await this._ensureInitialized();

        if (!keycloak.authenticated) {
            console.warn('User not authenticated for fetchAuthenticated. Attempting login.');
            this.login(); // Redirect to login
            // Throw an error to stop the current operation as it requires authentication.
            throw new Error('User not authenticated. Redirecting to login.');
        }

        try {
            // Refresh token if it's about to expire in less than 30 seconds.
            const refreshed = await keycloak.updateToken(30); 
            if (refreshed) {
                console.log('Keycloak token was refreshed for API call.');
                this._updateLocalStorage(); // Update localStorage if token changes
            }
        } catch (error) {
            console.error('Keycloak failed to refresh token for API call. Forcing login.', error);
            this.login(); // Force re-login due to token refresh failure
            throw new Error('Session expired or token refresh failed. Redirecting to login.');
        }

        const headers = {
            ...(options.headers || {}),
            ...this.getAuthHeader(), // Get the (potentially updated) token
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            console.warn(`Received ${response.status} for ${url}. Assuming session issue, forcing login.`);
            this.login(); // Force re-login on 401/403 from the server
            throw new Error(`API request failed with ${response.status}. Redirecting to login.`);
        }
        return response;
    },

    getUserInfo: async function() {
        await this._ensureInitialized();
        if (!keycloak.authenticated) return null;
        
        try {
            // Information is typically available in tokenParsed after successful authentication.
            const parsedToken = keycloak.tokenParsed;
            // For more details, keycloak.loadUserProfile() can be used, but it makes an additional network request.
            // const profile = await keycloak.loadUserProfile(); 
            return {
                username: parsedToken.preferred_username,
                firstName: parsedToken.given_name,
                lastName: parsedToken.family_name,
                email: parsedToken.email,
                roles: parsedToken.realm_access?.roles || [], // Consolidate with client roles if necessary
                // You can add other claims from parsedToken (e.g., parsedToken.sub for subject ID)
            };
        } catch (error) {
            console.error("Error constructing user info from Keycloak token:", error);
            return null;
        }
    }
};

export default authService;