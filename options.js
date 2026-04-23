// ==========================================
// BB Better Layout - 快捷鍵設置頁面腳本
// 負責：加載/保存快捷鍵配置、渲染表格、錄製新快捷鍵
// ==========================================

// ------------------------------------------
// 與 shortcuts.js 保持同步的默認值
// （options 頁面無法直接 import content script）
// ------------------------------------------
const DEFAULT_SHORTCUTS = {
  search:      { key: 'f', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Focus Course Search' },
  institution: { key: '1', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Institution Page'    },
  activity:    { key: '2', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Activity'            },
  courses:     { key: '3', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Courses'             },
  calendar:    { key: '4', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Calendar'            },
  messages:    { key: '5', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Messages'            },
  grades:      { key: '6', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Grades'             },
  tools:       { key: '7', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Tools'               },
};

// 當前在 UI 中顯示/編輯的快捷鍵（保存前的臨時狀態）
let currentShortcuts = structuredClone(DEFAULT_SHORTCUTS);

// ------------------------------------------
// 工具：將快捷鍵對象格式化為可讀字符串
// 例：{ altKey: true, key: 'f' } -> "Alt + F"
// ------------------------------------------
function formatShortcut(shortcut) {
  const parts = [];
  if (shortcut.ctrlKey)  parts.push('Ctrl');
  if (shortcut.altKey)   parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  // 特殊鍵名映射（讓顯示更友好）
  const keyDisplayMap = {
    ' ': 'Space', 'arrowup': '↑', 'arrowdown': '↓',
    'arrowleft': '←', 'arrowright': '→',
    'escape': 'Esc', 'enter': 'Enter', 'backspace': 'Backspace',
    'tab': 'Tab', 'delete': 'Delete',
  };
  const displayKey = keyDisplayMap[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase();
  parts.push(displayKey);

  return parts.join(' + ');
}

// ------------------------------------------
// 錄製：讓用戶按下新的鍵盤組合
// ------------------------------------------
function startRecording(actionId, badgeEl) {
  // 標記正在錄製
  badgeEl.textContent = 'Press keys...';
  badgeEl.classList.add('recording');

  function onKeydown(e) {
    e.preventDefault();
    e.stopPropagation();

    // Escape 取消錄製（不保存）
    if (e.key === 'Escape' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      badgeEl.textContent = formatShortcut(currentShortcuts[actionId]);
      badgeEl.classList.remove('recording');
      document.removeEventListener('keydown', onKeydown, true);
      return;
    }

    // 單獨按 modifier 鍵時不觸發保存
    if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

    // 必須帶 modifier（防止普通字母誤觸）
    if (!e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      showStatus('Please use at least one modifier key (Ctrl / Alt / Shift).', 'error');
      return;
    }

    // 保存新快捷鍵
    const newShortcut = {
      key:      e.key.toLowerCase(),
      altKey:   e.altKey,
      ctrlKey:  e.ctrlKey,
      shiftKey:  e.shiftKey,
      // label 保持不變
      label:    currentShortcuts[actionId].label,
    };

    currentShortcuts[actionId] = newShortcut;
    badgeEl.textContent = formatShortcut(newShortcut);
    badgeEl.classList.remove('recording');
    document.removeEventListener('keydown', onKeydown, true);

    saveShortcuts();
  }

  // 用 capture 模式，確保比頁面其他監聽器先收到事件
  document.addEventListener('keydown', onKeydown, true);
}

// ------------------------------------------
// 渲染：根據 currentShortcuts 生成表格行
// ------------------------------------------
function renderTable() {
  const tbody = document.getElementById('shortcuts-tbody');
  tbody.innerHTML = '';

  for (const [actionId, shortcut] of Object.entries(currentShortcuts)) {
    const tr = document.createElement('tr');

    // 動作名稱
    const tdLabel = document.createElement('td');
    tdLabel.textContent = shortcut.label;
    tr.appendChild(tdLabel);

    // 快捷鍵徽章（可點擊觸發錄製）
    const tdBadge = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'shortcut-badge';
    badge.textContent = formatShortcut(shortcut);
    badge.title = 'Click to change';

    badge.addEventListener('click', () => {
      // 防止多個行同時錄製
      document.querySelectorAll('.shortcut-badge.recording').forEach(el => {
        el.textContent = formatShortcut(currentShortcuts[el.dataset.action]);
        el.classList.remove('recording');
      });
      startRecording(actionId, badge);
    });

    badge.dataset.action = actionId;
    tdBadge.appendChild(badge);
    tr.appendChild(tdBadge);

    tbody.appendChild(tr);
  }
}

// ------------------------------------------
// 存儲：保存到 chrome.storage.sync
// ------------------------------------------
function saveShortcuts() {
  // 只保存按鍵字段，label 由 shortcuts.js 內置
  const toSave = {};
  for (const [id, s] of Object.entries(currentShortcuts)) {
    toSave[id] = { key: s.key, altKey: s.altKey, ctrlKey: s.ctrlKey, shiftKey: s.shiftKey };
  }

  chrome.storage.sync.set({ bbShortcuts: toSave }, () => {
    showStatus('Saved!', 'success');
  });
}

// ------------------------------------------
// 重置：恢復所有快捷鍵為默認值
// ------------------------------------------
function resetToDefaults() {
  currentShortcuts = structuredClone(DEFAULT_SHORTCUTS);
  chrome.storage.sync.remove('bbShortcuts', () => {
    renderTable();
    showStatus('Reset to defaults.', 'success');
  });
}

// ------------------------------------------
// UI：顯示狀態消息（成功/錯誤）
// ------------------------------------------
function showStatus(msg, type = 'success') {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = `status-msg ${type}`;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

// ------------------------------------------
// 初始化：加載已保存的配置
// ------------------------------------------
chrome.storage.sync.get('bbShortcuts', (data) => {
  if (data.bbShortcuts) {
    for (const [key, saved] of Object.entries(data.bbShortcuts)) {
      if (currentShortcuts[key]) {
        currentShortcuts[key] = {
          ...currentShortcuts[key],
          key:      saved.key      ?? currentShortcuts[key].key,
          altKey:   saved.altKey   ?? currentShortcuts[key].altKey,
          ctrlKey:  saved.ctrlKey  ?? currentShortcuts[key].ctrlKey,
          shiftKey: saved.shiftKey ?? currentShortcuts[key].shiftKey,
        };
      }
    }
  }
  renderTable();
});

// 按鈕事件
document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
