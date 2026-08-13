// ==========================================
// BB Better Layout - 設置頁面腳本
// 負責：主題選擇、快捷鍵錄製/保存/重置
// ==========================================

// ==========================================
// 主題定義
// value 對應 theme.js 中 THEME_CONFIG 的 key（null = 默認亮色）
// ==========================================
const THEMES = [
  {
    value:   null,
    label:   'Default Light',
    colors:  ['#ffffff', '#f8f8f8', '#0069ff'],
  },
  {
    value:   'nord-snow',
    label:   'Nord Snow ☀️',
    colors:  ['#e5e9f0', '#eceff4', '#5e81ac'],
  },
  {
    value:   'paper-reading',
    label:   'Paper Reading 📖',
    colors:  ['#fffaf0', '#f4ecd8', '#7a4b18'],
  },
  {
    value:   'sage-reading',
    label:   'Sage Reading 🌿',
    colors:  ['#fbfdf8', '#edf3e8', '#3f6739'],
  },
  {
    value:   'sky-reading',
    label:   'Sky Reading 🌤️',
    colors:  ['#fbfdff', '#edf4f8', '#315f7d'],
  },
  {
    value:   'lavender-reading',
    label:   'Lavender Reading 🌸',
    colors:  ['#fdfbff', '#f3eff8', '#67477e'],
  },
  {
    value:   'graphite-reading',
    label:   'Graphite Reading 🪨',
    colors:  ['#fbfbfc', '#eef0f2', '#425e70'],
  },
  {
    value:   'aqua-reading',
    label:   'Aqua Reading 🌊',
    colors:  ['#f9fdfc', '#e8f3f1', '#2f6f67'],
  },
  {
    value:   'rose-reading',
    label:   'Rose Reading 🌹',
    colors:  ['#fdfafb', '#f4ecef', '#7a4054'],
  },
];

const COURSE_COVER_STORAGE_KEY = 'bbCourseCoverImage';
const COURSE_COVER_POSITION_STORAGE_KEY = 'bbCourseCoverPosition';
const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_COVER_WIDTH = 1920;
const MAX_COVER_HEIGHT = 1080;
const SUPPORTED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_COVER_POSITION = { x: 50, y: 50 };

let currentCourseCoverPosition = { ...DEFAULT_COVER_POSITION };
let courseCoverDragState = null;

// ==========================================
// 快捷鍵默認值（與 shortcuts.js 保持同步）
// ==========================================
const DEFAULT_SHORTCUTS = {
  search:      { key: 'k', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Search Current Page' },
  studyNote:   { key: 'n', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Quick Study Note'     },
  institution: { key: '1', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Institution Page'    },
  activity:    { key: '2', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Activity'            },
  courses:     { key: '3', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Courses'             },
  calendar:    { key: '4', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Calendar'            },
  messages:    { key: '5', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Messages'            },
  grades:      { key: '6', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Grades'              },
  tools:       { key: '7', altKey: true, ctrlKey: false, shiftKey: false, metaKey: false, label: 'Tools'               },
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
// 本機課程封面：壓縮、預覽與 storage.local
// ==========================================
function loadLocalImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected file could not be read as an image.'));
    };
    image.src = objectUrl;
  });
}

async function createCourseCoverDataUrl(file) {
  if (!SUPPORTED_COVER_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('Please choose an image smaller than 15 MB.');
  }

  const image = await loadLocalImage(file);
  const scale = Math.min(
    1,
    MAX_COVER_WIDTH / image.naturalWidth,
    MAX_COVER_HEIGHT / image.naturalHeight
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('This browser could not prepare the selected image.');
  }

  context.fillStyle = '#263642';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/webp', 0.86);
  const storedBytes = Math.ceil(dataUrl.length * 0.75);
  if (storedBytes > MAX_STORED_IMAGE_BYTES) {
    throw new Error('The compressed image is still too large. Please choose a smaller image.');
  }

  return dataUrl;
}

function normalizeCourseCoverPosition(position) {
  const x = Number(position?.x);
  const y = Number(position?.y);
  const clamp = value => Math.min(100, Math.max(0, value));

  return {
    x: Number.isFinite(x) ? Math.round(clamp(x) * 10) / 10 : DEFAULT_COVER_POSITION.x,
    y: Number.isFinite(y) ? Math.round(clamp(y) * 10) / 10 : DEFAULT_COVER_POSITION.y,
  };
}

function updateCourseCoverPosition(position) {
  const image = document.getElementById('course-cover-preview-image');
  currentCourseCoverPosition = normalizeCourseCoverPosition(position);
  image.style.objectPosition = `${currentCourseCoverPosition.x}% ${currentCourseCoverPosition.y}%`;
}

function renderCourseCoverPreview(imageDataUrl, position = currentCourseCoverPosition) {
  const preview = document.getElementById('course-cover-preview');
  const image = document.getElementById('course-cover-preview-image');
  const dragHint = document.getElementById('course-cover-drag-hint');
  const centerButton = document.getElementById('course-cover-center');
  const clearButton = document.getElementById('course-cover-clear');
  const hasImage = typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/');

  updateCourseCoverPosition(position);
  preview.classList.toggle('has-image', hasImage);
  image.hidden = !hasImage;
  dragHint.hidden = !hasImage;
  centerButton.disabled = !hasImage;
  clearButton.disabled = !hasImage;

  if (hasImage) {
    image.src = imageDataUrl;
  } else {
    image.removeAttribute('src');
  }
}

function showCoverStatus(message, type = 'success') {
  const status = document.getElementById('cover-status-msg');
  status.textContent = message;
  status.className = type;
}

function saveCourseCover(imageDataUrl) {
  const defaultPosition = { ...DEFAULT_COVER_POSITION };
  chrome.storage.local.set({
    [COURSE_COVER_STORAGE_KEY]: imageDataUrl,
    [COURSE_COVER_POSITION_STORAGE_KEY]: defaultPosition,
  }, () => {
    if (chrome.runtime.lastError) {
      showCoverStatus('Could not save the image.', 'error');
      return;
    }

    renderCourseCoverPreview(imageDataUrl, defaultPosition);
    showCoverStatus('✓ Cover applied', 'success');
  });
}

function saveCourseCoverPosition(position, message = '✓ Position saved') {
  const normalizedPosition = normalizeCourseCoverPosition(position);
  updateCourseCoverPosition(normalizedPosition);

  chrome.storage.local.set({
    [COURSE_COVER_POSITION_STORAGE_KEY]: normalizedPosition,
  }, () => {
    if (chrome.runtime.lastError) {
      showCoverStatus('Could not save the position.', 'error');
      return;
    }

    showCoverStatus(message, 'success');
  });
}

function calculateDraggedCoverPosition(event) {
  const preview = document.getElementById('course-cover-preview');
  const image = document.getElementById('course-cover-preview-image');
  if (!image.naturalWidth || !image.naturalHeight) {
    return courseCoverDragState.startPosition;
  }

  const rect = preview.getBoundingClientRect();
  const scale = Math.max(
    rect.width / image.naturalWidth,
    rect.height / image.naturalHeight
  );
  const overflowX = Math.max(0, image.naturalWidth * scale - rect.width);
  const overflowY = Math.max(0, image.naturalHeight * scale - rect.height);
  const deltaX = event.clientX - courseCoverDragState.startClientX;
  const deltaY = event.clientY - courseCoverDragState.startClientY;

  return {
    x: overflowX > 0
      ? courseCoverDragState.startPosition.x - (deltaX / overflowX) * 100
      : courseCoverDragState.startPosition.x,
    y: overflowY > 0
      ? courseCoverDragState.startPosition.y - (deltaY / overflowY) * 100
      : courseCoverDragState.startPosition.y,
  };
}

function startCourseCoverDrag(event) {
  const preview = event.currentTarget;
  if (!preview.classList.contains('has-image')) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;

  courseCoverDragState = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPosition: { ...currentCourseCoverPosition },
    moved: false,
  };
  preview.classList.add('dragging');
  preview.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveCourseCover(event) {
  if (!courseCoverDragState || event.pointerId !== courseCoverDragState.pointerId) return;

  courseCoverDragState.moved = true;
  updateCourseCoverPosition(calculateDraggedCoverPosition(event));
}

function finishCourseCoverDrag(event, shouldSave) {
  const preview = event.currentTarget;
  if (!courseCoverDragState || event.pointerId !== courseCoverDragState.pointerId) return;

  const { moved, startPosition } = courseCoverDragState;
  courseCoverDragState = null;
  preview.classList.remove('dragging');
  if (preview.hasPointerCapture?.(event.pointerId)) {
    preview.releasePointerCapture(event.pointerId);
  }

  if (shouldSave && moved) {
    saveCourseCoverPosition(currentCourseCoverPosition);
  } else if (!shouldSave) {
    updateCourseCoverPosition(startPosition);
  }
}

function handleCourseCoverPositionKey(event) {
  if (!event.currentTarget.classList.contains('has-image')) return;

  const direction = {
    ArrowLeft:  { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp:    { x: 0, y: -1 },
    ArrowDown:  { x: 0, y: 1 },
  }[event.key];
  if (!direction) return;

  const step = event.shiftKey ? 10 : 2;
  event.preventDefault();
  saveCourseCoverPosition({
    x: currentCourseCoverPosition.x + direction.x * step,
    y: currentCourseCoverPosition.y + direction.y * step,
  });
}

function centerCourseCover() {
  saveCourseCoverPosition(DEFAULT_COVER_POSITION, '✓ Image centered');
}

async function handleCourseCoverSelection(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  if (!file) return;

  input.disabled = true;
  showCoverStatus('Preparing image…', 'pending');

  try {
    const imageDataUrl = await createCourseCoverDataUrl(file);
    saveCourseCover(imageDataUrl);
  } catch (error) {
    showCoverStatus(error.message, 'error');
  } finally {
    input.disabled = false;
    input.value = '';
  }
}

function clearCourseCover() {
  chrome.storage.local.remove([
    COURSE_COVER_STORAGE_KEY,
    COURSE_COVER_POSITION_STORAGE_KEY,
  ], () => {
    if (chrome.runtime.lastError) {
      showCoverStatus('Could not remove the image.', 'error');
      return;
    }

    renderCourseCoverPreview(null, DEFAULT_COVER_POSITION);
    showCoverStatus('✓ Using Blackboard default', 'success');
  });
}

// ==========================================
// 快捷鍵：格式化顯示
// ==========================================
function formatShortcut(shortcut) {
  const parts = [];

  if (shortcut.metaKey)  parts.push('Command');
  if (shortcut.ctrlKey)  parts.push('Ctrl');
  if (shortcut.altKey)   parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  const keyDisplayMap = {
    ' ': 'Space',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'escape': 'Esc',
    'enter': 'Enter',
    'backspace': 'Backspace',
    'tab': 'Tab',
    'delete': 'Del',
  };

  const displayKey =
    keyDisplayMap[shortcut.key.toLowerCase()] ||
    shortcut.key.toUpperCase();

  parts.push(displayKey);

  return parts.join(' + ');
}

function shortcutsMatch(firstShortcut, secondShortcut) {
  return (
    firstShortcut.key.toLowerCase() === secondShortcut.key.toLowerCase() &&
    !!firstShortcut.altKey === !!secondShortcut.altKey &&
    !!firstShortcut.ctrlKey === !!secondShortcut.ctrlKey &&
    !!firstShortcut.shiftKey === !!secondShortcut.shiftKey &&
    !!firstShortcut.metaKey === !!secondShortcut.metaKey
  );
}

function findShortcutConflict(actionId, newShortcut) {
  return Object.entries(currentShortcuts).find(([existingActionId, shortcut]) => {
    return existingActionId !== actionId && shortcutsMatch(shortcut, newShortcut);
  });
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
    if (e.key === 'Escape' && !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      badgeEl.textContent = formatShortcut(currentShortcuts[actionId]);
      badgeEl.classList.remove('recording');
      document.removeEventListener('keydown', onKeydown, true);
      return;
    }

    // 跳過單獨的 modifier 按鍵
    if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

    // 必須帶 modifier
    if (!e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      showStatus(  '⚠️ Please use at least one modifier (Command / Ctrl / Alt / Shift)','error');
      return;
    }

    const newShortcut = {
      key:      e.key.toLowerCase(),
      altKey:   e.altKey,
      ctrlKey:  e.ctrlKey,
      shiftKey: e.shiftKey,
      metaKey:  e.metaKey,
      label:    currentShortcuts[actionId].label,
    };

    const conflict = findShortcutConflict(actionId, newShortcut);
    if (conflict) {
      const conflictingShortcut = conflict[1];
      badgeEl.textContent = formatShortcut(currentShortcuts[actionId]);
      badgeEl.classList.remove('recording');
      document.removeEventListener('keydown', onKeydown, true);
      showStatus(
        `⚠️ ${formatShortcut(newShortcut)} is already used by ${conflictingShortcut.label}. Choose another combination.`,
        'error',
        5000
      );
      return;
    }

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

  for (const [id, shortcut] of Object.entries(currentShortcuts)) {
    toSave[id] = {
      key: shortcut.key,
      altKey: shortcut.altKey,
      ctrlKey: shortcut.ctrlKey,
      shiftKey: shortcut.shiftKey,
      metaKey: shortcut.metaKey,
    };
  }

  chrome.storage.sync.set({ bbShortcuts: toSave }, () => {
    if (cb) {
      cb();
    } else {
      showStatus(
        '✓ Shortcut saved & active immediately',
        'success'
      );
    }
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
function showStatus(msg, type = 'success', duration = 2500) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = type;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, duration);
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
          metaKey:  saved.metaKey  ?? currentShortcuts[key].metaKey,
        };
      }
    }
  }
  renderTable();

  // --- 主題 ---
  // 空字符串或已從新版移除的主題，都安全回退到 Default Light。
  const storedTheme = data.bbTheme || null;
  const isAvailableTheme = THEMES.some(theme => theme.value === storedTheme);
  const activeTheme = isAvailableTheme ? storedTheme : null;

  if (storedTheme && !isAvailableTheme) {
    chrome.storage.sync.set({ bbTheme: '' });
  }

  renderThemeGrid(activeTheme);
});

chrome.storage.local.get(
  [COURSE_COVER_STORAGE_KEY, COURSE_COVER_POSITION_STORAGE_KEY],
  (data) => {
    renderCourseCoverPreview(
      data[COURSE_COVER_STORAGE_KEY],
      data[COURSE_COVER_POSITION_STORAGE_KEY]
    );
  }
);

// 按鈕事件
document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
document.getElementById('course-cover-input').addEventListener('change', handleCourseCoverSelection);
document.getElementById('course-cover-center').addEventListener('click', centerCourseCover);
document.getElementById('course-cover-clear').addEventListener('click', clearCourseCover);

const courseCoverPreview = document.getElementById('course-cover-preview');
courseCoverPreview.addEventListener('pointerdown', startCourseCoverDrag);
courseCoverPreview.addEventListener('pointermove', moveCourseCover);
courseCoverPreview.addEventListener('pointerup', event => finishCourseCoverDrag(event, true));
courseCoverPreview.addEventListener('pointercancel', event => finishCourseCoverDrag(event, false));
courseCoverPreview.addEventListener('keydown', handleCourseCoverPositionKey);
