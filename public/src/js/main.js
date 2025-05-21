import authService from './simple-auth-service.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Простая инициализация
        await authService.init();

        // Если пользователь аутентифицирован, обновляем UI
        if (authService.isAuthenticated()) {
            console.log("Пользователь аутентифицирован");
            const username = authService.getUsername();
            if (username) {
                const usernameDisplayElements = document.querySelectorAll('#usernameDisplay, #mobileUsernameDisplay, #welcomeUsername');
                usernameDisplayElements.forEach(el => {
                    if (el) el.textContent = username;
                });
            }
        } else {
            console.log("Пользователь не аутентифицирован. Перенаправление на страницу входа...");
            window.location.href = '/';
        }
    } catch (error) {
        console.error("Ошибка при инициализации сервиса аутентификации:", error);
        if (typeof toastr !== 'undefined') {
            toastr.error("Ошибка аутентификации. Пожалуйста, попробуйте позже.");
        }
    }

    // Остальной код остается без изменений
    const logoutLinks = document.querySelectorAll('#logoutLink, #mobileLogoutLink');
    logoutLinks.forEach(link => {
        if (link) {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                authService.logout();
            });
        }
    });
});