document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('main.html')) {
        document.getElementById('home-link').classList.add('active');
    } else if (path.includes('stats.html')) {
        document.getElementById('stats-link').classList.add('active');
    } else if (path.includes('constructor.html')) {
        document.getElementById('constructor-link').classList.add('active');
    } else if (path.includes('wildberries.html')) {
        document.getElementById('wildberries-link').classList.add('active');
    }

    var navbarToggler = document.querySelector('.navbar-toggler');
    navbarToggler.addEventListener('click', function() {
        var navbarNav = document.getElementById('navbarNav');
        navbarNav.classList.toggle('show');
    });
});