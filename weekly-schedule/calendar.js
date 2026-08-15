// Weekly Schedule - local-calendar calculations kept separate for rollover testing.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};

    function normalizeDate(value = new Date()) {
        const date = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(date.getTime())) return new Date();
        return date;
    }

    function getDayIndex(value = new Date()) {
        return (normalizeDate(value).getDay() + 6) % 7;
    }

    function getMonday(value = new Date()) {
        const monday = normalizeDate(value);
        const offset = getDayIndex(monday);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(monday.getDate() - offset);
        return monday;
    }

    function getWeekDates(value = new Date()) {
        const monday = getMonday(value);
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            return date;
        });
    }

    function getDayKey(value = new Date()) {
        const date = normalizeDate(value);
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    BBLayout.weeklyScheduleCalendar = {
        getDayIndex,
        getMonday,
        getWeekDates,
        getDayKey
    };
})();
