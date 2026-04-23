// ==========================================
// BB Better Layout - 快捷鍵模塊
// 負責監聽鍵盤事件，執行導航或搜索動作
// ==========================================

// ------------------------------------------
// 常量：各頁面的 URL
// ------------------------------------------
const BB_NAV_URLS = {
  institution: 'https://adamson.blackboard.com/ultra/institution-page',
  activity:    'https://adamson.blackboard.com/ultra/stream',
  courses:     'https://adamson.blackboard.com/ultra/course',
  calendar:    'https://adamson.blackboard.com/ultra/calendar',
  messages:    'https://adamson.blackboard.com/ultra/messages',
  grades:      'https://adamson.blackboard.com/ultra/grades',
  tools:       'https://adamson.blackboard.com/ultra/tools',
};

// ------------------------------------------
// 常量：快捷鍵預設值
// label 用於 options 頁面顯示
// ------------------------------------------
const BB_DEFAULT_SHORTCUTS = {
  search:      { key: 'f', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Focus Course Search' },
  institution: { key: '1', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Institution Page'    },
  activity:    { key: '2', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Activity'            },
  courses:     { key: '3', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Courses'             },
  calendar:    { key: '4', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Calendar'            },
  messages:    { key: '5', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Messages'            },
  grades:      { key: '6', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Grades'              },
  tools:       { key: '7', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Tools'               },
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
// 動作：聚焦課程搜索框
// 只在 /ultra/course 頁面有效
// ------------------------------------------
function bbFocusCourseSearch() {
  const searchInput = document.getElementById('courses-overview-filter-search');
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
  } else {
    // 不在課程頁面，先跳轉過去
    window.location.href = BB_NAV_URLS.courses;
  }
}

// ------------------------------------------
// 動作：導航到指定 Blackboard 頁面
// ------------------------------------------
function bbNavigateTo(pageKey) {
  const url = BB_NAV_URLS[pageKey];
  if (url) {
    window.location.href = url;
  }
}

// ------------------------------------------
// 事件處理：全局鍵盤監聽
// ------------------------------------------
function bbHandleKeydown(event) {
  const activeEl = document.activeElement;

  // 判斷用戶是否正在輸入（除搜索快捷鍵外，輸入時不觸發導航）
  const isEditing = activeEl && (
    activeEl.tagName === 'INPUT'    ||
    activeEl.tagName === 'TEXTAREA' ||
    activeEl.isContentEditable
  );

  for (const [action, shortcut] of Object.entries(bbCurrentShortcuts)) {
    if (!bbMatchShortcut(event, shortcut)) continue;

    if (action === 'search') {
      // 搜索快捷鍵：如果已在搜索框則跳過，否則執行
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
// 並註冊鍵盤監聽器
// ------------------------------------------
function bbLoadAndSetupShortcuts() {
  chrome.storage.sync.get('bbShortcuts', (data) => {
    // 重置為默認值，再合併用戶自定義（確保新增的默認項也能保留）
    bbCurrentShortcuts = structuredClone(BB_DEFAULT_SHORTCUTS);

    if (data.bbShortcuts) {
      for (const [key, saved] of Object.entries(data.bbShortcuts)) {
        if (bbCurrentShortcuts[key]) {
          // 只覆蓋按鍵相關字段，label 始終用默認值
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

    // 移除舊監聽器再重新綁定，防止重複
    document.removeEventListener('keydown', bbHandleKeydown);
    document.addEventListener('keydown', bbHandleKeydown);
  });
}

// 啟動
bbLoadAndSetupShortcuts();

// 當用戶在 options 頁面保存設置後，實時更新快捷鍵（無需刷新頁面）
chrome.storage.onChanged.addListener((changes) => {
  if (changes.bbShortcuts) {
    bbLoadAndSetupShortcuts();
  }
});
