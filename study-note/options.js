// Study Note - options-page feature and global-shortcut toggle.

(() => {
    const ENABLED_KEY = 'bbStudyNoteEnabled';
    const checkbox = document.getElementById('study-note-enabled');
    const status = document.getElementById('study-note-setting-status');

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    chrome.storage.local.get(ENABLED_KEY, data => {
        if (chrome.runtime.lastError) {
            showStatus('Could not load this setting.', true);
            return;
        }

        // Storage initialization creates this key; default to enabled if the options
        // page opens before Blackboard has run the initializer for the first time.
        checkbox.checked = typeof data[ENABLED_KEY] === 'boolean'
            ? data[ENABLED_KEY]
            : true;
    });

    checkbox.addEventListener('change', () => {
        checkbox.disabled = true;
        chrome.storage.local.set({ [ENABLED_KEY]: checkbox.checked }, () => {
            checkbox.disabled = false;
            if (chrome.runtime.lastError) {
                checkbox.checked = !checkbox.checked;
                showStatus('Could not save this setting.', true);
                return;
            }

            showStatus(checkbox.checked ? 'Study Note enabled.' : 'Study Note disabled.');
        });
    });
})();
