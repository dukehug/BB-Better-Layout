// Study Note - local JSON backup and CSV export.
// Import and export use browser files only; no network request is made.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const MAX_IMPORT_ITEMS = 3000;

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = objectUrl;
        link.download = filename;
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }

    function getExportDate() {
        return new Date().toISOString().slice(0, 10);
    }

    function downloadJson(notes, notebooks) {
        const backup = {
            schemaVersion: 1,
            exportedAt: new Date().toISOString(),
            notebooks,
            notes
        };

        downloadFile(
            `bb-study-notes-${getExportDate()}.json`,
            JSON.stringify(backup, null, 2),
            'application/json'
        );
    }

    function escapeCsvValue(value) {
        const text = String(value ?? '');
        return `"${text.replaceAll('"', '""')}"`;
    }

    function downloadCsv(notes, notebooks) {
        const notebookNames = new Map(notebooks.map(notebook => [notebook.id, notebook.name]));
        const headings = ['Title', 'Notebook', 'Content', 'Created', 'Modified'];
        const rows = notes.map(note => [
            note.title,
            notebookNames.get(note.notebookId) || '',
            note.content,
            note.createdAt,
            note.updatedAt
        ]);
        const csv = [headings, ...rows]
            .map(row => row.map(escapeCsvValue).join(','))
            .join('\r\n');

        downloadFile(
            `bb-study-notes-${getExportDate()}.csv`,
            `\uFEFF${csv}`,
            'text/csv;charset=utf-8'
        );
    }

    // Imported files are untrusted input. Normalize lengths and regenerate missing
    // or duplicate IDs before any data reaches chrome.storage.local.
    function normalizeNotebook(notebook, usedIds) {
        if (!notebook || typeof notebook !== 'object') return null;

        const name = typeof notebook.name === 'string' ? notebook.name.trim().slice(0, 80) : '';
        if (!name) return null;

        let id = typeof notebook.id === 'string' ? notebook.id : '';
        if (!id || usedIds.has(id)) {
            id = BBLayout.studyNoteStorage.createId('notebook');
        }
        usedIds.add(id);

        return {
            id,
            name,
            createdAt: typeof notebook.createdAt === 'string'
                ? notebook.createdAt
                : new Date().toISOString()
        };
    }

    function normalizeNote(note, notebookIds, fallbackNotebookId, usedIds) {
        if (!note || typeof note !== 'object') return null;

        const title = typeof note.title === 'string' ? note.title.trim().slice(0, 200) : '';
        const content = typeof note.content === 'string' ? note.content.slice(0, 50000) : '';
        if (!title && !content.trim()) return null;

        let id = typeof note.id === 'string' ? note.id : '';
        if (!id || usedIds.has(id)) {
            id = BBLayout.studyNoteStorage.createId('note');
        }
        usedIds.add(id);

        return {
            id,
            title: title || 'Untitled note',
            content,
            notebookId: notebookIds.has(note.notebookId) ? note.notebookId : fallbackNotebookId,
            createdAt: typeof note.createdAt === 'string' ? note.createdAt : new Date().toISOString(),
            updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : new Date().toISOString()
        };
    }

    async function readJsonFile(file) {
        if (!file || file.size > 10 * 1024 * 1024) {
            throw new Error('Choose a JSON backup smaller than 10 MB.');
        }

        let parsed;
        try {
            parsed = JSON.parse(await file.text());
        } catch (error) {
            throw new Error('This file is not valid JSON.');
        }

        if (!Array.isArray(parsed?.notes) || !Array.isArray(parsed?.notebooks)) {
            throw new Error('This file is not a Study Note backup.');
        }
        if (parsed.notes.length > MAX_IMPORT_ITEMS || parsed.notebooks.length > 200) {
            throw new Error('This backup contains too many notes or notebooks.');
        }

        const usedNotebookIds = new Set();
        const notebooks = parsed.notebooks
            .map(notebook => normalizeNotebook(notebook, usedNotebookIds))
            .filter(Boolean);

        if (notebooks.length === 0) {
            notebooks.push({
                id: 'quick-notes',
                name: 'Quick Notes',
                createdAt: new Date().toISOString()
            });
            usedNotebookIds.add('quick-notes');
        }

        const usedNoteIds = new Set();
        const notes = parsed.notes
            .map(note => normalizeNote(note, usedNotebookIds, notebooks[0].id, usedNoteIds))
            .filter(Boolean);

        return { notes, notebooks };
    }

    BBLayout.studyNoteTransfer = {
        downloadJson,
        downloadCsv,
        readJsonFile
    };
})();
