import authService from './authorization.js';

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const isAuthenticated = await authService.init();

        if (isAuthenticated) {
            console.log("Пользователь аутентифицирован через Keycloak в main.js!");
            const username = authService.getUsername();
            if (username) {
                const usernameDisplayElements = document.querySelectorAll('#usernameDisplay, #mobileUsernameDisplay, #welcomeUsername');
                usernameDisplayElements.forEach(el => {
                    if (el) el.textContent = username;
                });
            }
        } else {
            console.log("Пользователь не аутентифицирован (main.js). Используется onLoad: 'check-sso'.");
        }
    } catch (error) {
        console.error("Ошибка инициализации аутентификации Keycloak в main.js:", error);
        if (typeof toastr !== 'undefined') {
            toastr.error("Ошибка аутентификации. Пожалуйста, попробуйте позже.");
        }
    }

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
