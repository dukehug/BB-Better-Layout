// ==========================================
// BB Better Layout - 快捷鍵模塊
// 負責監聽鍵盤事件，執行導航或搜索動作
// ==========================================

// ------------------------------------------
// 常量：data-analytics-id 選擇器
// 點擊頁面內的 nav 鏈接，觸發 SPA 路由（不重新加載頁面）
// ------------------------------------------
const BB_NAV_SELECTORS = {
  institution: '[data-analytics-id="base.nav.navigation.institution"]',
  activity:    '[data-analytics-id="base.nav.navigation.recentActivity"]',
  courses:     '[data-analytics-id="base.nav.navigation.courses"]',
  calendar:    '[data-analytics-id="base.nav.navigation.calendar"]',
  messages:    '[data-analytics-id="base.nav.navigation.messages"]',
  grades:      '[data-analytics-id="base.nav.navigation.grades"]',
  tools:       '[data-analytics-id="base.nav.navigation.tools"]',
};

// ------------------------------------------
// 常量：快捷鍵預設值
// label 用於 options 頁面顯示
// ------------------------------------------
const BB_DEFAULT_SHORTCUTS = {
  search:      { key: 'k', altKey: true, ctrlKey: false, shiftKey: false, label: 'Focus Course Search' },
  institution: { key: '1', altKey: true, ctrlKey: false, shiftKey: false, label: 'Institution Page'    },
  activity:    { key: '2', altKey: true, ctrlKey: false, shiftKey: false, label: 'Activity'            },
  courses:     { key: '3', altKey: true, ctrlKey: false, shiftKey: false, label: 'Courses'             },
  calendar:    { key: '4', altKey: true, ctrlKey: false, shiftKey: false, label: 'Calendar'            },
  messages:    { key: '5', altKey: true, ctrlKey: false, shiftKey: false, label: 'Messages'            },
  grades:      { key: '6', altKey: true, ctrlKey: false, shiftKey: false, label: 'Grades'              },
  tools:       { key: '7', altKey: true, ctrlKey: false, shiftKey: false, label: 'Tools'               },
};

// 當前生效的快捷鍵配置（從 storage 加載後覆蓋默認值）
let bbCurrentShortcuts = structuredClone(BB_DEFAULT_SHORTCUTS);

// ------------------------------------------
// 工具：判斷鍵盤事件是否匹配某個快捷鍵配置
// ------------------------------------------
function bbMatchShortcut(event, shortcut) {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.altKey   === !!shortcut.altKey  &&
    !!event.ctrlKey  === !!shortcut.ctrlKey &&
    !!event.shiftKey === !!shortcut.shiftKey
  );
}

// ------------------------------------------
// 動作：點擊頁面內的導航鏈接（SPA 路由，不刷新頁面）
// ------------------------------------------
function bbNavigateTo(pageKey) {
  const selector = BB_NAV_SELECTORS[pageKey];
  if (!selector) return;

  const navLink = document.querySelector(selector);
  if (navLink) {
    navLink.click();
  }
  // 找不到 nav 鏈接時靜默失敗（nav 未加載時不做任何操作）
}

// ------------------------------------------
// 動作：持續輪詢直到搜索框出現，再聚焦
// 用於 SPA 導航後 DOM 還未更新的情況
// ------------------------------------------
function bbPollAndFocusSearch() {
  const POLL_MS    = 150;
  const TIMEOUT_MS = 5000;
  const start = Date.now();

  const timer = setInterval(() => {
    const input = document.getElementById('courses-overview-filter-search');
    if (input) {
      clearInterval(timer);
      input.click();
      input.focus();
    } else if (Date.now() - start > TIMEOUT_MS) {
      clearInterval(timer); // 超時放棄
    }
  }, POLL_MS);
}

// ------------------------------------------
// 動作：聚焦課程搜索框
// - 已在 courses 頁面 → 直接聚焦
// - 在其他頁面 → 先點擊導航切換到 courses，再輪詢聚焦
// ------------------------------------------
function bbFocusCourseSearch() {
  const searchInput = document.getElementById('courses-overview-filter-search');
  if (searchInput) {
    searchInput.click();
    searchInput.focus();
    return;
  }

  // 不在 courses 頁面：觸發 SPA 導航，然後輪詢等待搜索框
  bbNavigateTo('courses');
  bbPollAndFocusSearch();
}

// ------------------------------------------
// 事件處理：全局鍵盤監聽
// ------------------------------------------
function bbHandleKeydown(event) {
  const activeEl  = document.activeElement;

  // 判斷用戶是否正在文字輸入（導航快捷鍵在輸入狀態下不觸發）
  const isEditing = activeEl && (
    activeEl.tagName === 'INPUT'    ||
    activeEl.tagName === 'TEXTAREA' ||
    activeEl.isContentEditable
  );

  for (const [action, shortcut] of Object.entries(bbCurrentShortcuts)) {
    if (!bbMatchShortcut(event, shortcut)) continue;

    if (action === 'search') {
      // 搜索快捷鍵：已在搜索框則跳過
      if (activeEl && activeEl.id === 'courses-overview-filter-search') return;
      event.preventDefault();
      bbFocusCourseSearch();
      return;
    }

    // 導航快捷鍵：輸入狀態下不觸發
    if (isEditing) continue;

    event.preventDefault();
    bbNavigateTo(action);
    return;
  }
}

// ------------------------------------------
// 初始化：從 chrome.storage 加載用戶配置，
// 並重新綁定鍵盤監聽器
// ------------------------------------------
function bbLoadAndSetupShortcuts() {
  chrome.storage.sync.get('bbShortcuts', (data) => {
    // 每次重置為默認值，再疊加用戶自定義（確保新增默認項不會丟失）
    bbCurrentShortcuts = structuredClone(BB_DEFAULT_SHORTCUTS);

    if (data.bbShortcuts) {
      for (const [key, saved] of Object.entries(data.bbShortcuts)) {
        if (bbCurrentShortcuts[key]) {
          bbCurrentShortcuts[key] = {
            ...bbCurrentShortcuts[key],
            key:      saved.key      ?? bbCurrentShortcuts[key].key,
            altKey:   saved.altKey   ?? bbCurrentShortcuts[key].altKey,
            ctrlKey:  saved.ctrlKey  ?? bbCurrentShortcuts[key].ctrlKey,
            shiftKey: saved.shiftKey ?? bbCurrentShortcuts[key].shiftKey,
          };
        }
      }
    }

    // 移除舊監聽器再重新綁定，防止重複注冊
    document.removeEventListener('keydown', bbHandleKeydown);
    document.addEventListener('keydown', bbHandleKeydown);
  });
}

// 啟動
bbLoadAndSetupShortcuts();

// 當用戶在 options 頁面保存設置後，實時生效（無需刷新頁面）
chrome.storage.onChanged.addListener((changes) => {
  if (changes.bbShortcuts) {
    bbLoadAndSetupShortcuts();
  }
});
