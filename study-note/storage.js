// Study Note - device-local persistence and one-time Todo data migration.
// Notes never leave chrome.storage.local.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const NOTES_KEY = 'bbStudyNotes';
    const NOTEBOOKS_KEY = 'bbStudyNoteNotebooks';
    const ENABLED_KEY = 'bbStudyNoteEnabled';
    const LEGACY_TASKS_KEY = 'bbTodoItems';
    const LEGACY_ENABLED_KEY = 'bbTodoEnabled';

    function getLocalStorage(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, data => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                resolve(data);
            });
        });
    }

    function setLocalStorage(values) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(values, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                resolve();
            });
        });
    }

    function removeLocalStorage(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(keys, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                resolve();
            });
        });
    }

    function createId(prefix) {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function createDefaultNotebooks() {
        const createdAt = new Date().toISOString();
        return [
            { id: 'quick-notes', name: 'Quick Notes', createdAt },
            { id: 'study', name: 'Study', createdAt }
        ];
    }

    function migrateLegacyTasks(tasks, notebookId) {
        return tasks.map(task => {
            const details = [];
            if (task.notes) details.push(task.notes);
            if (task.dueDate) details.push(`Original due date: ${task.dueDate}`);

            return {
                id: createId('note'),
                title: String(task.title || 'Imported note').slice(0, 200),
                content: details.join('\n\n'),
                notebookId,
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: task.updatedAt || new Date().toISOString()
            };
        });
    }

    async function loadData() {
        const data = await getLocalStorage([
            NOTES_KEY,
            NOTEBOOKS_KEY,
            ENABLED_KEY,
            LEGACY_TASKS_KEY,
            LEGACY_ENABLED_KEY
        ]);

        const legacyKeysToRemove = [LEGACY_TASKS_KEY, LEGACY_ENABLED_KEY]
            .filter(key => Object.prototype.hasOwnProperty.call(data, key));

        let notebooks = Array.isArray(data[NOTEBOOKS_KEY])
            ? data[NOTEBOOKS_KEY]
            : createDefaultNotebooks();
        let notes = Array.isArray(data[NOTES_KEY]) ? data[NOTES_KEY] : null;
        const valuesToSave = {};

        if (!Array.isArray(data[NOTEBOOKS_KEY])) {
            valuesToSave[NOTEBOOKS_KEY] = notebooks;
        }

        // Import legacy Todo data only when Study Note has never created its own notes.
        // This prevents an old Todo copy from overwriting newer Study Note content.
        if (notes === null) {
            const legacyTasks = Array.isArray(data[LEGACY_TASKS_KEY]) ? data[LEGACY_TASKS_KEY] : [];
            if (legacyTasks.length > 0) {
                let importedNotebook = notebooks.find(notebook => notebook.id === 'imported-todo');
                if (!importedNotebook) {
                    importedNotebook = {
                        id: 'imported-todo',
                        name: 'Imported Todo',
                        createdAt: new Date().toISOString()
                    };
                    notebooks = [...notebooks, importedNotebook];
                }
                notes = migrateLegacyTasks(legacyTasks, importedNotebook.id);
                valuesToSave[NOTEBOOKS_KEY] = notebooks;
            } else {
                notes = [];
            }
            valuesToSave[NOTES_KEY] = notes;
        }

        const enabled = typeof data[ENABLED_KEY] === 'boolean'
            ? data[ENABLED_KEY]
            : data[LEGACY_ENABLED_KEY] !== false;
        if (typeof data[ENABLED_KEY] !== 'boolean') {
            valuesToSave[ENABLED_KEY] = enabled;
        }

        if (Object.keys(valuesToSave).length > 0) {
            await setLocalStorage(valuesToSave);
        }

        // Delete legacy keys only after all replacement data is safely stored. If the
        // write above fails, this line is never reached and the Todo data remains intact.
        if (legacyKeysToRemove.length > 0) {
            try {
                await removeLocalStorage(legacyKeysToRemove);
            } catch (error) {
                // Cleanup failure should not disable Study Note. Keeping the keys lets
                // the next initialization retry without duplicating imported notes.
                console.warn('BB Better Layout: legacy Todo storage cleanup will be retried.', error);
            }
        }

        return { notes, notebooks, enabled };
    }

    function saveNotes(notes) {
        return setLocalStorage({ [NOTES_KEY]: notes });
    }

    function saveNotebooks(notebooks) {
        return setLocalStorage({ [NOTEBOOKS_KEY]: notebooks });
    }

    function saveData(notes, notebooks) {
        return setLocalStorage({
            [NOTES_KEY]: notes,
            [NOTEBOOKS_KEY]: notebooks
        });
    }

    BBLayout.studyNoteStorage = {
        NOTES_KEY,
        NOTEBOOKS_KEY,
        ENABLED_KEY,
        createId,
        loadData,
        saveNotes,
        saveNotebooks,
        saveData
    };
})();
