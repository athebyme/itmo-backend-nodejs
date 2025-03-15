(function() {
    window.addEventListener("load", function() {
        const loadTime = (performance.now() / 1000).toFixed(3);
        const footer = document.querySelector(".footer__text");
        if (footer) {
            footer.innerHTML += `<br>Page load time: <span style="color: red;">${loadTime}</span> seconds`;
        }
    });
})();
