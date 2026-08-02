// BB Better Layout - back-to-top control.
// Supports both document scrolling and Blackboard's internal scroll container.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    let activeScrollContainer = null;

    function isScrollableElement(element) {
        return element instanceof Element
            && element.scrollHeight > element.clientHeight + 1;
    }

    function getScrollContainer() {
        if (activeScrollContainer?.isConnected && isScrollableElement(activeScrollContainer)) {
            return activeScrollContainer;
        }

        const mainScrollContainer = document.querySelector('#main-content-scroll-container');
        if (isScrollableElement(mainScrollContainer)) {
            activeScrollContainer = mainScrollContainer;
            return mainScrollContainer;
        }

        activeScrollContainer = document.scrollingElement || document.documentElement;
        return activeScrollContainer;
    }

    function updateVisibility() {
        const button = document.getElementById('bb-back-to-top');
        if (!button) return;

        const container = getScrollContainer();
        const distanceFromBottom = container.scrollHeight
            - container.clientHeight
            - container.scrollTop;
        const shouldShow = container.scrollTop > 200 && distanceFromBottom <= 120;

        button.classList.toggle('bb-back-to-top-visible', shouldShow);
        button.setAttribute('aria-hidden', String(!shouldShow));
        button.tabIndex = shouldShow ? 0 : -1;
    }

    function ensureButton() {
        if (document.getElementById('bb-back-to-top')) return;

        const button = document.createElement('button');
        button.id = 'bb-back-to-top';
        button.type = 'button';
        button.textContent = '↑';
        button.title = 'Back to top';
        button.setAttribute('aria-label', 'Back to top');
        button.setAttribute('aria-hidden', 'true');
        button.tabIndex = -1;

        button.addEventListener('click', () => {
            const container = getScrollContainer();
            const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth';

            if (
                container === document.scrollingElement
                || container === document.documentElement
                || container === document.body
            ) {
                window.scrollTo({ top: 0, behavior });
            } else {
                container.scrollTo({ top: 0, behavior });
            }
        });

        document.body.appendChild(button);
    }

    const scheduleUpdate = BBLayout.debounce(updateVisibility, 80);

    function initialize() {
        // Blackboard pages may scroll either the document or an internal container.
        document.addEventListener('scroll', (event) => {
            if (isScrollableElement(event.target)) {
                activeScrollContainer = event.target;
            }
            scheduleUpdate();
        }, { capture: true, passive: true });

        window.addEventListener('scroll', () => {
            activeScrollContainer = document.scrollingElement || document.documentElement;
            scheduleUpdate();
        }, { passive: true });

        window.addEventListener('resize', scheduleUpdate, { passive: true });
    }

    function run() {
        ensureButton();
        updateVisibility();
    }

    BBLayout.backToTop = {
        initialize,
        run
    };
})();
