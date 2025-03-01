
function displayUsername() {
    const username = localStorage.getItem('username');
    console.log("Username from localStorage: ", username);
    if (username) {
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        } else {
            console.error("Элемент с id 'usernameDisplay' не найден");
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    displayUsername();
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(event) {
            event.preventDefault();

            localStorage.removeItem('username');
            localStorage.removeItem('isLoggedIn');

            toastr.success("Вы успешно вышли из системы.");

            setTimeout(function() {
                window.location.replace('./index.html');
            }, 2000);
        });
    } else {
        console.error("Элемент с id 'logoutLink' не найден");
    }
});
