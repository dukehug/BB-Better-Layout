// BB Better Layout - local course cover management.
// Applies an optional device-local image to Blackboard course-page banners.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const IMAGE_STORAGE_KEY = 'bbCourseCoverImage';
    const POSITION_STORAGE_KEY = 'bbCourseCoverPosition';
    const DEFAULT_POSITION = { x: 50, y: 50 };

    function isSupportedImageDataUrl(value) {
        return typeof value === 'string'
            && /^data:image\/(?:jpeg|png|webp);base64,/i.test(value);
    }

    function normalizePosition(position) {
        const x = Number(position?.x);
        const y = Number(position?.y);

        return {
            x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : DEFAULT_POSITION.x,
            y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : DEFAULT_POSITION.y
        };
    }

    function applyCourseCoverPosition(position) {
        const normalizedPosition = normalizePosition(position);
        document.documentElement.style.setProperty(
            '--bb-course-cover-position',
            `${normalizedPosition.x}% ${normalizedPosition.y}%`
        );
    }

    function applyCourseCover(imageDataUrl, position = DEFAULT_POSITION) {
        const html = document.documentElement;

        if (!isSupportedImageDataUrl(imageDataUrl)) {
            html.classList.remove('bb-custom-course-cover');
            html.style.removeProperty('--bb-course-cover-image');
            html.style.removeProperty('--bb-course-cover-position');
            return;
        }

        html.style.setProperty(
            '--bb-course-cover-image',
            `url("${imageDataUrl}")`
        );
        applyCourseCoverPosition(position);
        html.classList.add('bb-custom-course-cover');
    }

    function initialize() {
        chrome.storage.local.get(
            [IMAGE_STORAGE_KEY, POSITION_STORAGE_KEY],
            (data) => {
                applyCourseCover(
                    data[IMAGE_STORAGE_KEY],
                    data[POSITION_STORAGE_KEY]
                );
            }
        );

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'local') return;

            if (changes[IMAGE_STORAGE_KEY]) {
                chrome.storage.local.get(POSITION_STORAGE_KEY, (data) => {
                    applyCourseCover(
                        changes[IMAGE_STORAGE_KEY].newValue,
                        data[POSITION_STORAGE_KEY]
                    );
                });
                return;
            }

            if (changes[POSITION_STORAGE_KEY]) {
                applyCourseCoverPosition(
                    changes[POSITION_STORAGE_KEY].newValue
                );
            }
        });
    }

    BBLayout.courseCover = {
        applyCourseCover,
        applyCourseCoverPosition,
        initialize
    };
})();
