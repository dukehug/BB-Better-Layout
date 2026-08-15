// Weekly Schedule - Blackboard Courses page extraction and title parsing.
// This module is deliberately passive; app.js calls it only after an Import click.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const DAY_INDEX = {
        M: 0,
        T: 1,
        W: 2,
        TH: 3,
        F: 4,
        S: 5,
        SU: 6
    };
    const EVENT_COLORS = [
        'green', 'blue', 'yellow', 'purple', 'red',
        'indigo', 'teal', 'orange', 'pink', 'slate'
    ];

    function compactText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function titleCaseName(value) {
        return value
            .toLocaleLowerCase()
            .replace(/(^|[-'’])\p{L}/gu, match => match.toLocaleUpperCase());
    }

    function firstNameOnly(fullName) {
        let value = compactText(fullName);
        if (!value) return '';
        if (/^multiple instructors$/i.test(value)) return 'Multiple Instructors';

        // Blackboard commonly renders names as either "FIRST LAST" or
        // "LAST, FIRST". Honorifics are not useful in the compact card field.
        if (value.includes(',')) value = value.split(',').slice(1).join(',').trim();
        value = value.replace(/^(?:dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '');
        const firstToken = value.split(/\s+/)[0].replace(/^[^\p{L}]+|[^\p{L}'’.-]+$/gu, '');
        return titleCaseName(firstToken);
    }

    function parseClockToken(token) {
        const digits = String(token || '').replace(/\D/g, '');
        if (digits.length < 3 || digits.length > 4) return '';

        const padded = digits.padStart(4, '0');
        const hour = Number(padded.slice(0, 2));
        const minute = Number(padded.slice(2));
        if (hour > 23 || minute > 59) return '';
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    function parseDayCodes(rawValue) {
        const value = String(rawValue || '').toUpperCase().replace(/[^A-Z]/g, '');
        const longNames = [
            ['MONDAY', 0], ['MON', 0],
            ['TUESDAY', 1], ['TUES', 1], ['TUE', 1],
            ['WEDNESDAY', 2], ['WED', 2],
            ['THURSDAY', 3], ['THURS', 3], ['THU', 3],
            ['FRIDAY', 4], ['FRI', 4],
            ['SATURDAY', 5], ['SAT', 5],
            ['SUNDAY', 6], ['SUN', 6]
        ];
        let remaining = value;
        const days = [];

        // Handle complete weekday names before compact formats such as MWF/TTH.
        for (const [name, index] of longNames) {
            if (remaining.includes(name)) {
                days.push(index);
                remaining = remaining.replaceAll(name, '');
            }
        }

        for (let index = 0; index < remaining.length;) {
            const twoCharacterCode = remaining.slice(index, index + 2);
            if (Object.prototype.hasOwnProperty.call(DAY_INDEX, twoCharacterCode)) {
                days.push(DAY_INDEX[twoCharacterCode]);
                index += 2;
                continue;
            }

            const oneCharacterCode = remaining[index];
            if (Object.prototype.hasOwnProperty.call(DAY_INDEX, oneCharacterCode)) {
                days.push(DAY_INDEX[oneCharacterCode]);
            }
            index += 1;
        }

        return [...new Set(days)].sort((left, right) => left - right);
    }

    function parseCourseTitle(rawTitle) {
        const title = compactText(rawTitle);
        const scheduleMatch = title.match(
            /\s+(\d{3,4})\s*[-–—]\s*(\d{3,4})\s+([A-Za-z ,/&-]+)$/
        );
        if (!scheduleMatch) {
            return { subject: title, days: [], start: '', end: '' };
        }

        const start = parseClockToken(scheduleMatch[1]);
        const end = parseClockToken(scheduleMatch[2]);
        const days = parseDayCodes(scheduleMatch[3]);
        if (!start || !end || end <= start || days.length === 0) {
            return { subject: title, days: [], start: '', end: '' };
        }

        return {
            subject: title.slice(0, scheduleMatch.index).trim().replace(/\s+[-–—]$/, ''),
            days,
            start,
            end
        };
    }

    function getCourseCode(fullCourseCode) {
        const parts = compactText(fullCourseCode).split('-').filter(Boolean);
        return parts.at(-1) || '';
    }

    function extractCourses(rootDocument) {
        const cards = Array.from(
            rootDocument.querySelectorAll('article.course-element-card')
        );

        return cards.flatMap(card => {
            const title = compactText(
                card.querySelector('.js-course-title-element')?.textContent
            );
            if (!title) return [];

            const fullCourseCode = compactText(
                card.querySelector('.multi-column-course-id')?.textContent
            );
            const multipleInstructors = card.querySelector(
                '.instructors [aria-label^="Multiple Instructors for "]'
            );
            // Blackboard uses a dedicated multi-user button rather than a bdi
            // name node when more than one instructor belongs to a course.
            const teacherFullName = multipleInstructors
                ? 'Multiple Instructors'
                : compactText(
                    card.querySelector(
                        '.instructors bdi, .instructors .bb-ui-username'
                    )?.textContent
                );
            const parsedTitle = parseCourseTitle(title);

            return [{
                id: compactText(card.dataset.courseId),
                fullCourseCode,
                courseCode: getCourseCode(fullCourseCode),
                title,
                subject: parsedTitle.subject,
                teacher: firstNameOnly(teacherFullName),
                teacherFullName,
                days: parsedTitle.days,
                start: parsedTitle.start,
                end: parsedTitle.end
            }];
        });
    }

    function coursesToEvents(courses) {
        return courses.flatMap((course, index) => {
            if (!course.days.length || !course.start || !course.end) return [];

            const stableId = course.id || `${course.courseCode}-${index}`;
            return [{
                id: `blackboard-${stableId}`,
                courseId: course.id,
                courseCode: course.courseCode,
                subject: course.subject,
                teacher: course.teacher,
                days: course.days,
                start: course.start,
                end: course.end,
                room: '',
                color: EVENT_COLORS[index % EVENT_COLORS.length],
                source: 'blackboard'
            }];
        });
    }

    BBLayout.weeklyScheduleImport = {
        firstNameOnly,
        parseClockToken,
        parseDayCodes,
        parseCourseTitle,
        extractCourses,
        coursesToEvents
    };
})();
