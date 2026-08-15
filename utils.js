// BB Better Layout - shared helpers and route state.
// This file must load before the feature modules that use BBLayout utilities.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};

    BBLayout.debounce = function debounce(func, wait) {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    BBLayout.injectIconStyles = function injectIconStyles() {
        if (!document.getElementById('bb-material-icons')) {
            const iconsLink = document.createElement('link');
            iconsLink.id = 'bb-material-icons';
            iconsLink.rel = 'stylesheet';
            iconsLink.href =
                'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(iconsLink);
        }

        if (!document.getElementById('bb-material-symbols')) {
            const symbolsLink = document.createElement('link');
            symbolsLink.id = 'bb-material-symbols';
            symbolsLink.rel = 'stylesheet';
            symbolsLink.href =
                'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0';
            document.head.appendChild(symbolsLink);
        }
    };

    BBLayout.syncRouteClasses = function syncRouteClasses() {
        const path = window.location.pathname.replace(/\/+$/, '');
        const html = document.documentElement;

        html.classList.toggle(
            'bb-route-stream',
            /\/ultra\/stream(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-courses',
            /\/ultra\/course(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-calendar',
            /\/ultra\/calendar(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-messages',
            /\/ultra\/messages(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-grades',
            /\/ultra\/grades(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-tools',
            /\/ultra\/tools(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-roster',
            /\/ultra\/courses\/[^/]+\/outline\/roster(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-group-space',
            /\/ultra\/courses\/[^/]+\/groups\/enrollments\/group-space(?:\/|$)/.test(path)
        );
    };
})();
