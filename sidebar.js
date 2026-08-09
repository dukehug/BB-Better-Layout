// BB Better Layout - course and global sidebar enhancements.
// Handles vertical course navigation, icons, offsets, and custom quick links.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};

    function getCleanNavText(element) {
        const clone = element.cloneNode(true);

        clone.querySelectorAll('.bb-nav-icon').forEach(icon => {
            icon.remove();
        });

        return clone.textContent.trim();
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

    function appendCustomLinks(container) {
        if (container.querySelector('.bb-custom-bottom-link')) return;

        const linksConfig = [
            { text: "    Schedule App", url: "https://weekly.52hz.im/", icon: "view_timeline" },
            { text: "    Out look", url: "https://outlook.cloud.microsoft/mail/", icon: "mail" },
            { text: "    AdU Live", url: "https://live.adamson.edu.ph", icon: "school" },
            { text: "    AdU Calendar", url: "https://www.adamson.edu.ph/v1/?page=academic-calendar", icon: "event" }
        ];

        linksConfig.forEach((config, index) => {
            const link = document.createElement('a');
            link.href = config.url;
            link.className = 'bb-custom-bottom-link';
            link.target = "_blank";

            if (index === 0) link.style.marginTop = "auto";

            const icon = document.createElement('span');
            icon.className = 'material-icons bb-nav-icon';
            icon.innerText = config.icon;

            link.appendChild(icon);
            link.appendChild(document.createTextNode(config.text));
            container.appendChild(link);
        });
    }

    function handleGlobalNav() {
        const globalList = document.getElementById('base_tools');
        if (!globalList) return;

        const navContainer = globalList.closest('nav') || globalList.parentElement;
        if (!navContainer) return;

        navContainer.style.display = 'flex';
        navContainer.style.flexDirection = 'column';
        navContainer.style.height = '100%';
        appendCustomLinks(navContainer);
    }

    function run() {
        handleCoursesNav();
        handleGlobalNav();
    }

    BBLayout.sidebar = {
        run,
        syncCourseNavOffset
    };
})();
