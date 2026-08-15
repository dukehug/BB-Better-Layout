// BB Better Layout - course and global sidebar enhancements.
// Handles vertical course navigation, icons, offsets, and custom quick links.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const GLOBAL_NAV_COLLAPSED_KEY = 'bbGlobalNavCollapsed';
    const customLinksApi = BBLayout.customLinks;

    let isGlobalNavCollapsed = false;
    let globalNavPreferenceRequested = false;
    let customLinksConfig = customLinksApi.normalizeConfig();
    let customLinksPreferenceRequested = false;
    let customLinksStorageListenerBound = false;

    function getCleanNavText(element) {
        const clone = element.cloneNode(true);

        clone.querySelectorAll('.bb-nav-icon').forEach(icon => {
            icon.remove();
        });

        return clone.textContent.trim();
    }

    function updateGlobalNavToggle(button) {
        if (!button) return;

        const label = isGlobalNavCollapsed
            ? 'Right Panel Open'
            : 'Right Panel Close';
        const icon = button.querySelector('.bb-global-nav-toggle-icon');

        button.setAttribute('aria-label', label);
        button.setAttribute('aria-expanded', String(!isGlobalNavCollapsed));
        button.title = label;
        if (icon) {
            icon.textContent = isGlobalNavCollapsed
                ? 'right_panel_open'
                : 'right_panel_close';
        }
    }

    function applyGlobalNavState() {
        document
            .querySelectorAll('.bb-global-nav-host')
            .forEach(host => {
                host.classList.toggle(
                    'bb-global-nav-collapsed-host',
                    isGlobalNavCollapsed
                );
            });

        document
            .querySelectorAll('.bb-global-nav-toggle')
            .forEach(updateGlobalNavToggle);
    }

    function loadGlobalNavPreference() {
        if (globalNavPreferenceRequested) return;
        globalNavPreferenceRequested = true;

        chrome.storage.local.get(GLOBAL_NAV_COLLAPSED_KEY, data => {
            isGlobalNavCollapsed = data[GLOBAL_NAV_COLLAPSED_KEY] === true;
            applyGlobalNavState();
        });
    }

    function toggleGlobalNav() {
        isGlobalNavCollapsed = !isGlobalNavCollapsed;
        applyGlobalNavState();
        chrome.storage.local.set({
            [GLOBAL_NAV_COLLAPSED_KEY]: isGlobalNavCollapsed
        });
    }

    function ensureGlobalNavToggle(navContainer, footer) {
        const drawer = navContainer.parentElement;
        const toggleContainer = footer || navContainer;
        let button = drawer?.querySelector('.bb-global-nav-toggle');

        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'bb-global-nav-toggle';

            const icon = document.createElement('span');
            icon.className =
                'material-symbols-outlined bb-nav-icon bb-global-nav-toggle-icon';
            icon.setAttribute('aria-hidden', 'true');

            button.append(icon);
            button.addEventListener('click', toggleGlobalNav);
        }

        // Blackboard renders the legal links in a dedicated footer. Keep the
        // panel control as its final item, including when moving an older
        // injected instance out of <nav> or correcting the previous order.
        if (
            button.parentElement !== toggleContainer ||
            button !== toggleContainer.lastElementChild
        ) {
            toggleContainer.append(button);
        }

        updateGlobalNavToggle(button);
    }

    function addGlobalNavItemLabels(navContainer) {
        navContainer.querySelectorAll('a, button').forEach(item => {
            if (item.classList.contains('bb-global-nav-toggle')) return;

            const label = getCleanNavText(item);
            if (!label) return;

            if (!item.hasAttribute('aria-label')) {
                item.setAttribute('aria-label', label);
            }
            if (!item.hasAttribute('title')) {
                item.title = label;
            }
        });
    }

    function syncCourseNavOffset() {
        const courseNavigation = document.querySelector('bb-course-navigation');
        if (!courseNavigation) return;

        const courseHeader = courseNavigation
            .closest('.bb-course-navigation')
            ?.querySelector('course-page-header header');
        const offsetAnchor = courseHeader || courseNavigation;
        const { bottom } = offsetAnchor.getBoundingClientRect();
        if (!Number.isFinite(bottom) || bottom <= 0) return;

        document.documentElement.style.setProperty(
            '--nav-top-offset',
            `${Math.round(bottom)}px`
        );
    }

    function handleCoursesNav() {
        syncCourseNavOffset();

        const iconMap = {
            "Content": "menu_book",
            "Calendar": "event",
            "Announcements": "campaign",
            "Discussions": "forum",
            "Gradebook": "assessment",
            "Messages": "mail",
            "Groups": "group",
            "Achievements": "emoji_events",
            "Tools": "build"
        };

        const allLinks = Array.from(document.querySelectorAll('a, button'));
        const targetLink = allLinks.find(element => {
            const text = getCleanNavText(element);
            return text === "Calendar" || text === "Gradebook";
        });

        let courseNavContainer = null;

        if (targetLink) {
            let container = targetLink.parentElement;

            for (let i = 0; i < 6; i++) {
                if (!container) break;

                const containerText = getCleanNavText(container);
                const hasContent = containerText.includes("Content");
                const hasDiscussions = containerText.includes("Discussions");

                if (hasContent && hasDiscussions) {
                    courseNavContainer = container;
                    break;
                }

                container = container.parentElement;
            }
        }

        // Blackboard may reuse DOM nodes across SPA routes, so clear stale classes.
        document
            .querySelectorAll('.bb-vertical-nav-container')
            .forEach(existingContainer => {
                if (existingContainer !== courseNavContainer) {
                    existingContainer.classList.remove('bb-vertical-nav-container');
                }
            });

        document.body.classList.toggle(
            'bb-vertical-nav-active',
            Boolean(courseNavContainer)
        );

        if (!courseNavContainer) return;

        courseNavContainer.classList.add('bb-vertical-nav-container');

        const navItems = courseNavContainer.querySelectorAll('a, button');
        navItems.forEach(item => {
            if (item.querySelector('.bb-nav-icon')) return;

            const text = getCleanNavText(item);
            let iconName = "circle";

            for (const [key, value] of Object.entries(iconMap)) {
                if (text.includes(key)) {
                    iconName = value;
                    break;
                }
            }

            const icon = document.createElement('span');
            icon.className = 'material-icons bb-nav-icon';
            icon.innerText = iconName;
            item.prepend(icon);
        });
    }

    function syncQuickLinkSpacing(container) {
        const utilityItems = container.querySelectorAll(
            '.bb-weekly-schedule-nav-button, .bb-study-note-nav-button, .bb-external-quick-link'
        );

        utilityItems.forEach((item, index) => {
            item.style.marginTop = index === 0 ? 'auto' : '';
        });
    }

    function renderCustomLinks(container) {
        const renderSignature = JSON.stringify(customLinksConfig);

        // The page-wide MutationObserver calls this module frequently. Only touch
        // the DOM when storage has actually changed, preventing render loops.
        if (container.dataset.bbCustomLinksSignature !== renderSignature) {
            container
                .querySelectorAll('.bb-external-quick-link')
                .forEach(link => link.remove());

            if (customLinksConfig.enabled) {
                customLinksConfig.links.forEach(config => {
                    const link = document.createElement('a');
                    link.href = config.url;
                    link.className = 'bb-custom-bottom-link bb-external-quick-link';
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.setAttribute('aria-label', config.name);
                    link.title = config.name;

                    const icon = document.createElement('span');
                    icon.className = 'material-icons bb-nav-icon';
                    icon.textContent = config.icon;

                    link.appendChild(icon);
                    link.appendChild(document.createTextNode(config.name));
                    container.appendChild(link);
                });
            }

            container.dataset.bbCustomLinksSignature = renderSignature;
        }

        // Utility features are rendered by separate modules and may appear after
        // custom links, so recompute the first bottom item's flexible spacing.
        syncQuickLinkSpacing(container);
    }

    function requestCustomLinksPreference() {
        if (customLinksPreferenceRequested) return;
        customLinksPreferenceRequested = true;

        chrome.storage.sync.get(customLinksApi.STORAGE_KEY, data => {
            if (!chrome.runtime.lastError) {
                customLinksConfig = customLinksApi.normalizeConfig(
                    data[customLinksApi.STORAGE_KEY]
                );
            }

            handleGlobalNav();
        });
    }

    function bindCustomLinksStorageListener() {
        if (customLinksStorageListenerBound) return;
        customLinksStorageListenerBound = true;

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync' || !changes[customLinksApi.STORAGE_KEY]) {
                return;
            }

            customLinksConfig = customLinksApi.normalizeConfig(
                changes[customLinksApi.STORAGE_KEY].newValue
            );
            handleGlobalNav();
        });
    }

    function handleGlobalNav() {
        const globalList = document.getElementById('base_tools');
        if (!globalList) return;

        const navContainer = globalList.closest('nav') || globalList.parentElement;
        if (!navContainer) return;

        const drawer = navContainer.parentElement;
        const host = navContainer.closest('base-side-menu');
        const footer = Array.from(drawer?.children || []).find(element => {
            return element.getAttribute('role') === 'contentinfo';
        });

        navContainer.classList.add('bb-global-nav');
        drawer?.classList.add('bb-global-nav-drawer');
        host?.classList.add('bb-global-nav-host');
        footer?.classList.add('bb-global-nav-footer');

        navContainer.style.display = 'flex';
        navContainer.style.flexDirection = 'column';
        navContainer.style.height = '100%';
        ensureGlobalNavToggle(navContainer, footer);
        renderCustomLinks(navContainer);
        addGlobalNavItemLabels(navContainer);
        applyGlobalNavState();
    }

    function run() {
        loadGlobalNavPreference();
        requestCustomLinksPreference();
        bindCustomLinksStorageListener();
        handleCoursesNav();
        handleGlobalNav();
    }

    BBLayout.sidebar = {
        run,
        syncCourseNavOffset
    };
})();
