// BB Better Layout - course card banner enhancement.
// Replaces image banners with the course title and section number.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};

    function extractSectionNumber(card) {
        const element = card.querySelector('[class*="multi-column-course-id"]')
            || card.querySelector('[id^="course-id-"]');
        if (!element) return '';

        const text = element.textContent.trim();
        if (!text) return '';

        const parts = text.split('-');
        return parts[parts.length - 1].trim();
    }

    function injectTitlesToBanners() {
        const cards = document.querySelectorAll('bb-base-course-card');

        cards.forEach(card => {
            const banner = card.querySelector('.course-banner');
            const titleElement = card.querySelector('.js-course-title-element')
                || card.querySelector('h4[id^="course-name-"]');

            if (!banner || !titleElement) return;

            const titleText = titleElement.textContent.trim();
            const sectionNumber = extractSectionNumber(card);
            const contentKey = `${titleText}|${sectionNumber}`;

            // Blackboard rerenders cards often, so avoid rebuilding unchanged banners.
            if (banner.dataset.bbContentKey === contentKey) return;
            banner.dataset.bbContentKey = contentKey;
            banner.innerHTML = '';

            const title = document.createElement('div');
            title.className = 'bb-custom-banner-text';
            title.innerText = titleText;
            banner.appendChild(title);

            if (sectionNumber) {
                const section = document.createElement('div');
                section.className = 'bb-course-section-number';
                section.innerText = `#${sectionNumber}`;
                banner.appendChild(section);
            }
        });
    }

    BBLayout.banner = {
        run: injectTitlesToBanners
    };
})();
