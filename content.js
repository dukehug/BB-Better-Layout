// BB Better Layout - content script coordinator.
// Initializes feature modules and reruns DOM enhancements after SPA updates.

(() => {
    const BBLayout = window.BBLayout;

    function runAllEnhancements() {
        BBLayout.syncRouteClasses();
        BBLayout.groupSpace.run();
        BBLayout.injectIconStyles();
        BBLayout.banner.run();
        BBLayout.sidebar.run();
        BBLayout.backToTop.run();
    }

    BBLayout.theme.initialize();
    BBLayout.courseCover.initialize();
    BBLayout.groupSpace.initialize();
    BBLayout.backToTop.initialize();
    runAllEnhancements();

    // Blackboard Ultra is an SPA and renders most target elements asynchronously.
    const observer = new MutationObserver(BBLayout.debounce(() => {
        runAllEnhancements();
    }, 200));
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener(
        'resize',
        BBLayout.debounce(BBLayout.sidebar.syncCourseNavOffset, 100),
        { passive: true }
    );
})();
