document.addEventListener('DOMContentLoaded', function() {
    // Инициализация профиля пользователя
    initEnhancedProfile();
});

function initEnhancedProfile() {
    // Загрузка данных пользователя
    loadUserData();
    
    // Инициализация меню профиля
    initProfileMenu();
}

function loadUserData() {
    try {
        // Получаем имя пользователя
        const username = localStorage.getItem('username') || 'Пользователь';
        const lastLoginDate = new Date().toLocaleDateString('ru-RU');
        
        // Пытаемся получить более детальные данные о пользователе, если они доступны
        let userRole = 'Продавец';
        let userEmail = '';
        
        try {
            const authUserData = JSON.parse(localStorage.getItem('auth_user') || '{}');
            if (authUserData.email) userEmail = authUserData.email;
            if (authUserData.roles && authUserData.roles.length > 0) {
                const roleMap = {
                    'seller': 'Продавец',
                    'admin': 'Администратор',
                    'manager': 'Менеджер'
                };
                userRole = roleMap[authUserData.roles[0]] || authUserData.roles[0];
            }
        } catch (e) {
            console.error('Ошибка при парсинге данных пользователя:', e);
        }
        
        // Обновление аватара пользователя
        const profileInitial = document.getElementById('profileInitial');
        if (profileInitial) {
            profileInitial.textContent = username.charAt(0).toUpperCase();
        }
        
        // Обновление имени пользователя
        const profileUsername = document.getElementById('profileUsername');
        if (profileUsername) {
            profileUsername.textContent = username;
        }
        
        // Обновление email пользователя
        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail && userEmail) {
            profileEmail.textContent = userEmail;
        } else if (profileEmail) {
            profileEmail.style.display = 'none';
        }
        
        // Обновление роли пользователя
        const profileRole = document.getElementById('profileRole');
        if (profileRole) {
            profileRole.textContent = userRole;
        }
        
        // Обновление данных в развернутом профиле
        const detailUsername = document.getElementById('detailUsername');
        if (detailUsername) {
            detailUsername.textContent = username;
        }
        
        const detailEmail = document.getElementById('detailEmail');
        if (detailEmail) {
            detailEmail.textContent = userEmail || 'Не указан';
        }
        
        const detailRole = document.getElementById('detailRole');
        if (detailRole) {
            detailRole.textContent = userRole;
        }
        
    } catch (e) {
        console.error('Ошибка при загрузке данных пользователя:', e);
    }
}

function initProfileMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const header = item.querySelector('.menu-item-header');
        if (header) {
            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Закрываем все активные элементы меню
                menuItems.forEach(mi => {
                    mi.classList.remove('active');
                });
                
                // Если элемент не был активен, открываем его
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
    
    // Инициализация счетчиков уведомлений
    const notificationCount = 3; // В реальном приложении это значение должно приходить с сервера
    const notificationBadge = document.getElementById('notificationBadge');
    const menuNotificationBadge = document.getElementById('menuNotificationBadge');
    
    if (notificationBadge) {
        if (notificationCount > 0) {
            notificationBadge.textContent = notificationCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
    
    if (menuNotificationBadge) {
        if (notificationCount > 0) {
            menuNotificationBadge.textContent = notificationCount;
            menuNotificationBadge.style.display = 'inline-flex';
        } else {
            menuNotificationBadge.style.display = 'none';
        }
    }
}