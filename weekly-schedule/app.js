// Weekly Schedule - navigation entry, schedule workspace, editor, and explicit import flow.
// Blackboard course cards are read only inside handleImport(), never during initialization.

(() => {
    const BBLayout = window.BBLayout = window.BBLayout || {};
    const storage = BBLayout.weeklyScheduleStorage;
    const courseImport = BBLayout.weeklyScheduleImport;
    const calendar = BBLayout.weeklyScheduleCalendar;
    const DAY_NAMES = [
        'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    ];
    const SHORT_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const START_HOUR = 7;
    const END_HOUR = 22;
    const HOUR_HEIGHT = 72;
    const COLOR_NAMES = [
        'blue', 'green', 'purple', 'yellow', 'red',
        'indigo', 'pink', 'orange', 'teal', 'slate'
    ];

    const state = {
        settingsLoaded: false,
        enabled: false,
        isOpen: false,
        events: [],
        courses: [],
        lastImportedAt: '',
        lastFocusedElement: null
    };

    let initialized = false;
    let navButton = null;
    let workspace = null;
    let statusTimeout = null;
    let clockAlignmentTimeout = null;
    let clockInterval = null;
    let renderedDayKey = '';

    // ----- Main navigation integration -----

    function getGlobalNavigationContainer() {
        const globalList = document.getElementById('base_tools');
        if (!globalList) return null;
        return globalList.closest('nav') || globalList.parentElement;
    }

    function syncUtilitySpacing(container) {
        const utilityItems = container.querySelectorAll(
            '.bb-weekly-schedule-nav-button, .bb-study-note-nav-button, .bb-external-quick-link'
        );
        utilityItems.forEach((item, index) => {
            item.style.marginTop = index === 0 ? 'auto' : '';
        });
    }

    function bindNavigationButton(button) {
        if (button.dataset.bbWeeklyScheduleBound !== 'true') {
            button.addEventListener('click', openWorkspace);
            button.dataset.bbWeeklyScheduleBound = 'true';
        }

        button.toggleAttribute('aria-current', state.isOpen);
        if (state.isOpen) button.setAttribute('aria-current', 'page');
    }

    function createNavigationButton() {
        const button = document.createElement('button');
        const icon = document.createElement('span');

        button.type = 'button';
        button.className = 'bb-custom-bottom-link bb-weekly-schedule-nav-button';
        button.setAttribute('aria-label', 'Open Schedule');
        button.title = 'Schedule';
        icon.className = 'material-icons bb-nav-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = 'calendar_month';
        button.append(icon, document.createTextNode('Schedule'));
        bindNavigationButton(button);
        return button;
    }

    function ensureNavigationButton() {
        const container = getGlobalNavigationContainer();
        if (!container) return;

        bindGlobalNavigation(container);
        if (navButton?.isConnected) {
            syncUtilitySpacing(container);
            return;
        }

        const existingButton = container.querySelector('.bb-weekly-schedule-nav-button');
        if (existingButton) {
            navButton = existingButton;
            bindNavigationButton(navButton);
            syncUtilitySpacing(container);
            return;
        }

        navButton = createNavigationButton();
        const nextUtilityItem = container.querySelector(
            '.bb-study-note-nav-button, .bb-external-quick-link'
        );
        container.insertBefore(navButton, nextUtilityItem || null);
        syncUtilitySpacing(container);
    }

    function bindGlobalNavigation(container) {
        if (container.dataset.bbWeeklyScheduleNavigationBound === 'true') return;

        container.addEventListener('click', event => {
            if (!state.isOpen) return;
            const navigationItem = event.target.closest('a, button');
            if (!navigationItem || navigationItem === navButton) return;
            closeWorkspace();
        }, true);
        container.dataset.bbWeeklyScheduleNavigationBound = 'true';
    }

    // ----- Workspace creation -----

    function createWorkspace() {
        if (workspace?.isConnected) return;

        workspace = document.createElement('section');
        workspace.id = 'bb-weekly-schedule-workspace';
        workspace.hidden = true;
        workspace.setAttribute('aria-label', 'Weekly Schedule');
        workspace.innerHTML = `
            <header class="bb-weekly-schedule-header">
                <div class="bb-weekly-schedule-brand">
                    <span class="material-icons" aria-hidden="true">calendar_month</span>
                    <div>
                        <h1>My Weekly Schedule</h1>
                        <p>Plan your week at a glance. Imported data stays on this device. | To export your schedule as a phone wallpaper, visit <a href="https://weekly.52hz.im" target="_blank" rel="noopener">weekly.52hz.im.</a> </p>
                    </div>
                </div>
                <div class="bb-weekly-schedule-actions">
                    <button type="button" class="bb-weekly-schedule-primary" data-action="add">
                        <span class="material-icons" aria-hidden="true">add</span>Add New
                    </button>
                    <button type="button" data-action="import">
                        <span class="material-icons" aria-hidden="true">upload</span>Import
                    </button>
                    <button type="button" data-action="save">
                        <span class="material-icons" aria-hidden="true">save</span>Save
                    </button>
                    <button type="button" class="bb-weekly-schedule-empty-button" data-action="empty">
                        <span class="material-icons" aria-hidden="true">restart_alt</span>Empty
                    </button>
                    <button type="button" class="bb-weekly-schedule-close" data-action="close" aria-label="Close Weekly Schedule">×</button>
                </div>
            </header>
            <div class="bb-weekly-schedule-feedback">
                <p id="bb-weekly-schedule-status" role="status" aria-live="polite"></p>
                <span id="bb-weekly-schedule-imported"></span>
            </div>
            <div class="bb-weekly-schedule-scroll">
                <div class="bb-weekly-schedule-grid">
                    <div id="bb-weekly-schedule-days" class="bb-weekly-schedule-days"></div>
                    <div id="bb-weekly-schedule-body" class="bb-weekly-schedule-body"></div>
                </div>
            </div>
            <div id="bb-weekly-schedule-modal" class="bb-weekly-schedule-modal" hidden>
                <div class="bb-weekly-schedule-modal-backdrop" data-action="cancel-editor"></div>
                <section role="dialog" aria-modal="true" aria-labelledby="bb-weekly-schedule-dialog-title">
                    <form id="bb-weekly-schedule-form">
                        <div class="bb-weekly-schedule-dialog-heading">
                            <div>
                                <span class="bb-weekly-schedule-eyebrow">Schedule entry</span>
                                <h2 id="bb-weekly-schedule-dialog-title">Add course</h2>
                            </div>
                            <button type="button" data-action="cancel-editor" aria-label="Close course editor">×</button>
                        </div>
                        <input id="bb-weekly-schedule-event-id" type="hidden">
                        <label class="bb-weekly-schedule-wide-field">
                            <span>Course</span>
                            <input id="bb-weekly-schedule-course-source" type="text" list="bb-weekly-schedule-course-options" maxlength="320" autocomplete="off" placeholder="Choose an imported course or enter a course name">
                            <datalist id="bb-weekly-schedule-course-options"></datalist>
                            <small>Choose an imported course to fill the form, or type a course name manually.</small>
                        </label>
                        <div class="bb-weekly-schedule-form-grid">
                            <label>
                                <span>Course code</span>
                                <input id="bb-weekly-schedule-code" type="text" maxlength="80" placeholder="e.g. 29082">
                            </label>
                            <label>
                                <span>Teacher</span>
                                <input id="bb-weekly-schedule-teacher" type="text" list="bb-weekly-schedule-teacher-options" maxlength="100" autocomplete="off" placeholder="Choose or enter a teacher">
                                <datalist id="bb-weekly-schedule-teacher-options"></datalist>
                                <small>Choose an imported first name or enter a local override.</small>
                            </label>
                            <label class="bb-weekly-schedule-wide-field">
                                <span>Course name</span>
                                <input id="bb-weekly-schedule-subject" type="text" maxlength="240" required placeholder="Course name">
                            </label>
                            <label>
                                <span>Start</span>
                                <input id="bb-weekly-schedule-start" type="time" min="07:00" max="22:00" required>
                            </label>
                            <label>
                                <span>End</span>
                                <input id="bb-weekly-schedule-end" type="time" min="07:00" max="23:59" required>
                            </label>
                            <label class="bb-weekly-schedule-wide-field">
                                <span>Room</span>
                                <input id="bb-weekly-schedule-room" type="text" maxlength="100" placeholder="Optional room or online location">
                            </label>
                        </div>
                        <fieldset class="bb-weekly-schedule-day-picker">
                            <legend>Day</legend>
                            <div>
                                ${SHORT_DAY_NAMES.map((day, index) => `
                                    <label>
                                        <input type="checkbox" name="schedule-day" value="${index}">
                                        <span>${day}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </fieldset>
                        <fieldset class="bb-weekly-schedule-color-picker">
                            <legend>Color</legend>
                            <div>
                                ${COLOR_NAMES.map(color => `
                                    <label title="${color}">
                                        <input type="radio" name="schedule-color" value="${color}">
                                        <span class="is-${color}" aria-label="${color}"></span>
                                    </label>
                                `).join('')}
                            </div>
                        </fieldset>
                        <p id="bb-weekly-schedule-form-error" class="bb-weekly-schedule-form-error" role="alert"></p>
                        <div class="bb-weekly-schedule-dialog-actions">
                            <button id="bb-weekly-schedule-delete" type="button" class="bb-weekly-schedule-danger" data-action="delete-event" hidden>Delete</button>
                            <span></span>
                            <button type="button" data-action="cancel-editor">Cancel</button>
                            <button type="submit" class="bb-weekly-schedule-primary">Save course</button>
                        </div>
                    </form>
                </section>
            </div>
        `;

        document.body.appendChild(workspace);
        workspace.addEventListener('click', handleWorkspaceClick);
        workspace.querySelector('#bb-weekly-schedule-form')
            .addEventListener('submit', saveEditorEvent);
        workspace.querySelector('#bb-weekly-schedule-course-source')
            .addEventListener('input', handleCourseSourceInput);
        updateWorkspaceOffset();
    }

    // ----- Calendar rendering -----

    function formatHour(hour) {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        return `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`;
    }

    function formatTime(time) {
        const [hourValue, minuteValue] = String(time).split(':').map(Number);
        if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return '';
        const suffix = hourValue >= 12 ? 'PM' : 'AM';
        const hour = hourValue % 12 || 12;
        return `${hour}:${String(minuteValue).padStart(2, '0')} ${suffix}`;
    }

    function timeToMinutes(time) {
        const [hour, minute] = String(time).split(':').map(Number);
        return Number.isFinite(hour) && Number.isFinite(minute)
            ? (hour * 60) + minute
            : 0;
    }

    function createMetaLine(iconName, value, type) {
        const line = document.createElement('span');
        const icon = document.createElement('span');
        line.className = `is-${type}`;
        icon.className = 'material-icons';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = iconName;
        line.append(icon, document.createTextNode(value));
        return line;
    }

    function createEventCard(event, dayIndex) {
        const startMinutes = timeToMinutes(event.start);
        const endMinutes = timeToMinutes(event.end);
        const visibleStart = Math.max(startMinutes, START_HOUR * 60);
        const visibleEnd = Math.min(endMinutes, END_HOUR * 60);
        if (visibleEnd <= visibleStart) return null;

        const card = document.createElement('button');
        const heading = document.createElement('strong');
        const subject = document.createElement('span');
        const meta = document.createElement('span');
        const top = ((visibleStart - (START_HOUR * 60)) / 60) * HOUR_HEIGHT;
        const height = Math.max(38, ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT - 3);

        card.type = 'button';
        card.className = `bb-weekly-schedule-event is-${event.color}`;
        card.dataset.eventId = event.id;
        card.dataset.dayIndex = String(dayIndex);
        card.style.top = `${top}px`;
        card.style.height = `${height}px`;
        card.classList.toggle('is-compact', height < 100);
        card.classList.toggle('is-tight', height < 58);
        card.title = [
            `${event.courseCode ? `${event.courseCode} — ` : ''}${event.subject}`,
            event.teacher,
            `${formatTime(event.start)} – ${formatTime(event.end)}`,
            event.room
        ].filter(Boolean).join('\n');
        heading.textContent = event.courseCode || event.subject;
        subject.className = 'bb-weekly-schedule-event-subject';
        subject.textContent = event.courseCode ? event.subject : '';
        meta.className = 'bb-weekly-schedule-event-meta';

        if (event.teacher) {
            meta.appendChild(createMetaLine('person', event.teacher, 'teacher'));
        }
        meta.appendChild(createMetaLine(
            'schedule',
            `${formatTime(event.start)} – ${formatTime(event.end)}`,
            'time'
        ));
        if (event.room) {
            meta.appendChild(createMetaLine('location_on', event.room, 'room'));
        }
        card.append(heading, subject, meta);
        return card;
    }

    function renderSchedule(referenceDate = new Date()) {
        if (!workspace?.isConnected) return;

        const header = workspace.querySelector('#bb-weekly-schedule-days');
        const body = workspace.querySelector('#bb-weekly-schedule-body');
        const weekDates = calendar.getWeekDates(referenceDate);
        const todayIndex = calendar.getDayIndex(referenceDate);
        const bodyHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
        renderedDayKey = calendar.getDayKey(referenceDate);
        header.replaceChildren();
        body.replaceChildren();
        body.style.height = `${bodyHeight}px`;

        const timeHeader = document.createElement('div');
        timeHeader.className = 'bb-weekly-schedule-time-header';
        timeHeader.textContent = 'Time';
        header.appendChild(timeHeader);

        DAY_NAMES.forEach((dayName, index) => {
            const date = weekDates[index];
            const cell = document.createElement('div');
            const name = document.createElement('strong');
            const dateLabel = document.createElement('span');
            cell.className = 'bb-weekly-schedule-day-header';
            cell.classList.toggle('is-today', index === todayIndex);
            name.textContent = dayName;
            dateLabel.textContent = new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric'
            }).format(date);
            cell.append(name, dateLabel);
            header.appendChild(cell);
        });

        const timeAxis = document.createElement('div');
        timeAxis.className = 'bb-weekly-schedule-time-axis';
        for (let hour = START_HOUR; hour <= END_HOUR; hour += 1) {
            const label = document.createElement('span');
            label.style.top = `${(hour - START_HOUR) * HOUR_HEIGHT}px`;
            label.textContent = formatHour(hour);
            timeAxis.appendChild(label);
        }
        body.appendChild(timeAxis);

        const columns = DAY_NAMES.map((dayName, index) => {
            const column = document.createElement('div');
            column.className = 'bb-weekly-schedule-day-column';
            column.classList.toggle('is-today', index === todayIndex);
            column.setAttribute('aria-label', dayName);
            body.appendChild(column);
            return column;
        });

        state.events.forEach(event => {
            event.days.forEach(dayIndex => {
                const card = createEventCard(event, dayIndex);
                if (card && columns[dayIndex]) columns[dayIndex].appendChild(card);
            });
        });

        if (state.events.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'bb-weekly-schedule-empty-state';
            empty.innerHTML = `
                <span class="material-icons" aria-hidden="true">event_available</span>
                <strong>Your schedule is empty</strong>
                <span>Open Blackboard Courses and click Import, or add a course manually.</span>
            `;
            body.appendChild(empty);
        }

        const nowLine = document.createElement('div');
        nowLine.className = 'bb-weekly-schedule-now-line';
        nowLine.innerHTML = '<span></span>';
        body.appendChild(nowLine);
        updateCurrentTimeLine(referenceDate);
        renderImportMetadata();
    }

    function updateCurrentTimeLine(now = new Date()) {
        if (!workspace || workspace.hidden) return;

        const line = workspace.querySelector('.bb-weekly-schedule-now-line');
        if (!line) return;
        const minutes = (now.getHours() * 60) + now.getMinutes();
        const inVisibleRange = minutes >= START_HOUR * 60 && minutes <= END_HOUR * 60;
        line.hidden = !inVisibleRange;
        if (!inVisibleRange) return;

        const top = ((minutes - (START_HOUR * 60)) / 60) * HOUR_HEIGHT;
        line.style.top = `${top}px`;
        line.querySelector('span').textContent = formatTime(
            `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
    }

    function handleClockTick(now = new Date()) {
        if (!state.isOpen) return;

        // Re-render at local midnight. This updates today's highlight every day
        // and replaces all seven date labels when Monday starts a new week/month.
        if (calendar.getDayKey(now) !== renderedDayKey) {
            renderSchedule(now);
            return;
        }

        updateCurrentTimeLine(now);
    }

    function stopClock() {
        window.clearTimeout(clockAlignmentTimeout);
        window.clearInterval(clockInterval);
        clockAlignmentTimeout = null;
        clockInterval = null;
    }

    function startClock() {
        stopClock();
        handleClockTick();

        // Align the repeating update to the next exact minute instead of
        // drifting from whichever second the workspace happened to open.
        const delayUntilNextMinute = 60000 - (Date.now() % 60000);
        clockAlignmentTimeout = window.setTimeout(() => {
            handleClockTick();
            clockInterval = window.setInterval(handleClockTick, 60000);
        }, delayUntilNextMinute);
    }

    function renderImportMetadata() {
        const label = workspace?.querySelector('#bb-weekly-schedule-imported');
        if (!label) return;
        if (!state.lastImportedAt) {
            label.textContent = 'Not imported yet';
            return;
        }

        const date = new Date(state.lastImportedAt);
        label.textContent = Number.isNaN(date.getTime())
            ? `${state.courses.length} imported course(s)`
            : `${state.courses.length} course(s) imported ${new Intl.DateTimeFormat(undefined, {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
            }).format(date)}`;
    }

    // ----- Editor -----

    function getUniqueTeachers(selectedTeacher = '') {
        const names = state.courses.map(course => course.teacher).filter(Boolean);
        if (selectedTeacher) names.push(selectedTeacher);
        return [...new Set(names)].sort((left, right) => left.localeCompare(right));
    }

    function getCourseIdentity(course) {
        return course?.id || course?.fullCourseCode || '';
    }

    function getCourseSourceBaseLabel(course) {
        return course.courseCode
            ? `${course.courseCode} — ${course.subject || course.title}`
            : (course.subject || course.title);
    }

    function getCourseSourceLabel(course) {
        const label = getCourseSourceBaseLabel(course);
        const duplicateCount = state.courses.filter(item => (
            getCourseSourceBaseLabel(item) === label
        )).length;
        if (duplicateCount < 2) return label;

        return `${label} · ${course.fullCourseCode || getCourseIdentity(course)}`;
    }

    function findCourseBySourceValue(value) {
        return state.courses.find(course => getCourseSourceLabel(course) === value);
    }

    function fillCourseSuggestions(selectedCourseId = '', manualSubject = '') {
        const input = workspace.querySelector('#bb-weekly-schedule-course-source');
        const datalist = workspace.querySelector('#bb-weekly-schedule-course-options');
        const selectedCourse = state.courses.find(course => (
            getCourseIdentity(course) === selectedCourseId
        ));
        datalist.replaceChildren();
        state.courses.forEach(course => {
            const label = getCourseSourceLabel(course);
            datalist.appendChild(new Option(label, label));
        });
        input.value = selectedCourse ? getCourseSourceLabel(selectedCourse) : manualSubject;
    }

    function fillTeacherSuggestions(selectedTeacher = '') {
        const input = workspace.querySelector('#bb-weekly-schedule-teacher');
        const datalist = workspace.querySelector('#bb-weekly-schedule-teacher-options');
        const teachers = getUniqueTeachers(selectedTeacher);
        datalist.replaceChildren();
        teachers.forEach(teacher => datalist.appendChild(new Option(teacher, teacher)));
        input.value = selectedTeacher;
        input.placeholder = teachers.length > 0
            ? 'Choose or enter a teacher'
            : 'Import courses or enter a teacher';
    }

    function openEditor(eventId = '') {
        const modal = workspace.querySelector('#bb-weekly-schedule-modal');
        const form = workspace.querySelector('#bb-weekly-schedule-form');
        const scheduleEvent = state.events.find(item => item.id === eventId);
        form.reset();
        form.querySelector('#bb-weekly-schedule-event-id').value = scheduleEvent?.id || '';
        form.querySelector('#bb-weekly-schedule-code').value = scheduleEvent?.courseCode || '';
        form.querySelector('#bb-weekly-schedule-subject').value = scheduleEvent?.subject || '';
        form.querySelector('#bb-weekly-schedule-start').value = scheduleEvent?.start || '09:00';
        form.querySelector('#bb-weekly-schedule-end').value = scheduleEvent?.end || '10:00';
        form.querySelector('#bb-weekly-schedule-room').value = scheduleEvent?.room || '';
        form.querySelector('#bb-weekly-schedule-dialog-title').textContent = scheduleEvent
            ? 'Edit course'
            : 'Add course';
        form.querySelector('#bb-weekly-schedule-delete').hidden = !scheduleEvent;
        form.querySelector('#bb-weekly-schedule-form-error').textContent = '';
        fillCourseSuggestions(scheduleEvent?.courseId || '', scheduleEvent?.subject || '');
        fillTeacherSuggestions(scheduleEvent?.teacher || '');

        const selectedDays = scheduleEvent?.days || [calendar.getDayIndex()];
        form.querySelectorAll('[name="schedule-day"]').forEach(input => {
            input.checked = selectedDays.includes(Number(input.value));
        });
        const color = scheduleEvent?.color || 'blue';
        const colorInput = form.querySelector(`[name="schedule-color"][value="${color}"]`);
        if (colorInput) colorInput.checked = true;

        modal.hidden = false;
        document.body.classList.add('bb-weekly-schedule-modal-open');
        form.querySelector('#bb-weekly-schedule-subject').focus();
    }

    function closeEditor() {
        const modal = workspace?.querySelector('#bb-weekly-schedule-modal');
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('bb-weekly-schedule-modal-open');
    }

    function applyCourseToEditor(course) {
        const form = workspace.querySelector('#bb-weekly-schedule-form');
        form.querySelector('#bb-weekly-schedule-code').value = course.courseCode;
        form.querySelector('#bb-weekly-schedule-subject').value = course.subject || course.title;
        fillTeacherSuggestions(course.teacher);
        if (course.start) form.querySelector('#bb-weekly-schedule-start').value = course.start;
        if (course.end) form.querySelector('#bb-weekly-schedule-end').value = course.end;
        if (course.days.length > 0) {
            form.querySelectorAll('[name="schedule-day"]').forEach(input => {
                input.checked = course.days.includes(Number(input.value));
            });
        }
    }

    function handleCourseSourceInput(event) {
        const course = findCourseBySourceValue(event.currentTarget.value);
        if (course) {
            applyCourseToEditor(course);
            return;
        }

        // Manual text in the same combobox becomes the editable course name.
        workspace.querySelector('#bb-weekly-schedule-subject').value = event.currentTarget.value;
    }

    async function saveEditorEvent(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const eventId = form.querySelector('#bb-weekly-schedule-event-id').value;
        const original = state.events.find(item => item.id === eventId);
        const days = Array.from(form.querySelectorAll('[name="schedule-day"]:checked'))
            .map(input => Number(input.value));
        const start = form.querySelector('#bb-weekly-schedule-start').value;
        const end = form.querySelector('#bb-weekly-schedule-end').value;
        const error = form.querySelector('#bb-weekly-schedule-form-error');

        if (days.length === 0) {
            error.textContent = 'Choose at least one day.';
            return;
        }
        if (!start || !end || end <= start) {
            error.textContent = 'End time must be later than start time.';
            return;
        }

        const selectedCourseValue = form.querySelector('#bb-weekly-schedule-course-source').value;
        const selectedCourse = findCourseBySourceValue(selectedCourseValue);
        const source = original?.source === 'blackboard' && !selectedCourse
            ? 'manual'
            : original?.source || 'manual';
        const enteredTeacher = form.querySelector('#bb-weekly-schedule-teacher').value.trim();
        const catalogCourse = selectedCourse || state.courses.find(item => (
            getCourseIdentity(item) === original?.courseId
        ));
        const teacherEdited = source === 'blackboard'
            && enteredTeacher !== (catalogCourse?.teacher || '');
        const nextEvent = storage.normalizeEvent({
            id: original?.id || storage.createId('schedule'),
            courseId: selectedCourse
                ? getCourseIdentity(selectedCourse)
                : (source === 'blackboard' ? original?.courseId || '' : ''),
            courseCode: form.querySelector('#bb-weekly-schedule-code').value,
            subject: form.querySelector('#bb-weekly-schedule-subject').value,
            teacher: enteredTeacher,
            teacherOverride: teacherEdited ? enteredTeacher : '',
            teacherEdited,
            days,
            start,
            end,
            room: form.querySelector('#bb-weekly-schedule-room').value,
            color: form.querySelector('[name="schedule-color"]:checked')?.value,
            source
        });
        state.events = original
            ? state.events.map(item => item.id === original.id ? nextEvent : item)
            : [...state.events, nextEvent];

        try {
            await storage.saveEvents(state.events);
            closeEditor();
            renderSchedule();
            showStatus(original ? 'Course updated.' : 'Course added.');
        } catch (saveError) {
            error.textContent = 'Could not save this course. Please try again.';
        }
    }

    async function deleteEditorEvent() {
        const eventId = workspace.querySelector('#bb-weekly-schedule-event-id').value;
        if (!eventId) return;
        const scheduleEvent = state.events.find(item => item.id === eventId);
        if (!window.confirm(`Delete ${scheduleEvent?.subject || 'this course'} from the schedule?`)) {
            return;
        }

        const previousEvents = state.events;
        state.events = state.events.filter(item => item.id !== eventId);
        try {
            await storage.saveEvents(state.events);
            closeEditor();
            renderSchedule();
            showStatus('Course deleted.');
        } catch (error) {
            state.events = previousEvents;
            showStatus('Could not delete the course.', true);
        }
    }

    // ----- Import and toolbar actions -----

    async function handleImport() {
        const importButton = workspace.querySelector('[data-action="import"]');
        if (!/^\/ultra\/course(?:\/|$)/.test(window.location.pathname)) {
            showStatus('Open Blackboard Courses, scroll down to load all courses, then open Schedule and click Import.', true);
            return;
        }

        importButton.disabled = true;
        importButton.classList.add('is-loading');
        try {
            // This is the only call site that reads course cards from Blackboard.
            const courses = storage.normalizeCourses(courseImport.extractCourses(document));
            if (courses.length === 0) {
                showStatus('No available course cards were found. Wait for Courses to finish loading and try again.', true);
                return;
            }

            const previousImportedEvents = new Map(
                state.events
                    .filter(item => item.source === 'blackboard')
                    .map(item => [item.courseId || item.courseCode, item])
            );
            const importedEvents = storage.normalizeEvents(
                courseImport.coursesToEvents(courses).map(item => {
                    const previous = previousImportedEvents.get(
                        item.courseId || item.courseCode
                    );
                    // Room, color, and an explicitly edited teacher are local
                    // choices, so keep them when Blackboard details are refreshed.
                    return previous
                        ? {
                            ...item,
                            room: previous.room,
                            color: previous.color,
                            teacher: previous.teacherEdited
                                ? previous.teacherOverride
                                : item.teacher,
                            teacherOverride: previous.teacherOverride,
                            teacherEdited: previous.teacherEdited
                        }
                        : item;
                })
            );
            const manualEvents = state.events.filter(item => item.source !== 'blackboard');
            const nextEvents = [...manualEvents, ...importedEvents];
            const importedAt = new Date().toISOString();
            await storage.saveData(nextEvents, courses, importedAt);
            state.events = nextEvents;
            state.courses = courses;
            state.lastImportedAt = importedAt;
            renderSchedule();
            showStatus(
                `Imported ${courses.length} course(s); ${importedEvents.length} schedule entr${importedEvents.length === 1 ? 'y' : 'ies'} created.`
            );
        } catch (error) {
            console.error('BB Better Layout: Weekly Schedule import failed.', error);
            showStatus('Course import failed. Please reload Courses and try again.', true);
        } finally {
            importButton.disabled = false;
            importButton.classList.remove('is-loading');
        }
    }

    async function saveSchedule() {
        try {
            await storage.saveEvents(state.events);
            showStatus('Schedule saved on this device.');
        } catch (error) {
            showStatus('Could not save the schedule.', true);
        }
    }

    async function emptySchedule() {
        if (state.events.length === 0) {
            showStatus('The schedule is already empty.');
            return;
        }
        if (!window.confirm('Empty the weekly schedule? Imported course and teacher choices will remain available.')) {
            return;
        }

        const previousEvents = state.events;
        state.events = [];
        try {
            await storage.saveEvents([]);
            renderSchedule();
            showStatus('Schedule emptied. Imported course choices were kept.');
        } catch (error) {
            state.events = previousEvents;
            showStatus('Could not empty the schedule.', true);
        }
    }

    function handleWorkspaceClick(event) {
        const eventCard = event.target.closest('.bb-weekly-schedule-event');
        if (eventCard) {
            openEditor(eventCard.dataset.eventId);
            return;
        }

        const actionButton = event.target.closest('[data-action]');
        if (!actionButton || !workspace.contains(actionButton)) return;
        const actions = {
            add: () => openEditor(),
            import: handleImport,
            save: saveSchedule,
            empty: emptySchedule,
            close: closeWorkspace,
            'cancel-editor': closeEditor,
            'delete-event': deleteEditorEvent
        };
        actions[actionButton.dataset.action]?.();
    }

    function showStatus(message, isError = false) {
        const status = workspace?.querySelector('#bb-weekly-schedule-status');
        if (!status) return;
        clearTimeout(statusTimeout);
        status.textContent = message;
        status.classList.toggle('is-error', isError);
        status.classList.add('is-visible');
        statusTimeout = setTimeout(() => status.classList.remove('is-visible'), isError ? 6000 : 4000);
    }

    // ----- Lifecycle and storage synchronization -----

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
        workspace.style.setProperty('--bb-weekly-left-offset', `${leftOffset}px`);
    }

    function openWorkspace() {
        if (!state.enabled) return;

        // Study Note already guards its own unsaved editor state; respect its answer.
        if (BBLayout.studyNote?.close?.() === false) return;
        createWorkspace();
        if (state.isOpen) {
            workspace.querySelector('[data-action="add"]')?.focus();
            return;
        }

        state.lastFocusedElement = document.activeElement;
        state.isOpen = true;
        workspace.hidden = false;
        document.body.classList.add('bb-weekly-schedule-open');
        navButton?.setAttribute('aria-current', 'page');
        updateWorkspaceOffset();
        renderSchedule();
        startClock();
        workspace.querySelector('[data-action="add"]')?.focus();
    }

    function closeWorkspace() {
        if (!workspace || workspace.hidden) return;
        closeEditor();
        workspace.hidden = true;
        state.isOpen = false;
        document.body.classList.remove('bb-weekly-schedule-open');
        navButton?.removeAttribute('aria-current');
        stopClock();
        if (state.lastFocusedElement?.isConnected) state.lastFocusedElement.focus();
    }

    function removeFeatureUi() {
        const container = getGlobalNavigationContainer();
        closeWorkspace();
        navButton?.remove();
        workspace?.remove();
        navButton = null;
        workspace = null;
        if (container) syncUtilitySpacing(container);
    }

    function handleStorageChange(changes, areaName) {
        if (areaName !== 'local') return;

        if (changes[storage.ENABLED_KEY]) {
            state.enabled = changes[storage.ENABLED_KEY].newValue === true;
            if (state.enabled) ensureNavigationButton();
            else removeFeatureUi();
        }
        if (changes[storage.EVENTS_KEY]) {
            state.events = storage.normalizeEvents(changes[storage.EVENTS_KEY].newValue);
            if (workspace?.isConnected) renderSchedule();
        }
        if (changes[storage.COURSES_KEY]) {
            state.courses = storage.normalizeCourses(changes[storage.COURSES_KEY].newValue);
            if (workspace?.isConnected) renderImportMetadata();
        }
        if (changes[storage.LAST_IMPORTED_KEY]) {
            state.lastImportedAt = String(changes[storage.LAST_IMPORTED_KEY].newValue || '');
            if (workspace?.isConnected) renderImportMetadata();
        }
    }

    function handleEscape(event) {
        if (event.key !== 'Escape' || !state.isOpen) return;
        const modal = workspace?.querySelector('#bb-weekly-schedule-modal');
        if (modal && !modal.hidden) closeEditor();
        else closeWorkspace();
    }

    async function initialize() {
        if (initialized) return;
        initialized = true;
        chrome.storage.onChanged.addListener(handleStorageChange);
        window.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', BBLayout.debounce(updateWorkspaceOffset, 100), { passive: true });

        try {
            const data = await storage.loadData();
            state.enabled = data.enabled;
            state.events = data.events;
            state.courses = data.courses;
            state.lastImportedAt = data.lastImportedAt;
        } catch (error) {
            console.error('BB Better Layout: Weekly Schedule could not initialize.', error);
            state.enabled = true;
            state.events = [];
            state.courses = [];
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

    BBLayout.weeklySchedule = {
        initialize,
        run,
        open: openWorkspace,
        close: closeWorkspace,
        // Exposed for deterministic rollover verification without changing the
        // system clock; normal operation calls the same function every minute.
        refresh: handleClockTick
    };
})();
