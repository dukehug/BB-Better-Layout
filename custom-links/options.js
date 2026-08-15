// BB Better Layout - custom external-link settings UI.
// Draft rows stay local to this page until the user validates and saves them.

(() => {
    const configApi = window.BBLayout.customLinks;
    const form = document.getElementById('custom-links-form');
    const enabledCheckbox = document.getElementById('custom-links-enabled');
    const toggleLabel = document.getElementById('custom-links-toggle-label');
    const list = document.getElementById('custom-links-list');
    const addButton = document.getElementById('custom-link-add');
    const counter = document.getElementById('custom-links-counter');
    const status = document.getElementById('custom-links-status');

    let draftLinks = [];

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    function updateToggleLabel() {
        toggleLabel.textContent = enabledCheckbox.checked ? 'Enabled' : 'Disabled';
    }

    function createIconOption(option, selectedIcon) {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        element.selected = option.value === selectedIcon;
        return element;
    }

    function createField(labelText, control) {
        const label = document.createElement('label');
        label.className = 'custom-link-field';
        label.append(document.createTextNode(labelText), control);
        return label;
    }

    function createLinkRow(link, index) {
        const row = document.createElement('div');
        row.className = 'custom-link-row';
        row.dataset.index = String(index);
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', `External link ${index + 1}`);

        const header = document.createElement('div');
        header.className = 'custom-link-row-header';

        const heading = document.createElement('h3');
        heading.textContent = `Link ${index + 1}`;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'custom-link-remove';
        removeButton.textContent = 'Remove';
        removeButton.setAttribute('aria-label', `Remove external link ${index + 1}`);
        removeButton.addEventListener('click', () => {
            syncDraftFromForm();
            draftLinks.splice(index, 1);
            renderLinks();
            showStatus('Link removed from the draft. Save changes to apply.');
        });

        header.append(heading, removeButton);

        const fields = document.createElement('div');
        fields.className = 'custom-link-fields';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = link.name;
        nameInput.maxLength = configApi.MAX_NAME_LENGTH;
        nameInput.placeholder = 'e.g. Gmail';
        nameInput.autocomplete = 'off';
        nameInput.dataset.field = 'name';
        nameInput.setAttribute('aria-label', `Link ${index + 1} name`);

        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.value = link.url;
        urlInput.maxLength = configApi.MAX_URL_LENGTH;
        urlInput.placeholder = 'https://gmail.com';
        urlInput.autocomplete = 'url';
        urlInput.spellcheck = false;
        urlInput.dataset.field = 'url';
        urlInput.setAttribute('aria-label', `Link ${index + 1} URL`);

        const iconSelect = document.createElement('select');
        iconSelect.dataset.field = 'icon';
        iconSelect.setAttribute('aria-label', `Link ${index + 1} Material icon`);
        configApi.ICON_OPTIONS.forEach(option => {
            iconSelect.appendChild(createIconOption(option, link.icon));
        });

        const iconControl = document.createElement('div');
        iconControl.className = 'custom-link-icon-control';

        const iconPreview = document.createElement('span');
        iconPreview.className = 'custom-link-icon-preview';
        iconPreview.setAttribute('aria-hidden', 'true');

        const iconGlyph = document.createElement('span');
        iconGlyph.className = 'material-icons';
        iconGlyph.textContent = link.icon;
        iconPreview.appendChild(iconGlyph);
        iconSelect.addEventListener('change', () => {
            iconGlyph.textContent = configApi.normalizeIcon(iconSelect.value);
        });

        iconControl.append(iconPreview, iconSelect);
        fields.append(
            createField('Name', nameInput),
            createField('URL', urlInput),
            createField('Material icon', iconControl)
        );

        const error = document.createElement('p');
        error.className = 'custom-link-error';
        error.dataset.rowError = '';
        error.setAttribute('aria-live', 'polite');

        row.append(header, fields, error);
        return row;
    }

    function renderLinks() {
        list.replaceChildren();

        if (!draftLinks.length) {
            const empty = document.createElement('p');
            empty.className = 'custom-links-empty';
            empty.textContent = 'No custom links yet. Add a destination to show it in Blackboard\'s main navigation.';
            list.appendChild(empty);
        } else {
            draftLinks.forEach((link, index) => {
                list.appendChild(createLinkRow(link, index));
            });
        }

        counter.textContent = `${draftLinks.length} / ${configApi.MAX_LINKS}`;
        addButton.disabled = draftLinks.length >= configApi.MAX_LINKS;
    }

    function syncDraftFromForm() {
        const rows = Array.from(list.querySelectorAll('.custom-link-row'));
        if (!rows.length) return;

        draftLinks = rows.map(row => ({
            name: row.querySelector('[data-field="name"]').value,
            url: row.querySelector('[data-field="url"]').value,
            icon: row.querySelector('[data-field="icon"]').value
        }));
    }

    function validateDraft() {
        syncDraftFromForm();
        let firstInvalidControl = null;

        if (draftLinks.length > configApi.MAX_LINKS) {
            showStatus(`Only ${configApi.MAX_LINKS} links can be saved.`, true);
            return null;
        }

        const links = draftLinks.map((link, index) => {
            const row = list.querySelector(`.custom-link-row[data-index="${index}"]`);
            const nameInput = row.querySelector('[data-field="name"]');
            const urlInput = row.querySelector('[data-field="url"]');
            const rowError = row.querySelector('[data-row-error]');
            const name = configApi.normalizeName(link.name);
            const url = configApi.normalizeUrl(link.url);
            const errors = [];

            nameInput.setAttribute('aria-invalid', String(!name));
            urlInput.setAttribute('aria-invalid', String(!url));

            if (!name) errors.push('Enter a name.');
            if (!url) errors.push('Enter a complete http:// or https:// URL.');

            rowError.textContent = errors.join(' ');
            if (!firstInvalidControl && errors.length) {
                firstInvalidControl = !name ? nameInput : urlInput;
            }

            return {
                name,
                url,
                icon: configApi.normalizeIcon(link.icon)
            };
        });

        if (firstInvalidControl) {
            firstInvalidControl.focus();
            return null;
        }

        return links;
    }

    function saveCustomLinks(event) {
        event.preventDefault();
        const links = validateDraft();

        if (!links) {
            showStatus('Fix the highlighted link before saving.', true);
            return;
        }

        const value = configApi.normalizeConfig({
            enabled: enabledCheckbox.checked,
            links
        });
        const saveButton = form.querySelector('[type="submit"]');
        saveButton.disabled = true;

        chrome.storage.sync.set({ [configApi.STORAGE_KEY]: value }, () => {
            saveButton.disabled = false;

            if (chrome.runtime.lastError) {
                showStatus('Could not save the external links.', true);
                return;
            }

            draftLinks = value.links.map(link => ({ ...link }));
            renderLinks();
            showStatus(
                value.enabled
                    ? 'External links saved and enabled.'
                    : 'External links saved and disabled.'
            );
        });
    }

    function loadCustomLinks() {
        chrome.storage.sync.get(configApi.STORAGE_KEY, data => {
            if (chrome.runtime.lastError) {
                showStatus('Could not load the external links.', true);
                renderLinks();
                return;
            }

            const value = configApi.normalizeConfig(data[configApi.STORAGE_KEY]);
            enabledCheckbox.checked = value.enabled;
            draftLinks = value.links.map(link => ({ ...link }));
            updateToggleLabel();
            renderLinks();
        });
    }

    enabledCheckbox.addEventListener('change', () => {
        updateToggleLabel();
        showStatus('Save changes to apply this setting.');
    });

    addButton.addEventListener('click', () => {
        syncDraftFromForm();
        if (draftLinks.length >= configApi.MAX_LINKS) return;

        draftLinks.push({
            name: '',
            url: '',
            icon: configApi.DEFAULT_ICON
        });
        renderLinks();
        list.querySelector('.custom-link-row:last-child [data-field="name"]')?.focus();
        showStatus('New link added to the draft. Save changes to apply.');
    });

    form.addEventListener('submit', saveCustomLinks);
    loadCustomLinks();
})();
