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
    !!event.shiftKey === !!shortcut.shiftKey &&
    !!event.metaKey === !!shortcut.metaKey
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
// 課程搜索 dialog 的狀態
// ------------------------------------------
let bbCourseSearchPreviousFocus = null;

// ------------------------------------------
// 工具：判斷元素目前是否顯示
// ------------------------------------------
function bbIsVisible(element) {
  return !!(
    element &&
    element.getClientRects().length > 0 &&
    window.getComputedStyle(element).visibility !== 'hidden'
  );
}

// ------------------------------------------
// 工具：從 Courses 頁面的已載入卡片收集可進入的課程
// 卡片原生 href 是 javascript:void(0)，不能由 extension 直接執行；
// data-course-id 則是 Blackboard outline URL 使用的穩定課程識別碼。
// ------------------------------------------
function bbCollectOverviewCourses() {
  const cards = document.querySelectorAll(
    'article[data-course-id], .course-element-card[data-course-id]'
  );
  const courses = [];
  const seenCourseIds = new Set();

  cards.forEach((card) => {
    const courseId = card.dataset.courseId?.trim();
    const link = card.querySelector(
      'a[analytics-id="base.courses.courseCard.courseLink.link"], a.course-title'
    );
    const name = card.querySelector('.js-course-title-element, h4')
      ?.textContent?.trim();
    const section = card.querySelector('[id^="course-id-"]')
      ?.textContent?.trim();

    if (!courseId || !name || !link || seenCourseIds.has(courseId)) return;
    if (card.classList.contains('inactive-link')) return;

    seenCourseIds.add(courseId);
    courses.push({ courseId, name, section: section || '' });
  });

  return courses;
}

// ------------------------------------------
// Courses 頁面：建立獨立的課程搜索 dialog
// ------------------------------------------
function bbOpenOverviewCourseSearch() {
  const existingInput = document.getElementById('bb-course-search-input');
  if (existingInput) {
    existingInput.focus();
    return true;
  }

  let courses = bbCollectOverviewCourses();
  if (!courses.length) return false;

  const overviewInput = document.getElementById('courses-overview-filter-search');
  const previousOverviewQuery = overviewInput?.value || '';

  bbCourseSearchPreviousFocus = document.activeElement;

  const overlay = document.createElement('div');
  overlay.id = 'bb-course-search-overlay';

  const dialog = document.createElement('div');
  dialog.id = 'bb-course-search-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'bb-course-search-title');

  const header = document.createElement('div');
  header.className = 'bb-course-search-header';

  const title = document.createElement('h2');
  title.id = 'bb-course-search-title';
  title.textContent = 'Search courses';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'bb-course-search-close';
  closeButton.setAttribute('aria-label', 'Close course search');
  closeButton.textContent = '\u00d7';

  const input = document.createElement('input');
  input.id = 'bb-course-search-input';
  input.type = 'search';
  input.autocomplete = 'off';
  input.placeholder = 'Type a course name or section number';
  input.value = previousOverviewQuery;
  input.setAttribute('aria-label', 'Search courses');
  input.setAttribute('aria-controls', 'bb-course-search-results');
  input.setAttribute('aria-autocomplete', 'list');

  const results = document.createElement('div');
  results.id = 'bb-course-search-results';
  results.setAttribute('role', 'listbox');

  const status = document.createElement('p');
  status.className = 'bb-course-search-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  header.append(title, closeButton);
  dialog.append(header, input, results, status);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  let filteredCourses = courses;
  let selectedIndex = -1;
  let refreshTimer = null;

  function syncOverviewSearch(query) {
    if (!overviewInput) return;

    // 使用原生 setter，讓 Blackboard 的框架能收到 content script 改動後的值。
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;

    if (valueSetter) {
      valueSetter.call(overviewInput, query);
    } else {
      overviewInput.value = query;
    }

    overviewInput.dispatchEvent(new Event('input', { bubbles: true }));
    overviewInput.dispatchEvent(new Event('change', { bubbles: true }));
    overviewInput.dispatchEvent(new Event('search', { bubbles: true }));
  }

  function closeSearch(clearOverviewSearch = true) {
    const abandonedQuery = input.value;
    clearTimeout(refreshTimer);
    overlay.remove();

    if (clearOverviewSearch && overviewInput?.isConnected) {
      syncOverviewSearch('');

      // Blackboard 會對搜索做 debounce。若較早的搜索更新稍後把關鍵字寫回，
      // 再清除一次；若使用者已在原生搜索欄輸入其他內容則不干擾。
      setTimeout(() => {
        if (
          overviewInput.isConnected &&
          overviewInput.value === abandonedQuery
        ) {
          syncOverviewSearch('');
        }
      }, 650);
    }

    if (bbCourseSearchPreviousFocus?.isConnected) {
      bbCourseSearchPreviousFocus.focus();
    }
    bbCourseSearchPreviousFocus = null;
  }

  function openCourse(course) {
    // 導航前先清除 Blackboard 的搜索 model，否則返回 Courses 頁面時
    // SPA 會恢復剛才在 dialog 輸入的關鍵字。
    syncOverviewSearch('');
    closeSearch(false);

    // 不點擊 href="javascript:void(0)" 的原始 link，避免違反 extension CSP。
    const encodedCourseId = encodeURIComponent(course.courseId);
    const outlineUrl = new URL(
      `/ultra/courses/${encodedCourseId}/outline`,
      window.location.origin
    );
    window.location.assign(outlineUrl.href);
  }

  function updateSelection() {
    const options = results.querySelectorAll('[role="option"]');

    options.forEach((option, index) => {
      const isSelected = index === selectedIndex;
      option.classList.toggle('bb-course-search-selected', isSelected);
      option.setAttribute('aria-selected', String(isSelected));
    });

    const selectedOption = options[selectedIndex];
    if (selectedOption) {
      input.setAttribute('aria-activedescendant', selectedOption.id);
      selectedOption.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function renderResults() {
    const query = input.value.trim().toLocaleLowerCase();
    filteredCourses = courses.filter((course) => {
      const searchableText = `${course.name} ${course.section}`
        .toLocaleLowerCase();
      return searchableText.includes(query);
    });
    selectedIndex = -1;
    results.replaceChildren();

    filteredCourses.forEach((course, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.id = `bb-course-search-option-${index}`;
      option.className = 'bb-course-search-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');

      const name = document.createElement('span');
      name.className = 'bb-course-search-name';
      name.textContent = course.name;
      option.appendChild(name);

      if (course.section) {
        const section = document.createElement('span');
        section.className = 'bb-course-search-section';
        section.textContent = course.section;
        option.appendChild(section);
      }

      option.addEventListener('click', () => openCourse(course));
      results.appendChild(option);
    });

    status.textContent = filteredCourses.length
      ? `${filteredCourses.length} course${filteredCourses.length === 1 ? '' : 's'}`
      : 'No matching courses';
  }

  input.addEventListener('input', () => {
    syncOverviewSearch(input.value);
    renderResults();

    if (!overviewInput) return;

    // Blackboard 會在搜索後重新渲染卡片；稍後再收集一次即可包含其他分頁的匹配課程。
    status.textContent = 'Searching courses\u2026';
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      courses = bbCollectOverviewCourses();
      renderResults();
    }, 400);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (event.key === 'ArrowDown' && filteredCourses.length) {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredCourses.length;
      updateSelection();
      return;
    }

    if (event.key === 'ArrowUp' && filteredCourses.length) {
      event.preventDefault();
      selectedIndex = selectedIndex < 0
        ? filteredCourses.length - 1
        : (selectedIndex - 1 + filteredCourses.length) % filteredCourses.length;
      updateSelection();
      return;
    }

    if (event.key === 'Enter' && filteredCourses.length) {
      event.preventDefault();
      openCourse(filteredCourses[selectedIndex < 0 ? 0 : selectedIndex]);
    }
  });

  closeButton.addEventListener('click', closeSearch);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeSearch();
  });

  renderResults();
  input.focus();
  return true;
}

// ------------------------------------------
// Blackboard 頁面原生搜索控制項。
// 只點擊原生按鈕並聚焦原生輸入框，不改動搜索結果或顯示樣式。
// ------------------------------------------
const BB_NATIVE_PAGE_SEARCH = {
  outline: {
    buttonSelector: '[data-analytics-id="course-outline.filter.search.button"]',
    inputSelector: [
      '[data-analytics-id="course.outline.filter.searchBox"]',
      '#course-content-filter-input',
    ].join(', '),
  },
  roster: {
    buttonSelector: '[analytics-id="course.roster.search.button"]',
    inputSelector: [
      '[analytics-id="course.roster.searchRoster.input.text"]',
      '#search-roster-field',
    ].join(', '),
  },
};

function bbFocusNativePageSearch(inputSelector) {
  const input = document.querySelector(inputSelector);
  if (!bbIsVisible(input)) return false;

  input.focus();
  input.select();
  return true;
}

function bbPollAndFocusNativePageSearch(inputSelector) {
  const POLL_MS    = 100;
  const TIMEOUT_MS = 3000;
  const start = Date.now();

  const timer = setInterval(() => {
    if (bbFocusNativePageSearch(inputSelector)) {
      clearInterval(timer);
    } else if (Date.now() - start > TIMEOUT_MS) {
      clearInterval(timer);
    }
  }, POLL_MS);
}

function bbOpenNativePageSearch(config) {
  if (bbFocusNativePageSearch(config.inputSelector)) return true;

  const searchButton = document.querySelector(config.buttonSelector);
  if (!bbIsVisible(searchButton)) return false;

  searchButton.click();
  bbPollAndFocusNativePageSearch(config.inputSelector);
  return true;
}

function bbPollAndOpenNativePageSearch(config) {
  const POLL_MS    = 150;
  const TIMEOUT_MS = 5000;
  const start = Date.now();

  const timer = setInterval(() => {
    if (bbOpenNativePageSearch(config)) {
      clearInterval(timer);
    } else if (Date.now() - start > TIMEOUT_MS) {
      clearInterval(timer);
    }
  }, POLL_MS);
}

// ------------------------------------------
// 動作：持續輪詢直到 Courses 頁面的課程資料出現，再打開搜索 dialog。
// ------------------------------------------
function bbPollForOverviewCourseSearch() {
  const POLL_MS    = 150;
  const TIMEOUT_MS = 5000;
  const start = Date.now();

  const timer = setInterval(() => {
    if (bbOpenOverviewCourseSearch()) {
      clearInterval(timer);
    } else if (Date.now() - start > TIMEOUT_MS) {
      clearInterval(timer); // 超時放棄
    }
  }, POLL_MS);
}

// ------------------------------------------
// 動作：根據目前頁面打開對應搜索
// - Courses 頁面 → 顯示擴充功能的搜索 dialog
// - Course outline → 展開 Blackboard 原生 Course Content 搜索框
// - Roster → 展開 Blackboard 原生 Roster 搜索框
// - 其他頁面 → 先切換到 Courses，再顯示搜索 dialog
// ------------------------------------------
function bbOpenCourseSearch() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const isRoster = /^\/ultra\/courses\/[^/]+\/outline\/roster(?:\/|$)/
    .test(path);
  const isCourseOutline = /^\/ultra\/courses\/[^/]+\/outline$/
    .test(path);

  // Roster 是疊加在 outline 上的 SPA panel，必須比 outline 優先判斷。
  if (isRoster) {
    if (!bbOpenNativePageSearch(BB_NATIVE_PAGE_SEARCH.roster)) {
      bbPollAndOpenNativePageSearch(BB_NATIVE_PAGE_SEARCH.roster);
    }
    return;
  }

  if (isCourseOutline) {
    if (!bbOpenNativePageSearch(BB_NATIVE_PAGE_SEARCH.outline)) {
      bbPollAndOpenNativePageSearch(BB_NATIVE_PAGE_SEARCH.outline);
    }
    return;
  }

  if (window.location.pathname === '/ultra/course') {
    if (!bbOpenOverviewCourseSearch()) {
      bbPollForOverviewCourseSearch();
    }
    return;
  }

  // 其他頁面：觸發 SPA 導航，再等待課程卡片完成渲染。
  bbNavigateTo('courses');
  bbPollForOverviewCourseSearch();
}

// ------------------------------------------
// 事件處理：全局鍵盤監聽
// ------------------------------------------
function bbHandleKeydown(event) {
  if (event.isComposing) return;

  const activeEl = document.activeElement;

  const isEditing = activeEl && (
    activeEl.matches?.(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]'
    ) ||
    activeEl.isContentEditable
  );

  if (isEditing) return;

  for (const [action, shortcut] of Object.entries(bbCurrentShortcuts)) {
    if (!bbMatchShortcut(event, shortcut)) continue;

    event.preventDefault();

    if (action === 'search') {
      bbOpenCourseSearch();
    } else if (action === 'studyNote') {
      window.BBLayout?.studyNote?.openQuickNote();
    } else {
      bbNavigateTo(action);
    }

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
            metaKey:  saved.metaKey  ?? bbCurrentShortcuts[key].metaKey,
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
