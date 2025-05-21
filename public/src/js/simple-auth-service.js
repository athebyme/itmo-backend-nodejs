/**
 * Простой сервис авторизации через собственное API
 */
class SimpleAuthService {
    constructor() {
        this._isAuthenticated = false;
        this._accessToken = null;
        this._refreshToken = null;
        this._tokenType = 'Bearer';
        this._tokenExpiry = null;
        this._refreshExpiry = null;
        this._refreshTimeout = null;
        this._user = null;
    }

    /**
     * Базовый URL для API
     */
    get apiBaseUrl() {
        return 'http://localhost:8081'; // URL вашего API-сервера
    }

    /**
     * Проверка аутентификации при загрузке страницы
     */
    async init() {
        // Проверяем, есть ли токен в localStorage
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        console.log('Инициализация сервиса аутентификации:', {
            storedToken: storedToken ? 'Установлен' : 'Отсутствует',
            storedUser: storedUser
        });

        if (storedToken && storedUser) {
            try {
                this._accessToken = storedToken;
                this._user = JSON.parse(storedUser);
                this._isAuthenticated = true;

                // Если есть информация о сроке действия токена, восстанавливаем ее
                const tokenExpiry = localStorage.getItem('token_expiry');
                if (tokenExpiry) {
                    this._tokenExpiry = parseInt(tokenExpiry);
                }

                // Восстанавливаем refresh токен, если есть
                this._refreshToken = localStorage.getItem('refresh_token');

                // Обновляем UI, если возможно
                this._updateUIWithUsername();

                console.log('Восстановлена сессия из localStorage, аутентифицирован:', this._isAuthenticated);
                return true;
            } catch (error) {
                console.error('Ошибка восстановления сессии:', error);
                this._clearAuthData();
            }
        }

        return false;
    }

    /**
     * Аутентификация пользователя
     * @param {string} username - Имя пользователя
     * @param {string} password - Пароль
     * @param {string} tenantId - ID тенанта
     */
    async login(username, password, tenantId = 'default') {
        try {
            // Формируем запрос на аутентификацию
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify({ username, password })
            });

            // Проверяем HTTP-статус ответа
            if (!response.ok) {
                // Получаем текст ошибки из ответа
                const errorText = await response.text();
                let errorMessage = 'Неверные учетные данные';

                try {
                    // Пытаемся распарсить JSON, если сервер вернул его
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Используем текст как есть, если это не JSON
                    if (errorText) errorMessage = errorText;
                }

                // Очищаем localStorage на всякий случай
                this._clearAuthData();

                // Выбрасываем ошибку с правильным сообщением
                throw new Error(errorMessage);
            }

            // Парсим успешный ответ
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Ошибка парсинга ответа: ' + e.message);
            }

            console.log('Ответ от сервера:', data);

            // Проверяем структуру ответа
            if (!data.success) {
                throw new Error('Сервер вернул ошибку: ' + (data.message || 'Неизвестная ошибка'));
            }

            // Проверяем наличие токена
            if (!data.data || !data.data.access_token) {
                throw new Error('Некорректный ответ от сервера: отсутствует токен доступа');
            }

            // Сохраняем токены и информацию
            this._accessToken = data.data.access_token;
            this._refreshToken = data.data.refresh_token;
            this._tokenType = data.data.token_type || 'Bearer';
            this._tokenExpiry = Date.now() + (data.data.expires_in * 1000);
            this._refreshExpiry = data.data.refresh_expires_in ? Date.now() + (data.data.refresh_expires_in * 1000) : null;

            // Пытаемся извлечь информацию о пользователе
            this._user = {
                username: username,
                tenantId: tenantId,
                supplierId: 'default'
            };

            // Сохраняем данные
            this._updateLocalStorage();

            this._isAuthenticated = true;
            console.log('Успешная аутентификация');
            return true;
        } catch (error) {
            console.error('Ошибка аутентификации:', error);

            if (typeof toastr !== 'undefined') {
                toastr.error(error.message || 'Ошибка аутентификации');
            }

            throw error;
        }
    }

    /**
     * Выполнить выход из системы
     */
    async logout() {
        try {
            if (this._accessToken) {
                try {
                    // Отправляем запрос на выход, если возможно
                    await fetch(`${this.apiBaseUrl}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `${this._tokenType} ${this._accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.warn('Ошибка при выходе из системы:', error);
                    // Продолжаем процесс выхода даже при ошибке
                }
            }
        } finally {
            // Очищаем данные аутентификации в любом случае
            if (this._refreshTimeout) {
                clearTimeout(this._refreshTimeout);
                this._refreshTimeout = null;
            }

            this._accessToken = null;
            this._refreshToken = null;
            this._tokenExpiry = null;
            this._refreshExpiry = null;
            this._isAuthenticated = false;
            this._user = null;

            // Очищаем localStorage
            this._clearAuthData();

            // Перенаправляем на страницу входа
            window.location.href = '/';
        }
    }

    /**
     * Проверка, аутентифицирован ли пользователь
     */
    isAuthenticated() {
        // Для отладки
        console.log('Проверка аутентификации:', {
            _isAuthenticated: this._isAuthenticated,
            _accessToken: this._accessToken ? 'Установлен' : 'Отсутствует',
            tokenExpiry: this._tokenExpiry,
            now: Date.now(),
            isExpired: this._tokenExpiry && Date.now() > this._tokenExpiry
        });

        // Если нет флага или токена, сразу возвращаем false
        if (!this._isAuthenticated || !this._accessToken) {
            return false;
        }

        // Проверяем срок действия токена
        if (this._tokenExpiry && Date.now() > this._tokenExpiry) {
            console.log('Токен истек, попытка обновления');
            // Если токен истек, пробуем его обновить асинхронно, но возвращаем текущее состояние
            if (this._refreshToken) {
                this.refreshToken().catch(() => {
                    console.log('Не удалось обновить токен');
                    // При ошибке обновления очищаем всё
                    this._clearAuthData();
                });
            } else {
                return false;
            }
        }

        return true;
    }

    /**
     * Обновление токена
     */
    async refreshToken() {
        if (!this._refreshToken || !this._refreshExpiry) {
            throw new Error('Нет токена обновления');
        }

        // Если токен обновления истек, то выходим
        if (Date.now() > this._refreshExpiry) {
            throw new Error('Токен обновления истек');
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': this._user?.tenantId || 'default'
                },
                body: JSON.stringify({ refresh_token: this._refreshToken })
            });

            if (!response.ok) {
                throw new Error('Ошибка обновления токена');
            }

            const data = await response.json();

            if (!data.success || !data.data || !data.data.access_token) {
                throw new Error('Некорректный ответ при обновлении токена');
            }

            // Обновляем токены и информацию
            this._accessToken = data.data.access_token;
            this._refreshToken = data.data.refresh_token;
            this._tokenType = data.data.token_type || 'Bearer';
            this._tokenExpiry = Date.now() + (data.data.expires_in * 1000);
            this._refreshExpiry = Date.now() + (data.data.refresh_expires_in * 1000);

            // Обновляем в localStorage
            this._updateLocalStorage();

            // Обновляем таймер
            this._setupTokenRefresh();

            return true;
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            throw error;
        }
    }

    /**
     * Выполнение аутентифицированного запроса
     * @param {string} url - URL для запроса
     * @param {Object} options - Опции запроса
     */
    async fetchAuthenticated(url, options = {}) {
        if (!this.isAuthenticated()) {
            console.warn('Пользователь не аутентифицирован. Перенаправление на страницу входа.');
            window.location.href = '/';
            throw new Error('Пользователь не аутентифицирован');
        }

        // Обновляем токен при необходимости
        const tokenTimeLeft = this._tokenExpiry - Date.now();
        if (tokenTimeLeft < 30000 && this._refreshToken) {
            try {
                await this.refreshToken();
            } catch (error) {
                console.error('Ошибка обновления токена перед запросом:', error);
                if (tokenTimeLeft <= 0) {
                    window.location.href = '/';
                    throw new Error('Сессия истекла');
                }
            }
        }

        // Базовые заголовки
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `${this._tokenType} ${this._accessToken}`,
            ...(options.headers || {})
        };

        // Всегда добавляем X-Tenant-ID и X-Supplier-ID из данных пользователя
        // Если их нет, используем значения по умолчанию
        headers['X-Tenant-ID'] = this._user?.tenantId || 'default';
        headers['X-Supplier-ID'] = this._user?.supplierId || 'default';

        console.log('Отправка запроса с заголовками:', {
            url,
            method: options.method || 'GET',
            'X-Tenant-ID': headers['X-Tenant-ID'],
            'X-Supplier-ID': headers['X-Supplier-ID']
        });

        try {
            const response = await fetch(url, { ...options, headers });

            if (response.status === 401 || response.status === 403) {
                console.warn(`Получен статус ${response.status} от API. Перенаправление на страницу входа.`);

                if (typeof toastr !== 'undefined') {
                    toastr.error('Сессия истекла или доступ запрещен');
                }

                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);

                throw new Error(`Доступ запрещен, статус ${response.status}`);
            }

            return response;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                if (typeof toastr !== 'undefined') {
                    toastr.error('Не удалось подключиться к серверу API. Проверьте соединение.');
                }
            }

            throw error;
        }
    }

    /**
     * Получить имя пользователя
     */
    getUsername() {
        return this._user?.username || null;
    }

    /**
     * Получить заголовки авторизации
     */
    getAuthHeader() {
        if (this._accessToken) {
            return { 'Authorization': `${this._tokenType} ${this._accessToken}` };
        }
        return {};
    }

    /**
     * Установка обновления токена по таймеру
     * @private
     */
    _setupTokenRefresh() {
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
        }

        if (!this._tokenExpiry || !this._refreshToken) {
            return;
        }

        // Рассчитываем время до истечения токена (70% от общего времени)
        const tokenLifespan = this._tokenExpiry - Date.now();
        const refreshTime = Math.max(tokenLifespan * 0.7, 60000); // Минимум 1 минута

        console.log(`Установка таймера обновления токена через ${Math.round(refreshTime / 1000)} секунд`);

        this._refreshTimeout = setTimeout(() => {
            this.refreshToken().catch(error => {
                console.error('Ошибка автоматического обновления токена:', error);
            });
        }, refreshTime);
    }

    /**
     * Обновление localStorage с информацией токена
     * @private
     */
    _updateLocalStorage() {
        if (this._accessToken) {
            localStorage.setItem('auth_token', this._accessToken);

            if (this._refreshToken) {
                localStorage.setItem('refresh_token', this._refreshToken);
            }

            if (this._tokenExpiry) {
                localStorage.setItem('token_expiry', this._tokenExpiry.toString());
            }

            if (this._user) {
                localStorage.setItem('auth_user', JSON.stringify(this._user));
                localStorage.setItem('username', this._user.username || '');
            }

            localStorage.setItem('isLoggedIn', 'true');

            console.log('Данные аутентификации сохранены в localStorage');
        } else {
            console.warn('Попытка сохранить пустой токен в localStorage');
        }
    }

    /**
     * Очистка данных аутентификации
     * @private
     */
    _clearAuthData() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');

        this._isAuthenticated = false;
        this._accessToken = null;
        this._refreshToken = null;
        this._tokenExpiry = null;
        this._refreshExpiry = null;
        this._user = null;
    }

    /**
     * Обновление элементов UI с именем пользователя
     * @private
     */
    _updateUIWithUsername() {
        const username = this.getUsername() || 'Пользователь';

        try {
            const usernameElements = document.querySelectorAll(
                '#usernameDisplay, #mobileUsernameDisplay, #welcomeUsername'
            );

            usernameElements.forEach(el => {
                if (el) el.textContent = username;
            });
        } catch (error) {
            // Игнорируем ошибки обновления UI
            console.warn('Ошибка обновления UI:', error);
        }
    }

    /**
     * Пытаемся распарсить информацию из JWT токена
     * @private
     * @param {string} token - JWT токен
     */
    _parseTokenInfo(token) {
        if (!token) return null;

        try {
            // Получаем payload часть JWT токена (вторая часть после точки)
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            // Декодируем Base64
            const payload = JSON.parse(atob(parts[1]));

            return {
                username: payload.preferred_username || payload.username || payload.sub,
                tenantId: payload.tenant_id,
                supplierId: payload.supplier_id,
                roles: payload.realm_access?.roles || []
            };
        } catch (error) {
            console.warn('Ошибка парсинга JWT токена:', error);
            return null;
        }
    }

    /**
     * Выполнение тестового входа (для отладки)
     * @param {string} username - Имя пользователя
     */
    mockLogin(username = 'TestUser') {
        this._user = {
            username: username,
            tenantId: 'default',
            supplierId: 'default',
            roles: ['seller']
        };

        this._accessToken = 'mock-token-' + Date.now();
        this._tokenType = 'Bearer';
        this._tokenExpiry = Date.now() + (3600 * 1000); // 1 час
        this._isAuthenticated = true;

        this._updateLocalStorage();
        this._updateUIWithUsername();

        console.log('Выполнен тестовый вход');

        return true;
    }

    setTenantId(tenantId) {
        if (!tenantId) return false;

        // Обновляем данные пользователя
        if (!this._user) {
            this._user = { username: 'User' };
        }

        this._user.tenantId = tenantId;

        // Сохраняем в localStorage
        this._updateLocalStorage();

        return true;
    }

// Установить supplier_id
    setSupplierId(supplierId) {
        if (!supplierId) return false;

        // Обновляем данные пользователя
        if (!this._user) {
            this._user = { username: 'User' };
        }

        this._user.supplierId = supplierId;

        // Сохраняем в localStorage
        this._updateLocalStorage();

        return true;
    }

    // Получить текущий tenant_id
    getTenantId() {
        return this._user?.tenantId || 'default';
    }

    // Получить текущий supplier_id
    getSupplierId() {
        return this._user?.supplierId || 'default';
    }
}

// Экспортируем экземпляр сервиса
const authService = new SimpleAuthService();
export default authService;