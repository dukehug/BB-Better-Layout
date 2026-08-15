// Weekly Schedule - options-page toggle and local import summary.

(() => {
    const ENABLED_KEY = 'bbWeeklyScheduleEnabled';
    const COURSES_KEY = 'bbWeeklyScheduleCourses';
    const LAST_IMPORTED_KEY = 'bbWeeklyScheduleLastImportedAt';
    const checkbox = document.getElementById('weekly-schedule-enabled');
    const toggleLabel = document.getElementById('weekly-schedule-toggle-label');
    const meta = document.getElementById('weekly-schedule-setting-meta');
    const status = document.getElementById('weekly-schedule-setting-status');

    function updateToggleLabel() {
        toggleLabel.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
    }

    function updateImportSummary(courses, importedAt) {
        const courseCount = Array.isArray(courses) ? courses.length : 0;
        if (!importedAt) {
            meta.textContent = 'No courses have been imported yet.';
            return;
        }

        const date = new Date(importedAt);
        const dateLabel = Number.isNaN(date.getTime())
            ? 'previously'
            : new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }).format(date);
        meta.textContent = `${courseCount} course(s) imported ${dateLabel}.`;
    }

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    chrome.storage.local.get(
        [ENABLED_KEY, COURSES_KEY, LAST_IMPORTED_KEY],
        data => {
            if (chrome.runtime.lastError) {
                showStatus('Could not load this setting.', true);
                return;
            }

            // Match the content-side default while preserving an explicit false.
            checkbox.checked = typeof data[ENABLED_KEY] === 'boolean'
                ? data[ENABLED_KEY]
                : true;
            updateToggleLabel();
            updateImportSummary(data[COURSES_KEY], data[LAST_IMPORTED_KEY]);
        }
    );

    checkbox.addEventListener('change', () => {
        checkbox.disabled = true;
        updateToggleLabel();
        chrome.storage.local.set({ [ENABLED_KEY]: checkbox.checked }, () => {
            checkbox.disabled = false;
            if (chrome.runtime.lastError) {
                checkbox.checked = !checkbox.checked;
                updateToggleLabel();
                showStatus('Could not save this setting.', true);
                return;
            }

            showStatus(
                checkbox.checked
                    ? 'Weekly Schedule enabled.'
                    : 'Weekly Schedule disabled.'
            );
        });
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        if (changes[COURSES_KEY] || changes[LAST_IMPORTED_KEY]) {
            chrome.storage.local.get([COURSES_KEY, LAST_IMPORTED_KEY], data => {
                if (!chrome.runtime.lastError) {
                    updateImportSummary(data[COURSES_KEY], data[LAST_IMPORTED_KEY]);
                }
            });
        }
    });
})();
