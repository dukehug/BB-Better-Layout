// Weekly Schedule - device-local persistence and defensive data normalization.
// Schedule data never uses sync storage, so it remains in the current browser profile.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const ENABLED_KEY = 'bbWeeklyScheduleEnabled';
    const EVENTS_KEY = 'bbWeeklyScheduleEvents';
    const COURSES_KEY = 'bbWeeklyScheduleCourses';
    const LAST_IMPORTED_KEY = 'bbWeeklyScheduleLastImportedAt';
    const VALID_COLORS = new Set([
        'blue',
        'green',
        'purple',
        'yellow',
        'red',
        'indigo',
        'pink',
        'orange',
        'teal',
        'slate'
    ]);

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

    function createId(prefix = 'schedule') {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function cleanText(value, maxLength = 200) {
        return String(value || '').trim().slice(0, maxLength);
    }

    function normalizeDays(days) {
        if (!Array.isArray(days)) return [];

        return [...new Set(days
            .map(Number)
            .filter(day => Number.isInteger(day) && day >= 0 && day <= 6))]
            .sort((left, right) => left - right);
    }

    function normalizeTime(value, fallback) {
        const match = String(value || '').match(/^(\d{2}):(\d{2})$/);
        if (!match) return fallback;

        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (hour > 23 || minute > 59) return fallback;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    function normalizeEvent(event) {
        const start = normalizeTime(event?.start, '09:00');
        let end = normalizeTime(event?.end, '10:00');
        if (end <= start) end = '10:00' > start ? '10:00' : '23:59';

        return {
            id: cleanText(event?.id, 120) || createId('schedule'),
            courseId: cleanText(event?.courseId, 120),
            courseCode: cleanText(event?.courseCode, 80),
            subject: cleanText(event?.subject, 240) || 'Untitled course',
            teacher: cleanText(event?.teacher, 100),
            teacherOverride: cleanText(event?.teacherOverride, 100),
            teacherEdited: event?.teacherEdited === true,
            days: normalizeDays(event?.days),
            start,
            end,
            room: cleanText(event?.room, 100),
            color: VALID_COLORS.has(event?.color) ? event.color : 'blue',
            source: event?.source === 'blackboard' ? 'blackboard' : 'manual'
        };
    }

    function normalizeCourse(course) {
        return {
            id: cleanText(course?.id, 120),
            fullCourseCode: cleanText(course?.fullCourseCode, 160),
            courseCode: cleanText(course?.courseCode, 80),
            title: cleanText(course?.title, 300),
            subject: cleanText(course?.subject, 240),
            teacher: cleanText(course?.teacher, 100),
            teacherFullName: cleanText(course?.teacherFullName, 180),
            days: normalizeDays(course?.days),
            start: normalizeTime(course?.start, ''),
            end: normalizeTime(course?.end, '')
        };
    }

    function normalizeEvents(events) {
        return Array.isArray(events) ? events.map(normalizeEvent) : [];
    }

    function normalizeCourses(courses) {
        return Array.isArray(courses)
            ? courses.map(normalizeCourse).filter(course => course.title)
            : [];
    }

    async function loadData() {
        const data = await getLocalStorage([
            ENABLED_KEY,
            EVENTS_KEY,
            COURSES_KEY,
            LAST_IMPORTED_KEY
        ]);
        const enabled = typeof data[ENABLED_KEY] === 'boolean'
            ? data[ENABLED_KEY]
            : true;
        const events = normalizeEvents(data[EVENTS_KEY]);
        const courses = normalizeCourses(data[COURSES_KEY]);
        const lastImportedAt = cleanText(data[LAST_IMPORTED_KEY], 80);
        const defaults = {};

        if (typeof data[ENABLED_KEY] !== 'boolean') defaults[ENABLED_KEY] = enabled;
        if (!Array.isArray(data[EVENTS_KEY])) defaults[EVENTS_KEY] = events;
        if (!Array.isArray(data[COURSES_KEY])) defaults[COURSES_KEY] = courses;

        if (Object.keys(defaults).length > 0) {
            await setLocalStorage(defaults);
        }

        return { enabled, events, courses, lastImportedAt };
    }

    function saveEvents(events) {
        return setLocalStorage({ [EVENTS_KEY]: normalizeEvents(events) });
    }

    function saveData(events, courses, lastImportedAt = '') {
        return setLocalStorage({
            [EVENTS_KEY]: normalizeEvents(events),
            [COURSES_KEY]: normalizeCourses(courses),
            [LAST_IMPORTED_KEY]: cleanText(lastImportedAt, 80)
        });
    }

    BBLayout.weeklyScheduleStorage = {
        ENABLED_KEY,
        EVENTS_KEY,
        COURSES_KEY,
        LAST_IMPORTED_KEY,
        VALID_COLORS,
        createId,
        normalizeEvent,
        normalizeEvents,
        normalizeCourses,
        loadData,
        saveEvents,
        saveData
    };
})();
