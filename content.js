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
// 原理：Blackboard Ultra 內置了 .mode-dark class（定義在其自身 CSS 中），
// 添加到 <html> 後會通過 CSS 自定義屬性切換整個頁面的配色（--palette-* 變量）。
// 我們的自定義主題類（bb-theme-*）在此基礎上進一步覆蓋這些變量。
//
// 主題映射：
//   null / ''       → Default Light（不改動任何 class）
//   'default-dark'  → 只加 .mode-dark（Blackboard 官方深色模式）
//   'nord-dark'     → .mode-dark + html.bb-theme-nord-dark（Nord 調色板覆蓋）
//   'tokyo-dark'    → .mode-dark + html.bb-theme-tokyo-dark
//   'blue-dark'     → .mode-dark + html.bb-theme-blue-dark
//   'arc-dark'      → .mode-dark + html.bb-theme-arc-dark
//   'nord-snow'     → 只加 html.bb-theme-nord-snow（亮色主題，不用 mode-dark）

const BB_THEME_CONFIG = {
    'default-dark': { modeDark: true,  themeClass: null                  },
    'nord-dark':    { modeDark: true,  themeClass: 'bb-theme-nord-dark'  },
    'tokyo-dark':   { modeDark: true,  themeClass: 'bb-theme-tokyo-dark' },
    'blue-dark':    { modeDark: true,  themeClass: 'bb-theme-blue-dark'  },
    'arc-dark':     { modeDark: true,  themeClass: 'bb-theme-arc-dark'   },
    'nord-snow':    { modeDark: false, themeClass: 'bb-theme-nord-snow'  },
};

// 所有可能被添加的 class，用於清理
const BB_ALL_THEME_CLASSES = Object.values(BB_THEME_CONFIG)
    .map(t => t.themeClass).filter(Boolean);

/**
 * 應用指定主題到 <html> 元素。
 * @param {string|null} themeKey - 主題 key（見 BB_THEME_CONFIG），null 表示默認亮色
 */
function applyTheme(themeKey) {
    const html = document.documentElement;

    // 清除所有已有的主題 class
    html.classList.remove('mode-dark');
    BB_ALL_THEME_CLASSES.forEach(cls => html.classList.remove(cls));

    if (!themeKey) return; // 默認亮色，不添加任何 class

    const config = BB_THEME_CONFIG[themeKey];
    if (!config) return;

    if (config.modeDark)    html.classList.add('mode-dark');
    if (config.themeClass)  html.classList.add(config.themeClass);
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
function handleCoursesNav() {
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

    const allLinks = Array.from(document.querySelectorAll('a, button'));
    const targetLink = allLinks.find(el => {
        const text = el.textContent.trim();
        return text === "Calendar" || text === "Gradebook";
    });

    if (targetLink) {
        let container = targetLink.parentElement;
        for (let i = 0; i < 6; i++) {
            if (!container) break;

            if (container.innerText.includes("Content") && container.innerText.includes("Discussions")) {
                container.classList.add('bb-vertical-nav-container');
                document.body.classList.add('bb-vertical-nav-active');

                const navItems = container.querySelectorAll('a, button');
                navItems.forEach(item => {
                    const text = item.textContent.trim();
                    if (item.querySelector('.material-icons')) return;

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

                break;
            }
            container = container.parentElement;
        }
    }
}

// ==========================================
// 功能 3: 處理「全域」導航 (Global Nav)
// ==========================================
function appendCustomLinks(container) {
    if (container.querySelector('.bb-custom-bottom-link')) return;

    const linksConfig = [
        { text: "    Adu Live",     url: "https://live.adamson.edu.ph",                              icon: "school" },
        { text: "    Adu Calendar", url: "https://www.adamson.edu.ph/v1/?page=academic-calendar",    icon: "event"  }
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
function runAllFixes() {
    injectIconStyles();
    injectTitlesToBanners();
    handleCoursesNav();
    handleGlobalNav();
}

// 初始化：先應用主題，再執行所有 DOM 修復
loadAndApplyTheme();
runAllFixes();

// DOM 變化時重新執行（SPA 頁面切換、動態加載等）
const observer = new MutationObserver(debounce(() => {
    runAllFixes();
}, 200));
observer.observe(document.body, { childList: true, subtree: true });

// 監聽 storage 變化：主題切換後立即生效（無需刷新頁面）
chrome.storage.onChanged.addListener((changes) => {
    if (changes.bbTheme) {
        applyTheme(changes.bbTheme.newValue || null);
    }
});

