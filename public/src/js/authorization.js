// Enhanced Keycloak authorization module with better error handling and debugging
// This module automatically loads the Keycloak JavaScript adapter from a CDN

/**
 * Modified Keycloak configuration with failover settings
 */
const keycloakConfig = {
    url: 'https://authorization.athebyme-market.ru/auth',
    realm: 'gomarket',
    clientId: 'gomarket-frontend',

    // Fallback settings for development/testing
    fallback: {
        enabled: true, // Enable fallback for development
        mockUsers: [
            {
                username: 'TestSeller',
                email: 'seller@example.com',
                roles: ['seller'],
                tenantId: 'default-tenant',
                supplierId: 'default-supplier'
            }
        ]
    }
};

class AuthService {
    constructor() {
        this.keycloak = null;
        this._isInitialized = false;
        this._initPromise = null;
        this._tokenRefreshInterval = null;
        this._debugMode = false; // Set to true for detailed logging
    }

    /**
     * Initialize the Keycloak instance
     * @param {Object} options - Additional options for initialization
     * @param {boolean} options.debugMode - Enable debug logging
     * @returns {Promise<boolean>} - Promise resolving to authentication status
     */
    async init(options = {}) {
        this._debugMode = options.debugMode || false;

        if (this._debugMode) {
            console.log('Initializing Keycloak with config:', keycloakConfig);
        }

        if (!this._initPromise) {
            this._initPromise = new Promise(async (resolve, reject) => {
                try {
                    // Load Keycloak JavaScript adapter if it's not loaded yet
                    await this._loadKeycloakScript();

                    // Create new Keycloak instance
                    this.keycloak = new window.Keycloak(keycloakConfig);

                    // Configure listeners for token events
                    this._setupTokenListeners();

                    // Initialize Keycloak
                    const authenticated = await this.keycloak.init({
                        onLoad: 'check-sso',
                        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                        pkceMethod: 'S256', // More secure PKCE method
                        checkLoginIframe: false, // Disable iframe checking which can cause issues
                        promiseType: 'native'
                    });

                    this._isInitialized = true;
                    this._log(authenticated ? "Authenticated" : "Not authenticated");

                    if (authenticated) {
                        this._updateLocalStorage();
                        this._setupTokenRefresh();
                    }

                    resolve(authenticated);
                } catch (error) {
                    console.error("Keycloak initialization failed:", error);
                    // Try to provide more helpful error message based on the error
                    let errorMessage = "Authentication service initialization failed.";

                    if (error.message && error.message.includes('CORS')) {
                        errorMessage = "CORS error: Unable to connect to authorization server. Please check network settings.";
                    } else if (error.error === 'invalid_request') {
                        errorMessage = "Invalid authorization request. Please check client configuration.";
                    }

                    this._isInitialized = false;
                    reject(new Error(errorMessage));
                }
            });
        }

        return this._initPromise;
    }

    /**
     * Load Keycloak JavaScript adapter from CDN
     * @private
     * @returns {Promise<void>}
     */
    _loadKeycloakScript() {
        return new Promise((resolve, reject) => {
            // Check if Keycloak is already loaded
            if (window.Keycloak) {
                this._log('Keycloak already loaded');
                return resolve();
            }

            this._log('Loading Keycloak JavaScript adapter from CDN');

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/keycloak-js@22.0.5/dist/keycloak.min.js';
            script.async = true;

            script.onload = () => {
                this._log('Keycloak JavaScript adapter loaded successfully');
                resolve();
            };

            script.onerror = () => {
                const error = new Error('Failed to load Keycloak JavaScript adapter');
                console.error(error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Setup token refresh mechanism and event listeners
     * @private
     */
    _setupTokenListeners() {
        if (!this.keycloak) return;

        this.keycloak.onTokenExpired = () => {
            this._log('Token expired, attempting refresh.');
            this.refreshToken()
                .then(refreshed => {
                    this._log(refreshed ? 'Token refreshed successfully.' : 'Token refresh not needed.');
                })
                .catch(error => {
                    console.error('Error refreshing token:', error);
                    // If token can't be refreshed, we might need to re-authenticate
                    if (this._isPageInteractive()) {
                        this._log('Token refresh failed, redirecting to login.');
                        this.login();
                    }
                });
        };

        this.keycloak.onAuthError = (error) => {
            console.error('Keycloak auth error:', error);
        };
    }

    /**
     * Setup automatic token refresh interval
     * @private
     */
    _setupTokenRefresh() {
        // Clear any existing interval
        if (this._tokenRefreshInterval) {
            clearInterval(this._tokenRefreshInterval);
        }

        // Set up token refresh to happen at 70% of token lifespan
        const tokenLifespanMs = (this.keycloak.tokenParsed.exp - this.keycloak.tokenParsed.iat) * 1000;
        const refreshIntervalMs = Math.max(tokenLifespanMs * 0.7, 60000); // At least every minute

        this._log(`Setting up token refresh every ${Math.round(refreshIntervalMs / 1000)} seconds`);

        this._tokenRefreshInterval = setInterval(() => {
            this.refreshToken().catch(error => {
                console.error('Automatic token refresh failed:', error);
            });
        }, refreshIntervalMs);
    }

    /**
     * Ensure Keycloak is initialized before any operation
     * @private
     * @returns {Promise<void>}
     */
    async _ensureInitialized() {
        if (!this._isInitialized && !this._initPromise) {
            console.warn("AuthService.init() was not called. Attempting to initialize now.");
            await this.init();
        } else if (this._initPromise) {
            await this._initPromise;
        }

        if (!this._isInitialized) {
            throw new Error("Keycloak initialization failed or was not completed successfully.");
        }
    }

    /**
     * Update localStorage with token information
     * @private
     */
    _updateLocalStorage() {
        if (this.keycloak && this.keycloak.authenticated) {
            try {
                localStorage.setItem('auth_token', this.keycloak.token);

                const user = {
                    username: this.keycloak.tokenParsed?.preferred_username || 'User',
                    email: this.keycloak.tokenParsed?.email,
                    roles: this.keycloak.tokenParsed?.realm_access?.roles || [],
                    sub: this.keycloak.tokenParsed?.sub,
                };

                localStorage.setItem('auth_user', JSON.stringify(user));
                localStorage.setItem('isLoggedIn', 'true');

                // Set username for UI display
                localStorage.setItem('username', user.username);

                // Update UI immediately if possible
                this._updateUIWithUsername(user.username);
            } catch (error) {
                console.error('Error updating localStorage:', error);
            }
        } else {
            this._clearAuthData();
        }
    }

    /**
     * Clear authentication data from localStorage
     * @private
     */
    _clearAuthData() {
        try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }

    /**
     * Update UI elements with username
     * @private
     * @param {string} username - The username to display
     */
    _updateUIWithUsername(username) {
        try {
            const usernameElements = document.querySelectorAll(
                '#usernameDisplay, #mobileUsernameDisplay, #welcomeUsername'
            );

            usernameElements.forEach(el => {
                if (el) el.textContent = username;
            });
        } catch (error) {
            // Silent catch - this is a non-critical operation
            this._log('Non-critical error updating UI with username:', error);
        }
    }

    /**
     * Check if the page is in an interactive state (not loading/unloading)
     * @private
     * @returns {boolean}
     */
    _isPageInteractive() {
        return document.readyState === 'complete' || document.readyState === 'interactive';
    }

    /**
     * Conditionally log messages based on debug mode
     * @private
     * @param {...any} args - Arguments to log
     */
    _log(...args) {
        if (this._debugMode) {
            console.log('[AuthService]', ...args);
        }
    }

    /**
     * Redirect to the Keycloak login page
     * @param {Object} options - Login options
     * @returns {Promise<void>}
     */
    async login(options = {}) {
        try {
            await this._ensureInitialized();

            // Handle local development environment or alternate auth mechanisms
            // if running locally and Keycloak server is unavailable
            if (!this.keycloak) {
                console.warn("Keycloak unavailable. Using fallback auth for development.");
                this._mockLogin();
                return;
            }

            const loginOptions = {
                redirectUri: window.location.origin + '/main',
                ...options
            };

            this._log('Redirecting to login page with options:', loginOptions);
            this.keycloak.login(loginOptions);
        } catch (error) {
            console.error('Login failed:', error);

            // Show user-friendly error message
            if (typeof toastr !== 'undefined') {
                toastr.error('Не удалось перейти на страницу авторизации. Пожалуйста, попробуйте позже.');
            }

            // Use mock login for development environments when server is unavailable
            this._mockLogin();
        }
    }

    /**
     * Development fallback when Keycloak server is unavailable
     * @private
     */
    _mockLogin() {
        console.warn("Using mock login for development purposes");

        // Mock user data for development
        const mockUser = {
            username: 'DevUser',
            email: 'dev@example.com',
            roles: ['seller'],
            sub: 'mock-user-123',
        };

        localStorage.setItem('auth_token', 'mock-token-for-development');
        localStorage.setItem('auth_user', JSON.stringify(mockUser));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', mockUser.username);

        // Update UI
        this._updateUIWithUsername(mockUser.username);

        if (typeof toastr !== 'undefined') {
            toastr.warning('Используется тестовый режим авторизации, так как сервер Keycloak недоступен.');
        }

        // Redirect to main page
        if (window.location.pathname === '/') {
            window.location.href = '/main';
        } else {
            // Refresh current page to apply auth changes
            window.location.reload();
        }
    }

    /**
     * Logout from Keycloak
     * @param {Object} options - Logout options
     * @returns {Promise<void>}
     */
    async logout(options = {}) {
        try {
            await this._ensureInitialized();

            // Clean up the token refresh interval
            if (this._tokenRefreshInterval) {
                clearInterval(this._tokenRefreshInterval);
                this._tokenRefreshInterval = null;
            }

            // Clear local storage
            this._clearAuthData();

            // If using mock login or Keycloak is unavailable, just redirect
            if (!this.keycloak || !this.keycloak.authenticated) {
                window.location.href = '/';
                return;
            }

            const logoutOptions = {
                redirectUri: window.location.origin + '/',
                ...options
            };

            this._log('Logging out with options:', logoutOptions);

            // Redirect to Keycloak logout
            this.keycloak.logout(logoutOptions);
        } catch (error) {
            console.error('Logout failed:', error);

            // Still clear local data even if Keycloak logout fails
            this._clearAuthData();

            // Show user-friendly message
            if (typeof toastr !== 'undefined') {
                toastr.warning('Не удалось выполнить выход через сервер авторизации. Сессия очищена локально.');
            }

            // Redirect to login page as fallback
            window.location.href = '/';
        }
    }

    /**
     * Refresh the token
     * @param {number} minValidity - Minimum validity time in seconds
     * @returns {Promise<boolean>} - Whether the token was refreshed
     */
    async refreshToken(minValidity = 30) {
        try {
            await this._ensureInitialized();

            if (!this.keycloak.authenticated) {
                return false;
            }

            const refreshed = await this.keycloak.updateToken(minValidity);

            if (refreshed) {
                this._log('Token refreshed');
                this._updateLocalStorage();
            }

            return refreshed;
        } catch (error) {
            console.error('Token refresh failed:', error);

            // If we're in an interactive context, we might want to redirect to login
            if (this._isPageInteractive() && this.isAuthenticated()) {
                if (typeof toastr !== 'undefined') {
                    toastr.warning('Сессия истекла. Перенаправление на страницу входа...');
                }

                // Allow toastr to show before redirect
                setTimeout(() => this.login(), 2000);
            }

            throw error;
        }
    }

    /**
     * Check if the user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        // If in mock mode, check localStorage
        if (!this._isInitialized || !this.keycloak) {
            return localStorage.getItem('isLoggedIn') === 'true';
        }

        return this.keycloak && this.keycloak.authenticated;
    }

    /**
     * Get the current username
     * @returns {string|null}
     */
    getUsername() {
        // If in mock mode, get from localStorage
        if (!this._isInitialized || !this.keycloak || !this.keycloak.authenticated) {
            try {
                const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
                return authUser.username || null;
            } catch (e) {
                return localStorage.getItem('username') || null;
            }
        }

        if (this.keycloak.tokenParsed) {
            return this.keycloak.tokenParsed.preferred_username;
        }

        return null;
    }

    /**
     * Check if the user has a specific role
     * @param {string} role - Role to check
     * @returns {boolean}
     */
    hasRole(role) {
        if (!this.isAuthenticated()) return false;

        return (
            this.keycloak.hasRealmRole(role) ||
            this.keycloak.hasResourceRole(role, keycloakConfig.clientId)
        );
    }

    /**
     * Get authorization header for API requests
     * @returns {Object} - Headers object with Authorization
     */
    getAuthHeader() {
        // If in mock mode, use mock token
        if (!this._isInitialized || !this.keycloak || !this.keycloak.authenticated) {
            const mockToken = localStorage.getItem('auth_token');
            if (mockToken) {
                return { 'Authorization': `Bearer ${mockToken}` };
            }
            return {};
        }

        if (this.keycloak.token) {
            return { 'Authorization': `Bearer ${this.keycloak.token}` };
        }

        return {};
    }

    /**
     * Make an authenticated fetch request
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} - Fetch response
     */
    async fetchAuthenticated(url, options = {}) {
        try {
            await this._ensureInitialized();
        } catch (error) {
            console.warn("Could not initialize Keycloak:", error);
            // Continue with mock auth if available
            if (localStorage.getItem('isLoggedIn') !== 'true') {
                console.warn('User not authenticated for fetchAuthenticated. Using mock login.');
                this._mockLogin();
                throw new Error('Authentication required. Initializing mock login...');
            }
        }

        if (!this.isAuthenticated()) {
            console.warn('User not authenticated for fetchAuthenticated. Redirecting to login.');
            this.login();
            throw new Error('User not authenticated. Redirecting to login.');
        }

        try {
            // Refresh token if it's about to expire and we're using actual Keycloak
            if (this.keycloak && this.keycloak.authenticated) {
                await this.refreshToken(30);
            }
        } catch (error) {
            console.error('Failed to refresh token for API call:', error);
            // Continue with the current token or mock token
        }

        // Include authentication header
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...this.getAuthHeader(),
        };

        // Add tenant ID header
        if (this.keycloak?.tokenParsed?.tenant_id) {
            headers['X-Tenant-ID'] = this.keycloak.tokenParsed.tenant_id;
        } else {
            // Use a default tenant ID for development
            headers['X-Tenant-ID'] = 'default-tenant';
        }

        // Add supplier ID header
        if (this.keycloak?.tokenParsed?.supplier_id) {
            headers['X-Supplier-ID'] = this.keycloak.tokenParsed.supplier_id;
        } else {
            // Use a default supplier ID for development
            headers['X-Supplier-ID'] = 'default-supplier';
        }

        try {
            const response = await fetch(url, { ...options, headers });

            // Handle unauthorized responses
            if (response.status === 401 || response.status === 403) {
                console.warn(`Received ${response.status} from API. Redirecting to login.`);

                if (typeof toastr !== 'undefined') {
                    toastr.error('Сессия истекла или доступ запрещен. Перенаправление на страницу входа...');
                }

                // In development mode with mock auth, refresh the login
                if (!this.keycloak || !this.keycloak.authenticated) {
                    this._mockLogin();
                } else {
                    setTimeout(() => this.login(), 2000);
                }

                throw new Error(`API access denied with status ${response.status}. Redirecting to login.`);
            }

            return response;
        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                if (typeof toastr !== 'undefined') {
                    toastr.error('Не удалось подключиться к серверу API. Проверьте соединение.');
                }
            }

            throw error;
        }
    }

    /**
     * Get detailed user information
     * @returns {Promise<Object|null>} - User information
     */
    async getUserInfo() {
        try {
            await this._ensureInitialized();

            if (!this.isAuthenticated()) return null;

            // First, check if we already have the info in the token
            const tokenInfo = this.keycloak.tokenParsed;

            // Basic info from token
            const userInfo = {
                username: tokenInfo.preferred_username,
                firstName: tokenInfo.given_name,
                lastName: tokenInfo.family_name,
                email: tokenInfo.email,
                roles: tokenInfo.realm_access?.roles || [],
                tenantId: tokenInfo.tenant_id,
                supplierId: tokenInfo.supplier_id
            };

            // For more detailed info, we can load the user profile
            // This makes an additional network request
            try {
                const profile = await this.keycloak.loadUserProfile();
                return {
                    ...userInfo,
                    ...profile
                };
            } catch (e) {
                // If profile loading fails, return the basic info
                console.warn('Failed to load detailed user profile:', e);
                return userInfo;
            }
        } catch (error) {
            console.error('Error getting user info:', error);
            return null;
        }
    }

    /**
     * Get tenant ID from token
     * @returns {string|null}
     */
    getTenantId() {
        if (this.isAuthenticated() && this.keycloak.tokenParsed?.tenant_id) {
            return this.keycloak.tokenParsed.tenant_id;
        }
        return null;
    }

    /**
     * Get supplier ID from token
     * @returns {string|null}
     */
    getSupplierId() {
        if (this.isAuthenticated() && this.keycloak.tokenParsed?.supplier_id) {
            return this.keycloak.tokenParsed.supplier_id;
        }
        return null;
    }
}

// Export singleton instance
const authService = new AuthService();
export default authService;