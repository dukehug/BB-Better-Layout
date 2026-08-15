// Study Note - local JSON/CSV backup import and export.
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

    function normalizeDate(value) {
        if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) return value;
        return new Date().toISOString();
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
            createdAt: normalizeDate(note.createdAt),
            updatedAt: normalizeDate(note.updatedAt)
        };
    }

    async function readJsonFile(file) {
        if (!file || file.size > 10 * 1024 * 1024) {
            throw new Error('Choose a JSON backup smaller than 10 MB.');
        }

        let parsed;
        try {
            parsed = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
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

    // Parse quoted CSV fields without splitting Markdown content that contains
    // commas, line breaks, or escaped double quotes.
    function parseCsv(source) {
        const text = String(source || '').replace(/^\uFEFF/, '');
        const rows = [];
        let row = [];
        let field = '';
        let quoted = false;

        for (let index = 0; index < text.length; index += 1) {
            const character = text[index];
            if (quoted) {
                if (character === '"' && text[index + 1] === '"') {
                    field += '"';
                    index += 1;
                } else if (character === '"') {
                    quoted = false;
                } else if (character === '\r' && text[index + 1] === '\n') {
                    field += '\n';
                    index += 1;
                } else {
                    field += character;
                }
                continue;
            }

            if (character === '"' && field.length === 0) {
                quoted = true;
            } else if (character === ',') {
                row.push(field);
                field = '';
            } else if (character === '\n' || character === '\r') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
                if (character === '\r' && text[index + 1] === '\n') index += 1;
            } else {
                field += character;
            }
        }

        if (quoted) throw new Error('This CSV file contains an unfinished quoted field.');
        if (field.length > 0 || row.length > 0) {
            row.push(field);
            rows.push(row);
        }
        return rows;
    }

    async function readCsvFile(file) {
        if (!file || file.size > 10 * 1024 * 1024) {
            throw new Error('Choose a CSV backup smaller than 10 MB.');
        }

        let rows;
        try {
            rows = parseCsv(await file.text());
        } catch (error) {
            throw new Error(error.message || 'This file is not valid CSV.');
        }
        if (rows.length === 0) throw new Error('This CSV backup is empty.');
        if (rows.length - 1 > MAX_IMPORT_ITEMS) {
            throw new Error('This backup contains too many notes.');
        }

        const headingIndexes = new Map(
            rows[0].map((heading, index) => [String(heading).trim().toLowerCase(), index])
        );
        if (!headingIndexes.has('title') || !headingIndexes.has('content')) {
            throw new Error('This file is not a Study Note CSV backup.');
        }

        const notebooks = [];
        const notebooksByName = new Map();
        const notebookIds = new Set();
        const usedNoteIds = new Set();
        const notes = [];
        const getCell = (rowData, heading) => {
            const index = headingIndexes.get(heading);
            return index === undefined ? '' : String(rowData[index] ?? '');
        };
        const getNotebook = rawName => {
            const name = rawName.trim().slice(0, 80) || 'Quick Notes';
            const key = name.toLocaleLowerCase();
            if (notebooksByName.has(key)) return notebooksByName.get(key);
            if (notebooks.length >= 200) {
                throw new Error('This backup contains too many notebooks.');
            }

            const notebook = {
                id: BBLayout.studyNoteStorage.createId('notebook'),
                name,
                createdAt: new Date().toISOString()
            };
            notebooks.push(notebook);
            notebooksByName.set(key, notebook);
            notebookIds.add(notebook.id);
            return notebook;
        };

        rows.slice(1).forEach(rowData => {
            if (rowData.every(value => !String(value).trim())) return;

            const notebook = getNotebook(getCell(rowData, 'notebook'));
            const note = normalizeNote({
                title: getCell(rowData, 'title'),
                content: getCell(rowData, 'content'),
                notebookId: notebook.id,
                createdAt: getCell(rowData, 'created'),
                updatedAt: getCell(rowData, 'modified')
            }, notebookIds, notebook.id, usedNoteIds);
            if (note) notes.push(note);
        });

        if (notebooks.length === 0) getNotebook('Quick Notes');
        return { notes, notebooks };
    }

    async function readBackupFile(file) {
        const name = String(file?.name || '').toLowerCase();
        const type = String(file?.type || '').toLowerCase();
        if (name.endsWith('.csv') || type.includes('csv')) return readCsvFile(file);
        if (name.endsWith('.json') || type.includes('json')) return readJsonFile(file);
        throw new Error('Choose a Study Note JSON or CSV backup.');
    }

    function createUniqueId(prefix, usedIds) {
        let id;
        do {
            id = BBLayout.studyNoteStorage.createId(prefix);
        } while (usedIds.has(id));
        usedIds.add(id);
        return id;
    }

    // Imported data is appended to current data. Matching notebook names are
    // reused, while colliding IDs receive a new ID so nothing is overwritten.
    function appendImportedData(currentNotes, currentNotebooks, importedData) {
        const notes = Array.isArray(currentNotes) ? [...currentNotes] : [];
        const notebooks = Array.isArray(currentNotebooks) ? [...currentNotebooks] : [];
        const usedNoteIds = new Set(notes.map(note => note.id));
        const usedNotebookIds = new Set(notebooks.map(notebook => notebook.id));
        const notebooksByName = new Map();
        const importedNotebookIds = new Map();
        let addedNotebooks = 0;

        notebooks.forEach(notebook => {
            const key = String(notebook.name || '').trim().toLocaleLowerCase();
            if (key && !notebooksByName.has(key)) notebooksByName.set(key, notebook);
        });

        importedData.notebooks.forEach(importedNotebook => {
            const key = importedNotebook.name.trim().toLocaleLowerCase();
            let targetNotebook = notebooksByName.get(key);
            if (!targetNotebook) {
                let id = importedNotebook.id;
                if (!id || usedNotebookIds.has(id)) {
                    id = createUniqueId('notebook', usedNotebookIds);
                } else {
                    usedNotebookIds.add(id);
                }
                targetNotebook = { ...importedNotebook, id };
                notebooks.push(targetNotebook);
                notebooksByName.set(key, targetNotebook);
                addedNotebooks += 1;
            }
            importedNotebookIds.set(importedNotebook.id, targetNotebook.id);
        });

        if (notebooks.length === 0) {
            const notebook = {
                id: createUniqueId('notebook', usedNotebookIds),
                name: 'Quick Notes',
                createdAt: new Date().toISOString()
            };
            notebooks.push(notebook);
            addedNotebooks += 1;
        }

        const fallbackNotebookId = notebooks[0].id;
        importedData.notes.forEach(importedNote => {
            let id = importedNote.id;
            if (!id || usedNoteIds.has(id)) {
                id = createUniqueId('note', usedNoteIds);
            } else {
                usedNoteIds.add(id);
            }
            notes.push({
                ...importedNote,
                id,
                notebookId: importedNotebookIds.get(importedNote.notebookId)
                    || fallbackNotebookId
            });
        });

        return {
            notes,
            notebooks,
            addedNotes: importedData.notes.length,
            addedNotebooks
        };
    }

    BBLayout.studyNoteTransfer = {
        downloadJson,
        downloadCsv,
        readJsonFile,
        readCsvFile,
        readBackupFile,
        appendImportedData
    };
})();
