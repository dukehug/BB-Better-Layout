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
        if (document.getElementById('bb-material-icons')) return;

        const link = document.createElement('link');
        link.id = 'bb-material-icons';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        document.head.appendChild(link);
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
            'bb-route-roster',
            /\/ultra\/courses\/[^/]+\/outline\/roster(?:\/|$)/.test(path)
        );
        html.classList.toggle(
            'bb-route-group-space',
            /\/ultra\/courses\/[^/]+\/groups\/enrollments\/group-space(?:\/|$)/.test(path)
        );
    };
})();
