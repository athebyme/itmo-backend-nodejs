document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn')) {
        window.location.replace('./main.html');
    } else {
        toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: 'toast-top-right',
            timeOut: '10000'
        };

        toastr.info("password : 111");
        toastr.info("username : admin");
        toastr.info("Тестовая версия. Есть вход только для админа:");

        const loginForm = document.getElementById('loginForm');

        const validUsername = 'admin';
        const validPassword = '111';

        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === validUsername && password === validPassword) {
                localStorage.setItem('username', username);
                localStorage.setItem('isLoggedIn', 'true');

                if (typeof toastr !== 'undefined') {
                    toastr.success('Вы успешно вошли в систему!');
                } else {
                    console.error('Toastr не загружен!');
                }

                setTimeout(function() {
                    window.location.replace('./main.html');
                }, 1000);
            } else {
                if (typeof toastr !== 'undefined') {
                    toastr.error('Неверное имя пользователя или пароль!');
                } else {
                    console.error('Toastr не загружен!');
                }
            }
        });
    }
});
