// ==========================================
// 1. 引入 Google Material Icons
// ==========================================
function injectIconStyles() {
    if (!document.getElementById('bb-material-icons')) {
        const link = document.createElement('link');
        link.id = 'bb-material-icons';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        document.head.appendChild(link);
    }
}

// ==========================================
// 工具函數: 防抖動
// ==========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================================
// 功能 0: 主題管理
// ==========================================
//
// 原理：所有閱讀主題都以 Nord Snow 的穩定亮色相容層為基礎，
// 再透過各自的 bb-theme-* class 覆蓋 Blackboard 的 --palette-* 變量。
//
// 主題映射：
//   null / ''       → Default Light（不改動任何 class）
//   'nord-snow'     → 只加 html.bb-theme-nord-snow（亮色主題，不用 mode-dark）
//   'paper-reading' → Nord Snow 亮色相容層 + html.bb-theme-paper（暖色紙張）
//   'sage-reading'  → Nord Snow 亮色相容層 + html.bb-theme-sage
//   'sky-reading'   → Nord Snow 亮色相容層 + html.bb-theme-sky
//   'lavender-reading' → Nord Snow 亮色相容層 + html.bb-theme-lavender

const BB_THEME_CONFIG = {
    'nord-snow':    { themeClass: 'bb-theme-nord-snow' },
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
};

/**
 * 應用指定主題到 <html> 元素。
 * @param {string|null} themeKey - 主題 key（見 BB_THEME_CONFIG），null 表示默認亮色
 */
function applyTheme(themeKey) {
    const html = document.documentElement;

    // 清除目前及舊版本留下的所有主題 class
    html.classList.remove('mode-dark');
    Array.from(html.classList)
        .filter(className => className.startsWith('bb-theme-'))
        .forEach(className => html.classList.remove(className));

    if (!themeKey) return; // 默認亮色，不添加任何 class

    const config = BB_THEME_CONFIG[themeKey];
    if (!config) return;

    if (config.baseClass)  html.classList.add(config.baseClass);
    if (config.themeClass) html.classList.add(config.themeClass);
}

/** 從 chrome.storage 讀取主題並立即應用 */
function loadAndApplyTheme() {
    chrome.storage.sync.get('bbTheme', (data) => {
        applyTheme(data.bbTheme || null);
    });
}

// ==========================================
// 功能 1: 課程 Banner 標題替換 + Section Number
// ==========================================

/**
 * 從 course card 中提取 section number。
 * 格式示例: "2025-2026-2-29122" → 取最後一段 "29122"
 * @param {Element} card - bb-base-course-card 元素
 * @returns {string} section number 字符串，找不到則返回空字符串
 */
function extractSectionNumber(card) {
    // 優先用 class 查找，備用 id 前綴查找
    const el = card.querySelector('[class*="multi-column-course-id"]')
            || card.querySelector('[id^="course-id-"]');
    if (!el) return '';

    const text = el.textContent.trim();
    if (!text) return '';

    // 取最後一個 "-" 後的片段作為 section number
    // 例: "2025-2026-2-29122" → "29122"
    const parts = text.split('-');
    return parts[parts.length - 1].trim();
}

function injectTitlesToBanners() {
    const cards = document.querySelectorAll('bb-base-course-card');
    cards.forEach(card => {
        const banner      = card.querySelector('.course-banner');
        const titleElement = card.querySelector('.js-course-title-element')
                          || card.querySelector('h4[id^="course-name-"]');

        if (!banner || !titleElement) return;

        const titleText     = titleElement.textContent.trim();
        const sectionNumber = extractSectionNumber(card);

        // 用 data 屬性緩存已渲染的內容，避免重複 DOM 操作
        const contentKey = `${titleText}|${sectionNumber}`;
        if (banner.dataset.bbContentKey === contentKey) return;
        banner.dataset.bbContentKey = contentKey;

        // 清空並重建 banner 內容
        banner.innerHTML = '';

        // 主標題
        const titleDiv = document.createElement('div');
        titleDiv.className = 'bb-custom-banner-text';
        titleDiv.innerText = titleText;
        banner.appendChild(titleDiv);

        // Section number（僅在找到時顯示）
        if (sectionNumber) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'bb-course-section-number';
            sectionDiv.innerText = `#${sectionNumber}`;
            banner.appendChild(sectionDiv);
        }
    });
}

// ==========================================
// 功能 2: 左側導航欄 (含圖標)
// ==========================================
/**
 * 取得導航項目的純文字。
 *
 * 我們自己加入的 Material Icon 也有文字內容，例如 "event"，
 * 因此判斷導航名稱前，要先排除 .bb-nav-icon。
 */
function getCleanNavText(element) {
    const clone = element.cloneNode(true);

    clone.querySelectorAll('.bb-nav-icon').forEach(icon => {
        icon.remove();
    });

    return clone.textContent.trim();
}

/**
 * 讓固定定位的課程側欄緊接在 Blackboard 課程頂部列下方。
 * getBoundingClientRect().bottom 是頂部列相對於目前視窗的底部位置，
 * 可以直接作為 position: fixed 元素的 top 值。
 */
function syncCourseNavOffset() {
    const courseNavigation = document.querySelector('bb-course-navigation');
    if (!courseNavigation) return;

    const { bottom } = courseNavigation.getBoundingClientRect();
    if (!Number.isFinite(bottom) || bottom <= 0) return;

    document.documentElement.style.setProperty(
        '--nav-top-offset',
        `${Math.round(bottom)}px`
    );
}

function handleCoursesNav() {
    syncCourseNavOffset();

    const iconMap = {
        "Content":       "menu_book",
        "Calendar":      "event",
        "Announcements": "campaign",
        "Discussions":   "forum",
        "Gradebook":     "assessment",
        "Messages":      "mail",
        "Groups":        "group",
        "Achievements":  "emoji_events",
        "Tools":         "build"
    };

    const allLinks = Array.from(
        document.querySelectorAll('a, button')
    );

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

    /*
     * 清除已經不再是課程導航的舊容器 class。
     * 如果 Blackboard 重複使用同一個 DOM 元素，
     * 也不會留下舊版面設定。
     */
    document
        .querySelectorAll('.bb-vertical-nav-container')
        .forEach(existingContainer => {
            if (existingContainer !== courseNavContainer) {
                existingContainer.classList.remove(
                    'bb-vertical-nav-container'
                );
            }
        });

    /*
     * 找到課程導航時加入 body class。
     * 找不到時自動移除 body class。
     */
    document.body.classList.toggle(
        'bb-vertical-nav-active',
        Boolean(courseNavContainer)
    );

    /*
     * 不在單一課程頁時，到這裡就停止。
     */
    if (!courseNavContainer) return;

    courseNavContainer.classList.add(
        'bb-vertical-nav-container'
    );

    const navItems = courseNavContainer.querySelectorAll(
        'a, button'
    );

    navItems.forEach(item => {
        /*
         * 已經有我們加入的圖示時，不要重複加入。
         */
        if (item.querySelector('.bb-nav-icon')) return;

        const text = getCleanNavText(item);

        let iconName = "circle";

        for (const [key, value] of Object.entries(iconMap)) {
            if (text.includes(key)) {
                iconName = value;
                break;
            }
        }

        const iconSpan = document.createElement('span');

        iconSpan.className = 'material-icons bb-nav-icon';
        iconSpan.innerText = iconName;

        item.prepend(iconSpan);
    });
}

// ==========================================
// 功能 3: 處理「全域」導航 (Global Nav)
// ==========================================
function appendCustomLinks(container) {
    if (container.querySelector('.bb-custom-bottom-link')) return;

    const linksConfig = [
        { text: "    Outlook",      url: "https://outlook.cloud.microsoft/mail/",                    icon: "mail" },
        { text: "    AdU Live",     url: "https://live.adamson.edu.ph",                              icon: "school" },
        { text: "    AdU Calendar", url: "https://www.adamson.edu.ph/v1/?page=academic-calendar",    icon: "event"  }
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

    navContainer.style.display       = 'flex';
    navContainer.style.flexDirection = 'column';
    navContainer.style.height        = '100%';

    appendCustomLinks(navContainer);
}

// ==========================================
// 執行邏輯
// ==========================================
function syncRouteClasses() {
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
}

// ==========================================
// 功能 4: 回到頂部按鈕
// ==========================================
let bbActiveScrollContainer = null;

function isScrollableElement(element) {
    return element instanceof Element && element.scrollHeight > element.clientHeight + 1;
}

function getBackToTopScrollContainer() {
    if (bbActiveScrollContainer?.isConnected && isScrollableElement(bbActiveScrollContainer)) {
        return bbActiveScrollContainer;
    }

    const mainScrollContainer = document.querySelector('#main-content-scroll-container');
    if (isScrollableElement(mainScrollContainer)) {
        bbActiveScrollContainer = mainScrollContainer;
        return mainScrollContainer;
    }

    bbActiveScrollContainer = document.scrollingElement || document.documentElement;
    return bbActiveScrollContainer;
}

function updateBackToTopVisibility() {
    const button = document.getElementById('bb-back-to-top');
    if (!button) return;

    const container = getBackToTopScrollContainer();
    const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    const shouldShow = container.scrollTop > 200 && distanceFromBottom <= 120;

    button.classList.toggle('bb-back-to-top-visible', shouldShow);
    button.setAttribute('aria-hidden', String(!shouldShow));
    button.tabIndex = shouldShow ? 0 : -1;
}

function ensureBackToTopButton() {
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
        const container = getBackToTopScrollContainer();
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth';

        if (container === document.scrollingElement || container === document.documentElement || container === document.body) {
            window.scrollTo({ top: 0, behavior });
        } else {
            container.scrollTo({ top: 0, behavior });
        }
    });

    document.body.appendChild(button);
}

const scheduleBackToTopUpdate = debounce(updateBackToTopVisibility, 80);

// Blackboard 有些頁面捲動整頁，有些頁面捲動內部容器；兩種都需要監聽。
document.addEventListener('scroll', (event) => {
    if (isScrollableElement(event.target)) {
        bbActiveScrollContainer = event.target;
    }
    scheduleBackToTopUpdate();
}, { capture: true, passive: true });

window.addEventListener('scroll', () => {
    bbActiveScrollContainer = document.scrollingElement || document.documentElement;
    scheduleBackToTopUpdate();
}, { passive: true });

function runAllFixes() {
    syncRouteClasses();
    injectIconStyles();
    injectTitlesToBanners();
    handleCoursesNav();
    handleGlobalNav();
    ensureBackToTopButton();
    updateBackToTopVisibility();
}

// 初始化：先應用主題，再執行所有 DOM 修復
loadAndApplyTheme();
runAllFixes();

// DOM 變化時重新執行（SPA 頁面切換、動態加載等）
const observer = new MutationObserver(debounce(() => {
    runAllFixes();
}, 200));
observer.observe(document.body, { childList: true, subtree: true });

// 瀏覽器縮放或視窗尺寸改變時，重新對齊課程頂部列。
window.addEventListener('resize', debounce(syncCourseNavOffset, 100), {
    passive: true
});
window.addEventListener('resize', scheduleBackToTopUpdate, { passive: true });

// 監聽 storage 變化：主題切換後立即生效（無需刷新頁面）
chrome.storage.onChanged.addListener((changes) => {
    if (changes.bbTheme) {
        applyTheme(changes.bbTheme.newValue || null);
    }
});
