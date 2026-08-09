// BB Better Layout - reading theme management.
// Applies the saved theme and keeps it in sync with chrome.storage changes.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};

    const THEME_CONFIG = {
        'nord-snow': { themeClass: 'bb-theme-nord-snow' },
        'paper-reading': {
            baseClass: 'bb-theme-nord-snow',
            themeClass: 'bb-theme-paper'
        },
        'sage-reading': {
            baseClass: 'bb-theme-nord-snow',
            themeClass: 'bb-theme-sage'
        },
        'sky-reading': {
            baseClass: 'bb-theme-nord-snow',
            themeClass: 'bb-theme-sky'
        },
        'lavender-reading': {
            baseClass: 'bb-theme-nord-snow',
            themeClass: 'bb-theme-lavender'
        },
        'graphite-reading': {
            baseClass: 'bb-theme-nord-snow',
            themeClass: 'bb-theme-graphite'
        },
        'aqua-reading': {
            baseClass: 'bb-theme-nord-snow',
            themeClass: 'bb-theme-aqua'
        },
        'rose-reading': {
            baseClass: 'bb-theme-nord-snow',
            themeClass: 'bb-theme-rose'
        },
    };

    function applyTheme(themeKey) {
        const html = document.documentElement;

        // Remove current and legacy theme classes before applying the saved theme.
        html.classList.remove('mode-dark');
        Array.from(html.classList)
            .filter(className => className.startsWith('bb-theme-'))
            .forEach(className => html.classList.remove(className));

        if (!themeKey) return;

        const config = THEME_CONFIG[themeKey];
        if (!config) return;

        if (config.baseClass) html.classList.add(config.baseClass);
        if (config.themeClass) html.classList.add(config.themeClass);
    }

    function loadAndApplyTheme() {
        chrome.storage.sync.get('bbTheme', (data) => {
            applyTheme(data.bbTheme || null);
        });
    }

    function initialize() {
        loadAndApplyTheme();

        chrome.storage.onChanged.addListener((changes) => {
            if (changes.bbTheme) {
                applyTheme(changes.bbTheme.newValue || null);
            }
        });
    }

    BBLayout.theme = {
        applyTheme,
        initialize
    };
})();
