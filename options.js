// ==========================================
// BB Better Layout - 設置頁面腳本
// 負責：主題選擇、快捷鍵錄製/保存/重置
// ==========================================

// ==========================================
// 主題定義
// value 對應 styles.css 中的 class 名（null = 默認深色）
// ==========================================
// value 對應 content.js 中 BB_THEME_CONFIG 的 key（null = 默認亮色）
const THEMES = [
  {
    value:   null,
    label:   'Default Light',
    colors:  ['#ffffff', '#f8f8f8', '#0069ff'],
  },
  {
    value:   'default-dark',
    label:   'Default Dark',
    colors:  ['#262626', '#3d3d3d', '#0069ff'],
  },
  {
    value:   'nord-dark',
    label:   'Nord Dark',
    colors:  ['#2e3440', '#3b4252', '#5e81ac'],
  },
  {
    value:   'tokyo-dark',
    label:   'Tokyo Night',
    colors:  ['#1a1b26', '#24283b', '#7aa2f7'],
  },
  {
    value:   'blue-dark',
    label:   'Blue Dark',
    colors:  ['#0d1117', '#161b22', '#1f6feb'],
  },
  {
    value:   'arc-dark',
    label:   'Arc Dark',
    colors:  ['#1c1c1e', '#2c2c2e', '#0077ed'],
  },
  {
    value:   'nord-snow',
    label:   'Nord Snow ☀️',
    colors:  ['#e5e9f0', '#eceff4', '#5e81ac'],
  },
];

// ==========================================
// 快捷鍵默認值（與 shortcuts.js 保持同步）
// ==========================================
const DEFAULT_SHORTCUTS = {
  search:      { key: 'k', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Focus Course Search' },
  institution: { key: '1', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Institution Page'    },
  activity:    { key: '2', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Activity'            },
  courses:     { key: '3', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Courses'             },
  calendar:    { key: '4', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Calendar'            },
  messages:    { key: '5', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Messages'            },
  grades:      { key: '6', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Grades'              },
  tools:       { key: '7', altKey: true,  ctrlKey: false, shiftKey: false, label: 'Tools'               },
};

let currentShortcuts = structuredClone(DEFAULT_SHORTCUTS);

// ==========================================
// 主題：渲染色塊網格
// ==========================================
function renderThemeGrid(activeTheme) {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';

  THEMES.forEach(theme => {
    const swatch = document.createElement('div');
    swatch.className = 'theme-swatch' + (activeTheme === theme.value ? ' active' : '');
    swatch.dataset.value = theme.value ?? '';  // null 存為空字符串

    // 三色預覽條
    const preview = document.createElement('div');
    preview.className = 'swatch-preview';
    theme.colors.forEach(c => {
      const span = document.createElement('span');
      span.style.background = c;
      preview.appendChild(span);
    });

    // 名稱
    const label = document.createElement('div');
    label.className = 'swatch-label';
    label.textContent = theme.label;

    // 選中勾
    const check = document.createElement('div');
    check.className = 'swatch-check';
    check.textContent = '✓ Active';

    swatch.appendChild(preview);
    swatch.appendChild(label);
    swatch.appendChild(check);

    swatch.addEventListener('click', () => selectTheme(theme.value));
    grid.appendChild(swatch);
  });
}

/** 點擊色塊後保存主題並刷新 UI */
function selectTheme(themeValue) {
  // null 在 storage 中存為空字符串，讀取時再轉回 null
  const toStore = themeValue ?? '';
  chrome.storage.sync.set({ bbTheme: toStore }, () => {
    renderThemeGrid(themeValue);
    showStatus('Theme applied!', 'success');
  });
}

// ==========================================
// 快捷鍵：格式化顯示
// ==========================================
function formatShortcut(shortcut) {
  const parts = [];
  if (shortcut.ctrlKey)  parts.push('Ctrl');
  if (shortcut.altKey)   parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  const keyDisplayMap = {
    ' ': 'Space', 'arrowup': '↑', 'arrowdown': '↓',
    'arrowleft': '←', 'arrowright': '→',
    'escape': 'Esc', 'enter': 'Enter',
    'backspace': 'Backspace', 'tab': 'Tab', 'delete': 'Del',
  };
  const displayKey = keyDisplayMap[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase();
  parts.push(displayKey);
  return parts.join(' + ');
}

// ==========================================
// 快捷鍵：錄製新組合
// ==========================================
function startRecording(actionId, badgeEl) {
  badgeEl.textContent = '⏺ Press keys...';
  badgeEl.classList.add('recording');

  function onKeydown(e) {
    e.preventDefault();
    e.stopPropagation();

    // Esc 取消
    if (e.key === 'Escape' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      badgeEl.textContent = formatShortcut(currentShortcuts[actionId]);
      badgeEl.classList.remove('recording');
      document.removeEventListener('keydown', onKeydown, true);
      return;
    }

    // 跳過單獨的 modifier 按鍵
    if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

    // 必須帶 modifier
    if (!e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      showStatus('⚠️ Please use at least one modifier (Ctrl / Alt / Shift)', 'error');
      return;
    }

    const newShortcut = {
      key:      e.key.toLowerCase(),
      altKey:   e.altKey,
      ctrlKey:  e.ctrlKey,
      shiftKey: e.shiftKey,
      label:    currentShortcuts[actionId].label,
    };

    currentShortcuts[actionId] = newShortcut;
    badgeEl.textContent = formatShortcut(newShortcut);
    badgeEl.classList.remove('recording');
    document.removeEventListener('keydown', onKeydown, true);
    saveShortcuts();
  }

  // capture 模式確保優先收到事件
  document.addEventListener('keydown', onKeydown, true);
}

// ==========================================
// 快捷鍵：渲染表格
// ==========================================
function renderTable() {
  const tbody = document.getElementById('shortcuts-tbody');
  tbody.innerHTML = '';

  for (const [actionId, shortcut] of Object.entries(currentShortcuts)) {
    const tr = document.createElement('tr');

    const tdLabel = document.createElement('td');
    tdLabel.textContent = shortcut.label;
    tr.appendChild(tdLabel);

    const tdBadge = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'shortcut-badge';
    badge.textContent = formatShortcut(shortcut);
    badge.title = 'Click to change';
    badge.dataset.action = actionId;

    badge.addEventListener('click', () => {
      // 取消其他正在錄製的行
      document.querySelectorAll('.shortcut-badge.recording').forEach(el => {
        const aid = el.dataset.action;
        if (aid) el.textContent = formatShortcut(currentShortcuts[aid]);
        el.classList.remove('recording');
      });
      startRecording(actionId, badge);
    });

    tdBadge.appendChild(badge);
    tr.appendChild(tdBadge);
    tbody.appendChild(tr);
  }
}

// ==========================================
// 快捷鍵：保存到 storage
// cb 可選（供 resetToDefaults 使用）
// ==========================================
function saveShortcuts(cb) {
  const toSave = {};
  for (const [id, s] of Object.entries(currentShortcuts)) {
    toSave[id] = { key: s.key, altKey: s.altKey, ctrlKey: s.ctrlKey, shiftKey: s.shiftKey };
  }

  chrome.storage.sync.set({ bbShortcuts: toSave }, () => {
    if (cb) cb();
    else showStatus('✓ Shortcut saved & active immediately', 'success');
  });
}

// ==========================================
// 快捷鍵：重置為默認值
// ==========================================
function resetToDefaults() {
  currentShortcuts = structuredClone(DEFAULT_SHORTCUTS);
  saveShortcuts(() => {
    renderTable();
    showStatus('✓ Reset to defaults', 'success');
  });
}

// ==========================================
// UI：顯示狀態消息
// ==========================================
function showStatus(msg, type = 'success') {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = type;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

// ==========================================
// 初始化：讀取 storage，渲染所有 UI
// ==========================================
chrome.storage.sync.get(['bbShortcuts', 'bbTheme'], (data) => {
  // --- 快捷鍵 ---
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

  // --- 主題 ---
  // 空字符串表示默認主題（null）
  const storedTheme = data.bbTheme || null;
  renderThemeGrid(storedTheme === '' ? null : storedTheme);
});

// 按鈕事件
document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
