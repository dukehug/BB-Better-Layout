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
// 【核心修復】共用的鏈接插入函數
// 這裡定義了 appendCustomLinks 供後面調用
// ==========================================
function appendCustomLinks(container) {
    // 防止重複插入
    if (container.querySelector('.bb-custom-bottom-link')) return;

    //設置自定義連接
    const linksConfig = [
        {   
            text: "\u00A0\u00A0\u00A0\u00A0Adu Live", // 4個不換行空格
            url: "https://live.adamson.edu.ph",
            icon: "school"
        },
        {
            text: "\u00A0\u00A0\u00A0\u00A0Adu Calendar",
            url: "https://www.adamson.edu.ph/v1/?page=academic-calendar",
            icon: "event"
        }
    ];

    //自動產生連結
    linksConfig.forEach((config, index) => {
        const link = document.createElement('a');
        link.href = config.url;
        // 修正 Typo: custome -> custom
        link.className = 'bb-custom-bottom-link'; 
        link.target = "_blank";

        //推到nav 底部
        if (index === 0) {
            link.style.marginTop = "auto";
        }

        //創建圖標
        const icon = document.createElement('span');
        // 修正 Typo: bav -> nav
        icon.className = 'material-icons bb-nav-icon';
        icon.innerText = config.icon;

        //創建文字
        const text = document.createTextNode(config.text);

        //組裝
        link.appendChild(icon);
        link.appendChild(text);

        //插入容器
        container.appendChild(link);
    });
}

// ==========================================
// 功能 1: 課程 Banner 標題替換
// ==========================================
function injectTitlesToBanners() {
    const cards = document.querySelectorAll('bb-base-course-card');
    cards.forEach(card => {
        const banner = card.querySelector('.course-banner');
        const titleElement = card.querySelector('.js-course-title-element') || 
                             card.querySelector('h4[id^="course-name-"]');

        if (banner && titleElement) {
            const existingTitle = banner.querySelector('.bb-custom-banner-text');
            const currentTitleText = titleElement.textContent.trim();
            
            if (existingTitle && existingTitle.textContent === currentTitleText) return;

            const newTitleDiv = document.createElement('div');
            newTitleDiv.className = 'bb-custom-banner-text';
            newTitleDiv.innerText = currentTitleText; 
            
            banner.innerHTML = ''; 
            banner.appendChild(newTitleDiv);
        }
    });
}

// ==========================================
// 功能 2: 左側導航欄 (含圖標與自定義鏈接)
// ==========================================
function handleCoursesNav() {
    // 定義文字與圖標的對應表 (你可以根據需要修改圖標名稱)
    // 圖標名稱參考: https://fonts.google.com/icons
    const iconMap = {
        "Content": "menu_book",       // 課程內容
        "Calendar": "event",          // 日曆
        "Announcements": "campaign",  // 公告
        "Discussions": "forum",       // 討論
        "Gradebook": "assessment",    // 成績
        "Messages": "mail",           // 訊息
        "Groups": "group",            // 小組
        "Achievements": "emoji_events", // 成就
        "Tools": "build"              // 工具
    };

    // 尋找導航欄連結
    const allLinks = Array.from(document.querySelectorAll('a, button'));
    const targetLink = allLinks.find(el => {
        const text = el.textContent.trim();
        return text === "Calendar" || text === "Gradebook";
    });

    if (targetLink) {
        // 往上找容器
        let container = targetLink.parentElement;
        for (let i = 0; i < 6; i++) {
            if (!container) break;
            
            if (container.innerText.includes("Content") && container.innerText.includes("Discussions")) {
                container.classList.add('bb-vertical-nav-container');
                document.body.classList.add('bb-vertical-nav-active');

                // --- 處理容器內的每一個連結 ---
                const navItems = container.querySelectorAll('a, button');
                navItems.forEach(item => {
                    // 1. 獲取連結文字
                    // 有些按鈕內層結構複雜，需過濾出純文字
                    const text = item.textContent.trim();
                    
                    // 2. 檢查是否已經加過圖標 (避免重複添加)
                    if (item.querySelector('.material-icons')) return;

                    // 3. 查找對應的圖標
                    // 如果找不到對應的，預設給一個圓圈圖標 (circle)
                    let iconName = "circle"; 
                    for (const [key, value] of Object.entries(iconMap)) {
                        if (text.includes(key)) {
                            iconName = value;
                            break;
                        }
                    }

                    // 4. 創建圖標元素
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'material-icons bb-nav-icon';
                    iconSpan.innerText = iconName;

                    // 5. 插入到文字前面
                    item.prepend(iconSpan);
                });

                // --- 插入底部自定義鏈接 ---
                // 使用共用函數，確保課程頁面也有鏈接
                //appendCustomLinks(container);

                break;
            }
            container = container.parentElement;
        }
    }
}

// ==========================================
// 功能 3: 處理「全域」導航 (Stream/Global Nav)
// ==========================================
function handleGlobalNav() {
    // Blackboard 的全域導航通常包含在這個 ID 的 UL 裡
    const globalList = document.getElementById('base_tools');
    
    if (globalList) {
        // 我們要找的是包住 UL 的 <nav> 容器
        const navContainer = globalList.closest('nav') || globalList.parentElement;
        
        if (navContainer) {
            // 確保容器是 flex column 佈局，這樣 marginTop: auto 才會生效
            navContainer.style.display = 'flex';
            navContainer.style.flexDirection = 'column';
            navContainer.style.height = '100%'; // 確保高度佔滿

            // 【復用重點】同樣呼叫共用函數
            appendCustomLinks(navContainer);
        }
    }
}

// ==========================================
// 執行邏輯
// ==========================================
function runAllFixes() {
    injectIconStyles(); // 確保 CSS 載入
    injectTitlesToBanners(); //課程 banners
    handleCoursesNav(); // 課程內 nav
    handleGlobalNav(); //global nav
}

runAllFixes();

const observer = new MutationObserver(debounce(() => {
    runAllFixes();
}, 200));

observer.observe(document.body, {
    childList: true,
    subtree: true
});