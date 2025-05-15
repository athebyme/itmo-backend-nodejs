document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('main')) {
        document.getElementById('home-link').classList.add('active');
    } else if (path.includes('stats')) {
        document.getElementById('stats-link').classList.add('active');
    } else if (path.includes('constructor')) {
        document.getElementById('constructor-link').classList.add('active');
    } else if (path.includes('wildberries')) {
        document.getElementById('wildberries-link').classList.add('active');
    }else if (path.includes('articul-parser')) {
        document.getElementById('articul-parser-link').classList.add('active');
    }

    var navbarToggler = document.querySelector('.navbar-toggler');
    navbarToggler.addEventListener('click', function() {
        var navbarNav = document.getElementById('navbarNav');
        navbarNav.classList.toggle('show');
    });
});