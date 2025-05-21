import authService from './simple-auth-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        try {
            // Показываем индикатор загрузки, если есть
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Вход...';
            }

            // Получаем значения полей
            const usernameValue = username.value.trim();
            const passwordValue = password.value;

            if (!usernameValue || !passwordValue) {
                showError('Введите имя пользователя и пароль');
                return;
            }

            // Пытаемся выполнить вход
            await authService.login(usernameValue, passwordValue);

            // Выводим консоль для проверки
            console.log('Проверка после входа:', {
                isAuthenticated: authService.isAuthenticated(),
                username: authService.getUsername(),
                token: localStorage.getItem('auth_token') ? 'Установлен' : 'Отсутствует'
            });


            // Показываем сообщение об успехе
            if (typeof toastr !== 'undefined') {
                toastr.success('Успешный вход в систему');
            }

            // Перенаправляем на главную страницу после успешного входа
            setTimeout(() => {
                window.location.href = '/main';
            }, 2000);

        } catch (error) {
            // Обрабатываем ошибку
            console.error('Ошибка входа:', error);
            showError(error.message || 'Ошибка аутентификации');

            // Возвращаем кнопку в исходное состояние
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Войти в систему';
            }
        }
    });

    // Функция для отображения ошибки
    function showError(message) {
        // Проверяем, есть ли toastr
        if (typeof toastr !== 'undefined') {
            toastr.error(message);
            return;
        }

        // Если нет toastr, создаем свое сообщение об ошибке
        let errorDiv = document.querySelector('.login-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger login-error mt-3';
            loginForm.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
    }

    // Слушатель для кнопки тестового входа, если она есть
    const mockLoginBtn = document.getElementById('mockLoginBtn');
    if (mockLoginBtn) {
        mockLoginBtn.addEventListener('click', function(event) {
            event.preventDefault();

            // Используем тестовый вход
            authService.mockLogin('TestSeller');

            // Показываем сообщение
            if (typeof toastr !== 'undefined') {
                toastr.info('Выполнен тестовый вход');
            }

            // Перенаправляем на главную
            setTimeout(() => {
                window.location.href = '/main';
            }, 1500);
        });
    }

    // Проверяем, есть ли у нас активная сессия
    checkSession();

    // Функция для проверки существующей сессии
    async function checkSession() {
        try {
            const isLoggedIn = await authService.init();
            if (isLoggedIn) {
                // Если пользователь уже аутентифицирован, перенаправляем на главную
                window.location.href = '/main';
            } else if (!mockLoginBtn) {
                // Если нет кнопки тестового входа, добавляем ее
                addMockLoginButton();
            }
        } catch (error) {
            console.warn('Ошибка проверки сессии:', error);

            // Добавляем кнопку тестового входа в случае ошибки
            addMockLoginButton();
        }
    }

    // Функция для добавления кнопки тестового входа
    function addMockLoginButton() {
        // Проверяем, не добавлена ли уже кнопка
        if (document.getElementById('mockLoginBtn')) {
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            // Создаем контейнер для тестового входа
            const testLoginContainer = document.createElement('div');
            testLoginContainer.className = 'mt-3 text-center';
            testLoginContainer.innerHTML = `
                <hr>
                <p class="text-muted">или используйте тестовый вход для разработки:</p>
                <button id="mockLoginBtn" class="btn btn-outline-secondary w-100">
                    <i class="bi bi-bug me-2"></i>Тестовый вход
                </button>
            `;

            // Добавляем после формы
            submitBtn.parentNode.after(testLoginContainer);

            // Добавляем слушатель
            document.getElementById('mockLoginBtn').addEventListener('click', function(event) {
                event.preventDefault();

                // Используем тестовый вход
                authService.mockLogin('TestSeller');

                // Показываем сообщение
                if (typeof toastr !== 'undefined') {
                    toastr.info('Выполнен тестовый вход');
                }

                // Перенаправляем на главную
                setTimeout(() => {
                    window.location.href = '/main';
                }, 1500);
            });
        }
    }
});