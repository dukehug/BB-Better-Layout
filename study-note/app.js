// Study Note - three-pane note workspace and global quick-note modal.
// UI state stays in this module; persistence and file transfer live in sibling files.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const storage = BBLayout.studyNoteStorage;
    const transfer = BBLayout.studyNoteTransfer;
    const markdown = BBLayout.studyNoteMarkdown;

    const state = {
        settingsLoaded: false,
        enabled: false,
        isOpen: false,
        notes: [],
        notebooks: [],
        activeNotebookId: 'all',
        selectedNoteId: null,
        selectionMode: false,
        selectedNoteIds: new Set(),
        searchQuery: '',
        editorMode: 'write',
        editorDirty: false,
        notebookDialogDirty: false,
        lastWorkspaceFocusedElement: null,
        lastQuickFocusedElement: null
    };

    let initialized = false;
    let navButton = null;
    let workspace = null;
    let quickModal = null;
    let statusTimeout = null;

    // ----- Global navigation integration -----

    function getGlobalNavigationContainer() {
        const globalList = document.getElementById('base_tools');
        if (!globalList) return null;

        return globalList.closest('nav') || globalList.parentElement;
    }

    function formatDate(dateValue, includeTime = false) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return '';

        const options = includeTime
            ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            : { month: 'short', day: 'numeric', year: 'numeric' };
        return new Intl.DateTimeFormat(undefined, options).format(date);
    }

    function bindNavigationButton(button) {
        if (button.dataset.bbStudyNoteBound !== 'true') {
            button.addEventListener('click', openWorkspace);
            button.dataset.bbStudyNoteBound = 'true';
        }

        if (state.isOpen) {
            button.setAttribute('aria-current', 'page');
        }
    }

    function createNavigationButton() {
        const button = document.createElement('button');
        const icon = document.createElement('span');

        button.type = 'button';
        button.className = 'bb-custom-bottom-link bb-study-note-nav-button';
        button.setAttribute('aria-label', 'Open Study Note');
        icon.className = 'material-icons bb-nav-icon';
        icon.textContent = 'edit_note';

        button.append(icon, document.createTextNode('Study Note'));
        bindNavigationButton(button);
        return button;
    }

    function ensureNavigationButton() {
        const container = getGlobalNavigationContainer();
        if (!container) return;

        bindGlobalNavigation(container);
        if (navButton?.isConnected) return;

        const existingButton = container.querySelector('.bb-study-note-nav-button');
        if (existingButton) {
            navButton = existingButton;
            bindNavigationButton(navButton);
            return;
        }

        navButton = createNavigationButton();
        // Keep Study Note with the bottom utility links, immediately before the
        // first external destination added by sidebar.js.
        const firstExternalLink = container.querySelector('.bb-external-quick-link');
        container.insertBefore(navButton, firstExternalLink || null);
    }

    function bindGlobalNavigation(container) {
        if (container.dataset.bbStudyNoteNavigationBound === 'true') return;

        container.addEventListener('click', handleGlobalNavigationClick, true);
        container.dataset.bbStudyNoteNavigationBound = 'true';
    }

    function handleGlobalNavigationClick(event) {
        if (!state.isOpen) return;

        const nativeNavigationItem = event.target.closest(
            '[data-analytics-id^="base.nav.navigation."]'
        );
        if (!nativeNavigationItem) return;

        if (!requestCloseWorkspace()) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    // ----- Workspace creation and event wiring -----

    function createWorkspace() {
        if (workspace?.isConnected) return;

        workspace = document.createElement('section');
        workspace.id = 'bb-study-note-workspace';
        workspace.hidden = true;
        workspace.setAttribute('aria-label', 'Study Note');
        workspace.innerHTML = `
            <header class="bb-study-note-header">
                <div class="bb-study-note-brand">
                    <span class="material-icons" aria-hidden="true">edit_note</span>
                    <div>
                        <span class="bb-study-note-eyebrow">Device-local notebook</span>
                        <h1>Study Note</h1>
                    </div>
                </div>
                <div class="bb-study-note-header-actions">
                    <button type="button" data-action="quick-note">Quick note</button>
                    <button type="button" data-action="import-backup" title="Append a JSON or CSV backup">Import</button>
                    <button type="button" data-action="export-json">JSON</button>
                    <button type="button" data-action="export-csv">CSV</button>
                    <button type="button" class="bb-study-note-close" data-action="close" aria-label="Close Study Note">×</button>
                    <input id="bb-study-note-import" type="file" accept="application/json,text/csv,.json,.csv" hidden>
                </div>
            </header>
            <div class="bb-study-note-layout">
                <aside class="bb-study-note-notebooks" aria-label="Notebooks">
                    <div class="bb-study-note-section-title">
                        <span>Notes</span>
                    </div>
                    <nav id="bb-study-note-system-filters" class="bb-study-note-filter-list"></nav>
                    <div class="bb-study-note-section-title">
                        <span>Notebooks</span>
                        <button type="button" data-action="new-notebook" aria-label="Create notebook">+</button>
                    </div>
                    <nav id="bb-study-note-notebook-list" class="bb-study-note-filter-list"></nav>
                    <p class="bb-study-note-local-message">Stored only in this Chrome profile. Export JSON for a restorable backup.</p>
                </aside>
                <section class="bb-study-note-list-panel" aria-label="Note list">
                    <div class="bb-study-note-list-toolbar">
                        <label>
                            <span class="bb-study-note-visually-hidden">Search notes</span>
                            <input id="bb-study-note-search" type="search" placeholder="Search notes" autocomplete="off">
                        </label>
                        <button type="button" class="bb-study-note-primary" data-action="new-note">+ New</button>
                    </div>
                    <div class="bb-study-note-list-heading">
                        <div>
                            <span class="bb-study-note-eyebrow">Current view</span>
                            <h2 id="bb-study-note-view-title">All Notes</h2>
                        </div>
                        <div class="bb-study-note-selection-actions">
                            <span id="bb-study-note-count"></span>
                            <button
                                type="button"
                                data-action="toggle-note-selection"
                                aria-label="Select multiple notes"
                                aria-pressed="false"
                                title="Select multiple notes"
                            >
                                <span class="material-icons" aria-hidden="true">check_box_outline_blank</span>
                            </button>
                            <button
                                type="button"
                                class="bb-study-note-bulk-delete"
                                data-action="delete-selected-notes"
                                aria-label="Delete selected notes"
                                title="Delete selected notes"
                                hidden
                            >
                                <span class="material-icons" aria-hidden="true">delete_outline</span>
                            </button>
                        </div>
                    </div>
                    <div id="bb-study-note-list" class="bb-study-note-list"></div>
                </section>
                <main class="bb-study-note-editor-panel" aria-label="Note editor">
                    <div id="bb-study-note-empty" class="bb-study-note-empty-editor">
                        <span class="material-icons" aria-hidden="true">sticky_note_2</span>
                        <h2>Select a note</h2>
                        <p>Choose a note from the list or create a new one.</p>
                        <button type="button" class="bb-study-note-primary" data-action="new-note">Create note</button>
                    </div>
                    <form id="bb-study-note-editor" hidden>
                        <input id="bb-study-note-id" type="hidden">
                        <div class="bb-study-note-editor-topline">
                            <label>
                                <span class="bb-study-note-visually-hidden">Note title</span>
                                <input id="bb-study-note-title" type="text" maxlength="200" placeholder="Note title" required>
                            </label>
                            <div class="bb-study-note-editor-actions">
                                <button type="button" class="bb-study-note-danger" data-action="delete-note">Delete</button>
                                <button type="submit" class="bb-study-note-primary">Save note</button>
                            </div>
                        </div>
                        <div class="bb-study-note-metadata">
                            <label class="bb-study-note-notebook-field">
                                <span class="bb-study-note-field-label">Notebook</span>
                                <span class="bb-study-note-select-wrapper">
                                    <select id="bb-study-note-notebook"></select>
                                    <span class="material-icons" aria-hidden="true">expand_more</span>
                                </span>
                            </label>
                            <span id="bb-study-note-dates"></span>
                        </div>
                        <div class="bb-study-note-markdown-editor">
                            <div class="bb-study-note-markdown-toolbar" role="toolbar" aria-label="Markdown formatting">
                                <div class="bb-study-note-markdown-tools">
                                    <button type="button" data-action="markdown-format" data-markdown="heading" title="Heading" aria-label="Insert heading"><span class="material-icons" aria-hidden="true">title</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="bold" title="Bold (Ctrl+B)" aria-label="Bold"><span class="material-icons" aria-hidden="true">format_bold</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="italic" title="Italic (Ctrl+I)" aria-label="Italic"><span class="material-icons" aria-hidden="true">format_italic</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="bullet-list" title="Bulleted list" aria-label="Insert bulleted list"><span class="material-icons" aria-hidden="true">format_list_bulleted</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="numbered-list" title="Numbered list" aria-label="Insert numbered list"><span class="material-icons" aria-hidden="true">format_list_numbered</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="quote" title="Quote" aria-label="Insert quote"><span class="material-icons" aria-hidden="true">format_quote</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="inline-code" title="Inline code" aria-label="Insert inline code"><span class="material-icons" aria-hidden="true">code</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="code-block" title="Code block" aria-label="Insert code block"><span class="material-icons" aria-hidden="true">data_object</span></button>
                                    <button type="button" data-action="markdown-format" data-markdown="link" title="Link (Ctrl+K)" aria-label="Insert link"><span class="material-icons" aria-hidden="true">link</span></button>
                                </div>
                                <div class="bb-study-note-markdown-tabs" role="group" aria-label="Editor view">
                                    <button type="button" data-action="markdown-write" aria-pressed="true">Write</button>
                                    <button type="button" data-action="markdown-preview" aria-pressed="false">Preview</button>
                                </div>
                            </div>
                            <label class="bb-study-note-content-label">
                                <span class="bb-study-note-visually-hidden">Markdown note content</span>
                                <textarea id="bb-study-note-content" maxlength="50000" placeholder="Write Markdown here…"></textarea>
                            </label>
                            <article id="bb-study-note-markdown-preview" class="bb-study-note-markdown-preview" aria-label="Markdown preview" tabindex="0" hidden></article>
                        </div>
                    </form>
                </main>
            </div>
            <div id="bb-study-note-notebook-modal" class="bb-study-note-small-modal" hidden>
                <div class="bb-study-note-small-modal-backdrop" data-action="cancel-notebook"></div>
                <section role="dialog" aria-modal="true" aria-labelledby="bb-study-note-notebook-dialog-title">
                    <form id="bb-study-note-notebook-form">
                        <input id="bb-study-note-notebook-id" type="hidden">
                        <div class="bb-study-note-small-modal-heading">
                            <h2 id="bb-study-note-notebook-dialog-title">New notebook</h2>
                            <button type="button" data-action="cancel-notebook" aria-label="Close notebook editor">×</button>
                        </div>
                        <label>
                            <span>Notebook name</span>
                            <input id="bb-study-note-notebook-name" type="text" maxlength="80" required autocomplete="off">
                        </label>
                        <div class="bb-study-note-small-modal-actions">
                            <button type="button" data-action="cancel-notebook">Cancel</button>
                            <button type="submit" class="bb-study-note-primary">Save</button>
                        </div>
                    </form>
                </section>
            </div>
            <div id="bb-study-note-status" class="bb-study-note-status" role="status" aria-live="polite"></div>
        `;

        document.body.appendChild(workspace);
        bindWorkspaceEvents();
        updateWorkspaceOffset();
    }

    function bindWorkspaceEvents() {
        workspace.addEventListener('click', handleWorkspaceClick);
        workspace.querySelector('#bb-study-note-search').addEventListener('input', event => {
            state.searchQuery = event.currentTarget.value.trim().toLowerCase();
            state.selectedNoteIds.clear();
            renderNoteList();
        });
        const editor = workspace.querySelector('#bb-study-note-editor');
        editor.addEventListener('submit', saveEditorNote);
        editor.addEventListener('input', markEditorDirty);
        editor.addEventListener('change', markEditorDirty);
        workspace.querySelector('#bb-study-note-content')
            .addEventListener('keydown', handleMarkdownShortcut);
        const notebookForm = workspace.querySelector('#bb-study-note-notebook-form');
        notebookForm.addEventListener('submit', saveNotebookFromDialog);
        notebookForm.addEventListener('input', () => {
            state.notebookDialogDirty = true;
            workspace.querySelector('#bb-study-note-notebook-name').setCustomValidity('');
        });
        workspace.querySelector('#bb-study-note-import').addEventListener('change', handleImportSelection);
    }

    function handleWorkspaceClick(event) {
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton || !workspace.contains(actionButton)) return;

        const actions = {
            'quick-note': openQuickNote,
            'new-note': createNewNote,
            'new-notebook': () => openNotebookDialog(),
            'rename-notebook': () => openNotebookDialog(actionButton.dataset.notebookId),
            'delete-notebook': () => deleteNotebook(actionButton.dataset.notebookId),
            'cancel-notebook': closeNotebookDialog,
            'delete-note': deleteSelectedNote,
            'toggle-note-selection': toggleNoteSelectionMode,
            'delete-selected-notes': deleteSelectedNotes,
            'markdown-format': () => applyMarkdownFormat(actionButton.dataset.markdown),
            'markdown-write': () => setMarkdownMode('write'),
            'markdown-preview': () => setMarkdownMode('preview'),
            'import-backup': () => workspace.querySelector('#bb-study-note-import').click(),
            'export-json': exportJson,
            'export-csv': exportCsv,
            'close': requestCloseWorkspace
        };

        actions[actionButton.dataset.action]?.();
    }

    function markEditorDirty() {
        state.editorDirty = true;
    }

    // ----- Markdown editor controls -----

    function renderMarkdownPreview() {
        const preview = workspace?.querySelector('#bb-study-note-markdown-preview');
        const textarea = workspace?.querySelector('#bb-study-note-content');
        if (!preview || !textarea) return;
        markdown.render(preview, textarea.value);
    }

    function setMarkdownMode(mode) {
        if (!workspace) return;

        state.editorMode = mode === 'preview' ? 'preview' : 'write';
        const writeMode = state.editorMode === 'write';
        const contentLabel = workspace.querySelector('.bb-study-note-content-label');
        const preview = workspace.querySelector('#bb-study-note-markdown-preview');
        const writeButton = workspace.querySelector('[data-action="markdown-write"]');
        const previewButton = workspace.querySelector('[data-action="markdown-preview"]');

        contentLabel.hidden = !writeMode;
        preview.hidden = writeMode;
        writeButton.setAttribute('aria-pressed', String(writeMode));
        previewButton.setAttribute('aria-pressed', String(!writeMode));
        if (!writeMode) renderMarkdownPreview();
    }

    function replaceMarkdownSelection(prefix, suffix, placeholder) {
        const textarea = workspace.querySelector('#bb-study-note-content');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.slice(start, end) || placeholder;
        const replacement = `${prefix}${selected}${suffix}`;
        textarea.setRangeText(replacement, start, end, 'end');
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
    }

    function prefixMarkdownLines(prefixType) {
        const textarea = workspace.querySelector('#bb-study-note-content');
        const value = textarea.value;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
        const nextBreak = value.indexOf('\n', selectionEnd);
        const lineEnd = nextBreak === -1 ? value.length : nextBreak;
        const selectedLines = value.slice(lineStart, lineEnd).split('\n');
        const transformed = selectedLines.map((line, index) => {
            if (prefixType === 'numbered-list') return `${index + 1}. ${line}`;
            if (prefixType === 'bullet-list') return `- ${line}`;
            if (prefixType === 'quote') return `> ${line}`;
            return `## ${line}`;
        }).join('\n');

        textarea.setRangeText(transformed, lineStart, lineEnd, 'select');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
    }

    function insertMarkdownLink() {
        const textarea = workspace.querySelector('#bb-study-note-content');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.slice(start, end);
        const selectedUrl = selectedText.trim();
        const selectionIsUrl = /^(https?:\/\/|mailto:)[^\s]+$/i.test(selectedUrl)
            && markdown.isSafeUrl(selectedUrl);
        const label = selectionIsUrl ? 'link text' : selectedText || 'link text';
        const url = selectionIsUrl ? selectedUrl : 'https://';
        const replacement = `[${label}](${url})`;
        textarea.setRangeText(replacement, start, end, 'end');

        // A selected URL already supplies the destination, so select the label.
        // Otherwise select the placeholder URL, preserving the original workflow.
        const editableStart = selectionIsUrl ? start + 1 : start + label.length + 3;
        const editableLength = selectionIsUrl ? label.length : url.length;
        textarea.setSelectionRange(editableStart, editableStart + editableLength);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
    }

    function applyMarkdownFormat(format) {
        setMarkdownMode('write');
        const formatters = {
            heading: () => prefixMarkdownLines('heading'),
            bold: () => replaceMarkdownSelection('**', '**', 'bold text'),
            italic: () => replaceMarkdownSelection('*', '*', 'italic text'),
            'bullet-list': () => prefixMarkdownLines('bullet-list'),
            'numbered-list': () => prefixMarkdownLines('numbered-list'),
            quote: () => prefixMarkdownLines('quote'),
            'inline-code': () => replaceMarkdownSelection('`', '`', 'code'),
            'code-block': () => replaceMarkdownSelection('```\n', '\n```', 'code'),
            link: insertMarkdownLink
        };
        formatters[format]?.();
    }

    function handleMarkdownShortcut(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
            replaceMarkdownSelection('  ', '', '');
            return;
        }
        if (!(event.metaKey || event.ctrlKey) || event.altKey) return;

        const shortcuts = { b: 'bold', i: 'italic', k: 'link' };
        const format = shortcuts[event.key.toLowerCase()];
        if (!format) return;
        event.preventDefault();
        applyMarkdownFormat(format);
    }

    function confirmDiscardChanges() {
        if (!state.editorDirty && !state.notebookDialogDirty) return true;

        let message = 'This note has unsaved changes. Leave without saving them?';
        if (!state.editorDirty && state.notebookDialogDirty) {
            message = 'This notebook name has not been saved. Leave without saving it?';
        } else if (state.editorDirty && state.notebookDialogDirty) {
            message = 'There are unsaved note and notebook changes. Leave without saving them?';
        }

        const shouldDiscard = window.confirm(message);
        if (shouldDiscard) {
            state.editorDirty = false;
            state.notebookDialogDirty = false;
        }
        return shouldDiscard;
    }

    // ----- Notebook filters and note rendering -----

    function getActiveNotebookName() {
        if (state.activeNotebookId === 'all') return 'All Notes';

        return state.notebooks.find(notebook => notebook.id === state.activeNotebookId)?.name || 'All Notes';
    }

    function getVisibleNotes() {
        return state.notes
            .filter(note => {
                return state.activeNotebookId === 'all' || note.notebookId === state.activeNotebookId;
            })
            .filter(note => {
                if (!state.searchQuery) return true;
                return `${note.title} ${note.content}`.toLowerCase().includes(state.searchQuery);
            })
            .sort((firstNote, secondNote) => {
                return new Date(secondNote.updatedAt) - new Date(firstNote.updatedAt);
            });
    }

    function createFilterButton(id, name, count) {
        const button = document.createElement('button');
        const label = document.createElement('span');
        const badge = document.createElement('span');

        button.type = 'button';
        button.className = 'bb-study-note-filter';
        button.classList.toggle('is-active', state.activeNotebookId === id);
        button.dataset.notebookId = id;
        label.textContent = name;
        badge.textContent = count;
        button.append(label, badge);
        button.addEventListener('click', () => selectNotebook(id));
        return button;
    }

    function renderNotebooks() {
        const systemFilters = workspace.querySelector('#bb-study-note-system-filters');
        const notebookList = workspace.querySelector('#bb-study-note-notebook-list');
        systemFilters.replaceChildren(createFilterButton('all', 'All Notes', state.notes.length));
        notebookList.replaceChildren();

        state.notebooks.forEach(notebook => {
            const count = state.notes.filter(note => note.notebookId === notebook.id).length;
            const row = document.createElement('div');
            const actions = document.createElement('div');
            const renameButton = document.createElement('button');
            const deleteButton = document.createElement('button');
            const renameIcon = document.createElement('span');
            const deleteIcon = document.createElement('span');

            row.className = 'bb-study-note-notebook-row';
            actions.className = 'bb-study-note-notebook-actions';

            renameButton.type = 'button';
            renameButton.className = 'bb-study-note-notebook-action';
            renameButton.dataset.action = 'rename-notebook';
            renameButton.dataset.notebookId = notebook.id;
            renameButton.setAttribute('aria-label', `Rename ${notebook.name}`);
            renameIcon.className = 'material-icons';
            renameIcon.textContent = 'edit';
            renameIcon.setAttribute('aria-hidden', 'true');
            renameButton.appendChild(renameIcon);

            deleteButton.type = 'button';
            deleteButton.className = 'bb-study-note-notebook-action';
            deleteButton.dataset.action = 'delete-notebook';
            deleteButton.dataset.notebookId = notebook.id;
            deleteButton.setAttribute('aria-label', `Delete ${notebook.name}`);
            deleteIcon.className = 'material-icons';
            deleteIcon.textContent = 'delete_outline';
            deleteIcon.setAttribute('aria-hidden', 'true');
            deleteButton.appendChild(deleteIcon);

            actions.append(renameButton, deleteButton);
            row.append(createFilterButton(notebook.id, notebook.name, count), actions);
            notebookList.appendChild(row);
        });
    }

    function createNoteListItem(note) {
        const button = document.createElement('button');
        const content = document.createElement('span');
        const title = document.createElement('strong');
        const preview = document.createElement('span');
        const metadata = document.createElement('span');

        button.type = 'button';
        button.className = 'bb-study-note-list-item';
        button.classList.toggle('is-active', !state.selectionMode && state.selectedNoteId === note.id);
        button.classList.toggle('is-selection-mode', state.selectionMode);
        button.classList.toggle('is-selected', state.selectedNoteIds.has(note.id));
        button.setAttribute(
            'aria-label',
            state.selectionMode ? `Select ${note.title}` : `Open ${note.title}`
        );
        if (state.selectionMode) {
            button.setAttribute('aria-pressed', String(state.selectedNoteIds.has(note.id)));
        }

        if (state.selectionMode) {
            const selectionIcon = document.createElement('span');
            selectionIcon.className = 'material-icons bb-study-note-selection-icon';
            selectionIcon.textContent = state.selectedNoteIds.has(note.id)
                ? 'check_box'
                : 'check_box_outline_blank';
            selectionIcon.setAttribute('aria-hidden', 'true');
            button.appendChild(selectionIcon);
        }

        content.className = 'bb-study-note-list-item-content';
        title.textContent = note.title || 'Untitled note';
        preview.textContent = markdown.toPlainText(note.content) || 'Empty note';
        metadata.textContent = `Modified ${formatDate(note.updatedAt, true)}`;
        content.append(title, preview, metadata);
        button.appendChild(content);
        button.addEventListener('click', () => {
            if (state.selectionMode) {
                toggleSelectedNote(note.id);
            } else {
                selectNote(note.id);
            }
        });
        return button;
    }

    function renderSelectionActions(visibleNotes) {
        const toggleButton = workspace.querySelector('[data-action="toggle-note-selection"]');
        const deleteButton = workspace.querySelector('[data-action="delete-selected-notes"]');
        const toggleIcon = toggleButton.querySelector('.material-icons');
        const visibleNoteIds = new Set(visibleNotes.map(note => note.id));

        state.selectedNoteIds.forEach(noteId => {
            if (!visibleNoteIds.has(noteId)) state.selectedNoteIds.delete(noteId);
        });

        toggleButton.setAttribute('aria-pressed', String(state.selectionMode));
        toggleButton.title = state.selectionMode ? 'Exit note selection' : 'Select multiple notes';
        toggleButton.setAttribute('aria-label', toggleButton.title);
        toggleIcon.textContent = state.selectionMode ? 'check_box' : 'check_box_outline_blank';
        deleteButton.hidden = !state.selectionMode;
        deleteButton.disabled = state.selectedNoteIds.size === 0;
        deleteButton.title = state.selectedNoteIds.size > 0
            ? `Delete ${state.selectedNoteIds.size} selected note(s)`
            : 'Select notes to delete';
    }

    function renderNoteList() {
        if (!workspace) return;

        const list = workspace.querySelector('#bb-study-note-list');
        const visibleNotes = getVisibleNotes();
        workspace.querySelector('#bb-study-note-view-title').textContent = getActiveNotebookName();
        renderSelectionActions(visibleNotes);
        workspace.querySelector('#bb-study-note-count').textContent = state.selectionMode
            ? `${state.selectedNoteIds.size} selected`
            : `${visibleNotes.length} note${visibleNotes.length === 1 ? '' : 's'}`;
        list.replaceChildren();

        if (visibleNotes.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'bb-study-note-empty-list';
            empty.textContent = state.searchQuery ? 'No notes match your search.' : 'No notes in this view yet.';
            list.appendChild(empty);
            return;
        }

        visibleNotes.forEach(note => list.appendChild(createNoteListItem(note)));
    }

    function fillNotebookSelect(select, selectedId) {
        select.replaceChildren();
        state.notebooks.forEach(notebook => {
            const option = document.createElement('option');
            option.value = notebook.id;
            option.textContent = notebook.name;
            option.selected = notebook.id === selectedId;
            select.appendChild(option);
        });
    }

    function renderEditor() {
        if (!workspace) return;

        const note = state.notes.find(item => item.id === state.selectedNoteId);
        const editor = workspace.querySelector('#bb-study-note-editor');
        const emptyEditor = workspace.querySelector('#bb-study-note-empty');
        editor.hidden = !note;
        emptyEditor.hidden = Boolean(note);

        if (!note) return;

        workspace.querySelector('#bb-study-note-id').value = note.id;
        workspace.querySelector('#bb-study-note-title').value = note.title;
        workspace.querySelector('#bb-study-note-content').value = note.content;
        fillNotebookSelect(workspace.querySelector('#bb-study-note-notebook'), note.notebookId);
        workspace.querySelector('#bb-study-note-dates').textContent =
            `Created ${formatDate(note.createdAt)} · Modified ${formatDate(note.updatedAt, true)}`;
        setMarkdownMode(state.editorMode);
        state.editorDirty = false;
    }

    function renderWorkspace() {
        if (!workspace?.isConnected) return;

        renderNotebooks();
        renderNoteList();
        renderEditor();
    }

    // ----- Multi-select state -----

    function resetNoteSelection() {
        state.selectionMode = false;
        state.selectedNoteIds.clear();
    }

    function toggleNoteSelectionMode() {
        state.selectionMode = !state.selectionMode;
        state.selectedNoteIds.clear();
        renderNoteList();
    }

    function toggleSelectedNote(noteId) {
        if (state.selectedNoteIds.has(noteId)) {
            state.selectedNoteIds.delete(noteId);
        } else {
            state.selectedNoteIds.add(noteId);
        }
        renderNoteList();
    }

    async function deleteSelectedNotes() {
        const selectedIds = new Set(state.selectedNoteIds);
        if (selectedIds.size === 0) return;
        if (!confirmDiscardChanges()) return;

        const confirmed = window.confirm(
            `Delete ${selectedIds.size} selected note(s)? This cannot be undone.`
        );
        if (!confirmed) return;

        const previousNotes = state.notes;
        const previousSelectedNoteId = state.selectedNoteId;
        const previousEditorDirty = state.editorDirty;
        const previousSelectionMode = state.selectionMode;
        const previousSelectedNoteIds = new Set(state.selectedNoteIds);
        state.notes = state.notes.filter(note => !selectedIds.has(note.id));
        if (selectedIds.has(state.selectedNoteId)) {
            state.selectedNoteId = null;
            state.editorDirty = false;
        }
        resetNoteSelection();
        renderWorkspace();

        try {
            await storage.saveNotes(state.notes);
            showStatus(`${selectedIds.size} note(s) deleted.`);
        } catch (error) {
            state.notes = previousNotes;
            state.selectedNoteId = previousSelectedNoteId;
            state.editorDirty = previousEditorDirty;
            state.selectionMode = previousSelectionMode;
            state.selectedNoteIds = previousSelectedNoteIds;
            renderWorkspace();
            showStatus('Could not delete the selected notes.', true);
        }
    }

    function selectNotebook(notebookId) {
        if (notebookId === state.activeNotebookId) return;
        if (!confirmDiscardChanges()) return;

        resetNoteSelection();
        state.activeNotebookId = notebookId;
        state.selectedNoteId = null;
        renderWorkspace();
    }

    function selectNote(noteId) {
        if (noteId === state.selectedNoteId) return;
        if (!confirmDiscardChanges()) return;

        state.selectedNoteId = noteId;
        renderNoteList();
        renderEditor();
    }

    function getDefaultNotebookId() {
        if (state.activeNotebookId !== 'all') return state.activeNotebookId;
        return state.notebooks.find(notebook => notebook.id === 'quick-notes')?.id
            || state.notebooks[0]?.id;
    }

    // ----- Note create, update, and delete operations -----

    async function createNewNote() {
        if (!confirmDiscardChanges()) return;

        resetNoteSelection();
        const now = new Date().toISOString();
        const note = {
            id: storage.createId('note'),
            title: 'Untitled note',
            content: '',
            notebookId: getDefaultNotebookId(),
            createdAt: now,
            updatedAt: now
        };

        state.notes = [note, ...state.notes];
        state.selectedNoteId = note.id;
        state.editorMode = 'write';
        state.editorDirty = false;
        await persistNotes('New note created.');
        workspace.querySelector('#bb-study-note-title')?.select();
    }

    async function saveEditorNote(event) {
        event.preventDefault();
        const noteId = workspace.querySelector('#bb-study-note-id').value;
        const title = workspace.querySelector('#bb-study-note-title').value.trim();
        const content = workspace.querySelector('#bb-study-note-content').value;
        const notebookId = workspace.querySelector('#bb-study-note-notebook').value;

        state.notes = state.notes.map(note => {
            if (note.id !== noteId) return note;
            return {
                ...note,
                title: title || 'Untitled note',
                content,
                notebookId,
                updatedAt: new Date().toISOString()
            };
        });
        state.editorDirty = false;
        await persistNotes('Note saved.');
    }

    async function deleteSelectedNote() {
        const note = state.notes.find(item => item.id === state.selectedNoteId);
        if (!note || !window.confirm(`Delete “${note.title}”?`)) return;

        state.notes = state.notes.filter(item => item.id !== note.id);
        state.selectedNoteId = null;
        state.editorDirty = false;
        state.selectedNoteIds.delete(note.id);
        await persistNotes('Note deleted.');
    }

    // ----- Notebook create, rename, and delete operations -----

    function openNotebookDialog(notebookId = '') {
        const notebook = state.notebooks.find(item => item.id === notebookId);
        const modal = workspace.querySelector('#bb-study-note-notebook-modal');

        workspace.querySelector('#bb-study-note-notebook-id').value = notebook?.id || '';
        workspace.querySelector('#bb-study-note-notebook-name').value = notebook?.name || '';
        workspace.querySelector('#bb-study-note-notebook-name').setCustomValidity('');
        workspace.querySelector('#bb-study-note-notebook-dialog-title').textContent =
            notebook ? 'Rename notebook' : 'New notebook';
        state.notebookDialogDirty = false;
        modal.hidden = false;
        workspace.querySelector('#bb-study-note-notebook-name').focus();
    }

    function closeNotebookDialog() {
        if (!workspace) return;

        const modal = workspace.querySelector('#bb-study-note-notebook-modal');
        modal.hidden = true;
        state.notebookDialogDirty = false;
        workspace.querySelector('#bb-study-note-notebook-form').reset();
    }

    function refreshNotebookUi() {
        const editorSelect = workspace?.querySelector('#bb-study-note-notebook');
        const pendingNotebookId = editorSelect?.value;

        renderNotebooks();
        renderNoteList();

        if (!state.editorDirty) {
            renderEditor();
        } else if (editorSelect) {
            const selectedNote = state.notes.find(note => note.id === state.selectedNoteId);
            const preservedNotebookId = state.notebooks.some(notebook => notebook.id === pendingNotebookId)
                ? pendingNotebookId
                : selectedNote?.notebookId;
            fillNotebookSelect(editorSelect, preservedNotebookId);
        }

        if (quickModal && !quickModal.hidden) {
            const quickSelect = quickModal.querySelector('#bb-study-note-quick-notebook');
            const quickNotebookId = quickSelect.value;
            fillNotebookSelect(quickSelect, quickNotebookId);
        }
    }

    async function saveNotebookFromDialog(event) {
        event.preventDefault();
        const notebookId = workspace.querySelector('#bb-study-note-notebook-id').value;
        const name = workspace.querySelector('#bb-study-note-notebook-name').value.trim().slice(0, 80);
        if (!name) return;

        const duplicateName = state.notebooks.some(notebook => {
            return notebook.id !== notebookId && notebook.name.toLowerCase() === name.toLowerCase();
        });
        if (duplicateName) {
            const nameInput = workspace.querySelector('#bb-study-note-notebook-name');
            nameInput.setCustomValidity('A notebook with this name already exists.');
            nameInput.reportValidity();
            return;
        }

        const previousNotebooks = state.notebooks;
        const isRenaming = Boolean(notebookId);
        if (isRenaming) {
            state.notebooks = state.notebooks.map(notebook => {
                return notebook.id === notebookId ? { ...notebook, name } : notebook;
            });
        } else {
            state.notebooks = [...state.notebooks, {
                id: storage.createId('notebook'),
                name,
                createdAt: new Date().toISOString()
            }];
        }

        try {
            await storage.saveNotebooks(state.notebooks);
            state.notebookDialogDirty = false;
            closeNotebookDialog();
            refreshNotebookUi();
            showStatus(isRenaming ? 'Notebook renamed.' : 'Notebook created.');
        } catch (error) {
            state.notebooks = previousNotebooks;
            refreshNotebookUi();
            showStatus('Could not save the notebook.', true);
        }
    }

    async function deleteNotebook(notebookId) {
        const notebook = state.notebooks.find(item => item.id === notebookId);
        if (!notebook) return;
        if (state.notebooks.length === 1) {
            showStatus('Keep at least one notebook.', true);
            return;
        }

        const fallbackNotebook = state.notebooks.find(item => item.id !== notebookId);
        const noteCount = state.notes.filter(note => note.notebookId === notebookId).length;
        const message = noteCount > 0
            ? `Delete “${notebook.name}”? Its ${noteCount} note(s) will move to “${fallbackNotebook.name}”.`
            : `Delete “${notebook.name}”?`;
        if (!window.confirm(message)) return;

        const previousNotebooks = state.notebooks;
        const previousNotes = state.notes;
        const previousActiveNotebookId = state.activeNotebookId;
        state.notebooks = state.notebooks.filter(item => item.id !== notebookId);
        state.notes = state.notes.map(note => {
            if (note.notebookId !== notebookId) return note;
            return {
                ...note,
                notebookId: fallbackNotebook.id,
                updatedAt: new Date().toISOString()
            };
        });
        if (state.activeNotebookId === notebookId) {
            state.activeNotebookId = 'all';
        }

        try {
            await storage.saveData(state.notes, state.notebooks);
            refreshNotebookUi();
            showStatus(noteCount > 0 ? 'Notebook deleted and notes moved.' : 'Notebook deleted.');
        } catch (error) {
            state.notebooks = previousNotebooks;
            state.notes = previousNotes;
            state.activeNotebookId = previousActiveNotebookId;
            refreshNotebookUi();
            showStatus('Could not delete the notebook.', true);
        }
    }

    async function persistNotes(message) {
        renderWorkspace();
        try {
            await storage.saveNotes(state.notes);
            showStatus(message);
        } catch (error) {
            showStatus('Could not save notes on this device.', true);
        }
    }

    // ----- Quick-note modal -----

    function createQuickModal() {
        if (quickModal?.isConnected) return;

        quickModal = document.createElement('div');
        quickModal.id = 'bb-study-note-quick-modal';
        quickModal.hidden = true;
        quickModal.innerHTML = `
            <div class="bb-study-note-modal-backdrop" data-quick-action="close"></div>
            <section class="bb-study-note-quick-dialog" role="dialog" aria-modal="true" aria-labelledby="bb-study-note-quick-title">
                <form id="bb-study-note-quick-form">
                    <div class="bb-study-note-quick-heading">
                        <div>
                            <span class="bb-study-note-eyebrow">Capture without leaving this page</span>
                            <h2 id="bb-study-note-quick-title">Quick Study Note</h2>
                        </div>
                        <button type="button" data-quick-action="close" aria-label="Close quick note">×</button>
                    </div>
                    <label>
                        <span>Title</span>
                        <input id="bb-study-note-quick-note-title" type="text" maxlength="200" placeholder="What are you studying?" required>
                    </label>
                    <label>
                        <span>Notebook</span>
                        <select id="bb-study-note-quick-notebook"></select>
                    </label>
                    <label>
                        <span>Note</span>
                        <textarea id="bb-study-note-quick-content" maxlength="50000" rows="9" placeholder="Write your note in Markdown…"></textarea>
                    </label>
                    <div class="bb-study-note-quick-actions">
                        <span>Your note stays on this device.</span>
                        <button type="button" data-quick-action="close">Cancel</button>
                        <button type="submit" class="bb-study-note-primary">Save note</button>
                    </div>
                </form>
            </section>
        `;

        document.body.appendChild(quickModal);
        quickModal.addEventListener('click', event => {
            if (event.target.closest('[data-quick-action="close"]')) closeQuickNote();
        });
        quickModal.querySelector('#bb-study-note-quick-form').addEventListener('submit', saveQuickNote);
    }

    function openQuickNote() {
        if (!state.settingsLoaded || !state.enabled) return;

        createQuickModal();
        state.lastQuickFocusedElement = document.activeElement;
        const form = quickModal.querySelector('#bb-study-note-quick-form');
        form.reset();
        fillNotebookSelect(
            quickModal.querySelector('#bb-study-note-quick-notebook'),
            getDefaultNotebookId()
        );
        quickModal.hidden = false;
        document.body.classList.add('bb-study-note-modal-open');
        quickModal.querySelector('#bb-study-note-quick-note-title').focus();
    }

    function closeQuickNote() {
        if (!quickModal || quickModal.hidden) return;

        quickModal.hidden = true;
        document.body.classList.remove('bb-study-note-modal-open');
        if (state.lastQuickFocusedElement?.isConnected) {
            state.lastQuickFocusedElement.focus();
        }
    }

    async function saveQuickNote(event) {
        event.preventDefault();
        const title = quickModal.querySelector('#bb-study-note-quick-note-title').value.trim();
        const content = quickModal.querySelector('#bb-study-note-quick-content').value;
        const notebookId = quickModal.querySelector('#bb-study-note-quick-notebook').value;
        const now = new Date().toISOString();
        if (!title) return;

        const note = {
            id: storage.createId('note'),
            title,
            content,
            notebookId,
            createdAt: now,
            updatedAt: now
        };
        state.notes = [note, ...state.notes];

        try {
            await storage.saveNotes(state.notes);
            closeQuickNote();
            if (workspace?.isConnected) {
                renderNotebooks();
                renderNoteList();
                if (!state.editorDirty) renderEditor();
            }
            if (state.isOpen) showStatus('Quick note saved.');
        } catch (error) {
            const saveButton = quickModal.querySelector('[type="submit"]');
            saveButton.textContent = 'Could not save';
            setTimeout(() => { saveButton.textContent = 'Save note'; }, 2000);
        }
    }

    // ----- Workspace lifecycle and responsive positioning -----

    async function openWorkspace() {
        if (!state.enabled) return;

        createWorkspace();
        if (state.isOpen) {
            workspace.querySelector('#bb-study-note-search')?.focus();
            return;
        }

        state.lastWorkspaceFocusedElement = document.activeElement;
        state.isOpen = true;
        workspace.hidden = false;
        document.body.classList.add('bb-study-note-open');
        navButton?.setAttribute('aria-current', 'page');
        updateWorkspaceOffset();
        renderWorkspace();
        workspace.querySelector('#bb-study-note-search')?.focus();
    }

    function requestCloseWorkspace() {
        if (!state.isOpen) return true;
        if (!confirmDiscardChanges()) return false;

        closeWorkspace();
        return true;
    }

    function closeWorkspace() {
        if (!workspace) return;

        workspace.hidden = true;
        state.isOpen = false;
        resetNoteSelection();
        closeNotebookDialog();
        document.body.classList.remove('bb-study-note-open');
        navButton?.removeAttribute('aria-current');
        if (state.lastWorkspaceFocusedElement?.isConnected) {
            state.lastWorkspaceFocusedElement.focus();
        }
    }

    function updateWorkspaceOffset() {
        if (!workspace?.isConnected || workspace.hidden) return;

        const globalNavigation = getGlobalNavigationContainer();
        const courseNavigation = document.querySelector('.bb-vertical-nav-container');
        let leftOffset = 0;

        [globalNavigation, courseNavigation].forEach(element => {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.right > 0) {
                leftOffset = Math.max(leftOffset, Math.round(rect.right));
            }
        });

        workspace.style.setProperty('--bb-study-note-left-offset', `${leftOffset}px`);
    }

    // ----- Import, export, storage synchronization, and initialization -----

    function exportJson() {
        transfer.downloadJson(state.notes, state.notebooks);
        showStatus('JSON backup exported.');
    }

    function exportCsv() {
        transfer.downloadCsv(state.notes, state.notebooks);
        showStatus('CSV exported.');
    }

    async function handleImportSelection(event) {
        const input = event.currentTarget;
        const file = input.files?.[0];
        if (!file) return;

        try {
            const importedData = await transfer.readBackupFile(file);
            const appendedData = transfer.appendImportedData(
                state.notes,
                state.notebooks,
                importedData
            );
            const unsavedWarning = state.editorDirty || state.notebookDialogDirty
                ? ' Unsaved edits in the open editor will be discarded.'
                : '';
            const confirmed = window.confirm(
                `Append ${appendedData.addedNotes} note(s) and ${appendedData.addedNotebooks} new notebook(s)? Your existing Study Note data will be kept.${unsavedWarning}`
            );
            if (!confirmed) return;

            await storage.saveData(appendedData.notes, appendedData.notebooks);
            state.notes = appendedData.notes;
            state.notebooks = appendedData.notebooks;
            state.activeNotebookId = 'all';
            state.editorDirty = false;
            state.notebookDialogDirty = false;
            closeNotebookDialog();
            resetNoteSelection();
            renderWorkspace();
            showStatus(`Added ${appendedData.addedNotes} note(s). Existing notes were kept.`);
        } catch (error) {
            showStatus(error.message, true);
        } finally {
            input.value = '';
        }
    }

    function showStatus(message, isError = false) {
        if (!workspace) return;

        const status = workspace.querySelector('#bb-study-note-status');
        clearTimeout(statusTimeout);
        status.textContent = message;
        status.classList.toggle('is-error', isError);
        status.classList.add('is-visible');
        statusTimeout = setTimeout(() => status.classList.remove('is-visible'), 3000);
    }

    function removeFeatureUi() {
        state.editorDirty = false;
        state.notebookDialogDirty = false;
        closeQuickNote();
        closeWorkspace();
        navButton?.remove();
        workspace?.remove();
        quickModal?.remove();
        navButton = null;
        workspace = null;
        quickModal = null;
    }

    function handleStorageChange(changes, areaName) {
        if (areaName !== 'local') return;

        if (changes[storage.ENABLED_KEY]) {
            state.enabled = changes[storage.ENABLED_KEY].newValue !== false;
            if (state.enabled) {
                ensureNavigationButton();
            } else {
                removeFeatureUi();
            }
        }

        if (changes[storage.NOTES_KEY] && Array.isArray(changes[storage.NOTES_KEY].newValue)) {
            state.notes = changes[storage.NOTES_KEY].newValue;
            if (workspace?.isConnected) {
                renderNotebooks();
                renderNoteList();
                if (!state.editorDirty) renderEditor();
            }
        }
        if (changes[storage.NOTEBOOKS_KEY] && Array.isArray(changes[storage.NOTEBOOKS_KEY].newValue)) {
            state.notebooks = changes[storage.NOTEBOOKS_KEY].newValue;
            if (workspace?.isConnected) refreshNotebookUi();
        }
    }

    function handleEscape(event) {
        if (event.key !== 'Escape') return;

        if (quickModal && !quickModal.hidden) {
            closeQuickNote();
            return;
        }
        if (state.isOpen) requestCloseWorkspace();
    }

    async function initialize() {
        if (initialized) return;
        initialized = true;

        chrome.storage.onChanged.addListener(handleStorageChange);
        window.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', BBLayout.debounce(updateWorkspaceOffset, 100), { passive: true });

        try {
            const data = await storage.loadData();
            state.notes = data.notes;
            state.notebooks = data.notebooks;
            state.enabled = data.enabled;
        } catch (error) {
            console.error('BB Better Layout: Study Note could not initialize.', error);
            state.notes = [];
            state.notebooks = [{
                id: 'quick-notes',
                name: 'Quick Notes',
                createdAt: new Date().toISOString()
            }];
            state.enabled = true;
        }

        state.settingsLoaded = true;
        run();
    }

    function run() {
        if (!state.settingsLoaded) return;

        if (!state.enabled) {
            removeFeatureUi();
            return;
        }

        ensureNavigationButton();
        if (state.isOpen) updateWorkspaceOffset();
    }

    BBLayout.studyNote = {
        initialize,
        run,
        open: openWorkspace,
        close: requestCloseWorkspace,
        openQuickNote
    };
})();
