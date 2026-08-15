// BB Better Layout - shared custom-link configuration.
// This module is loaded by both the options page and the Blackboard content scripts.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};

    const STORAGE_KEY = 'bbCustomLinks';
    const MAX_LINKS = 6;
    const MAX_NAME_LENGTH = 40;
    const MAX_URL_LENGTH = 2048;
    const DEFAULT_ICON = 'link';

    // A focused Material Icons catalogue keeps the picker useful without making
    // users search through thousands of glyph names.
    const ICON_OPTIONS = Object.freeze([
        { value: 'link', label: 'Link' },
        { value: 'public', label: 'Public' },
        { value: 'language', label: 'Website' },
        { value: 'school', label: 'School' },
        { value: 'menu_book', label: 'Book' },
        { value: 'library_books', label: 'Library' },
        { value: 'mail', label: 'Mail' },
        { value: 'event', label: 'Calendar' },
        { value: 'schedule', label: 'Schedule' },
        { value: 'video_call', label: 'Video call' },
        { value: 'groups', label: 'Groups' },
        { value: 'forum', label: 'Forum' },
        { value: 'description', label: 'Document' },
        { value: 'folder', label: 'Folder' },
        { value: 'cloud', label: 'Cloud' },
        { value: 'dashboard', label: 'Dashboard' },
        { value: 'science', label: 'Science' },
        { value: 'code', label: 'Code' },
        { value: 'terminal', label: 'Terminal' },
        { value: 'work', label: 'Work' },
        { value: 'campaign', label: 'Announcement' },
        { value: 'help', label: 'Help' },
        { value: 'star', label: 'Star' },
        { value: 'launch', label: 'Launch' }
    ]);
    const ALLOWED_ICONS = new Set(ICON_OPTIONS.map(option => option.value));

    function normalizeName(value) {
        if (typeof value !== 'string') return '';

        return value
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, MAX_NAME_LENGTH);
    }

    function normalizeUrl(value) {
        if (
            typeof value !== 'string' ||
            !value.trim() ||
            value.trim().length > MAX_URL_LENGTH
        ) {
            return '';
        }

        try {
            const url = new URL(value.trim());

            // Only normal web destinations are allowed. In particular, this
            // rejects javascript:, data:, file:, and browser-internal URLs.
            if (url.protocol !== 'https:' && url.protocol !== 'http:') {
                return '';
            }

            return url.href;
        } catch (_error) {
            return '';
        }
    }

    function normalizeIcon(value) {
        return ALLOWED_ICONS.has(value) ? value : DEFAULT_ICON;
    }

    function normalizeLink(link) {
        const name = normalizeName(link?.name);
        const url = normalizeUrl(link?.url);

        if (!name || !url) return null;

        return {
            name,
            url,
            icon: normalizeIcon(link?.icon)
        };
    }

    function normalizeConfig(value) {
        const links = Array.isArray(value?.links)
            ? value.links
                .map(normalizeLink)
                .filter(Boolean)
                .slice(0, MAX_LINKS)
            : [];

        return {
            enabled: value?.enabled === true,
            links
        };
    }

    BBLayout.customLinks = Object.freeze({
        STORAGE_KEY,
        MAX_LINKS,
        MAX_NAME_LENGTH,
        MAX_URL_LENGTH,
        DEFAULT_ICON,
        ICON_OPTIONS,
        normalizeName,
        normalizeUrl,
        normalizeIcon,
        normalizeLink,
        normalizeConfig
    });
})();
