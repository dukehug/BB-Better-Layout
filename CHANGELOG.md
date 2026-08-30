# Changelog

This file records notable user-facing and maintenance changes to BB Better Layout.
Release entries use the version from `manifest.json` and the date format `YYYY/MM/DD`.

## Unreleased

- Open existing Study Note notes in Preview by default while keeping newly created notes ready to edit in Write mode.

## v2.12.3 - 2026/08/29

- Match the Dashboard navigation drawer, legal footer links, and collapse control to the active Appearance instead of exposing Blackboard's native dark footer background.

## v2.12.2 - 2026/08/29

- Replace Rose Reading with a brighter Cute Pink Appearance while preserving accessible reading contrast.
- Open Blackboard's native Your Courses switcher from the Courses shortcut on single-course pages without changing Course Content or Roster search behavior.
- Add Arrow Up/Down result selection, Enter navigation, and Escape closing to the Your Courses search field.
- Center the native Your Courses dialog and match its surfaces, text, borders, tabs, results, and selected states to the active Appearance.
- Fix the themed Your Courses search field and its focus-state label mask so the background, floating label, caret, and typed text remain readable in every Appearance.

## v2.12.1 - 2026/08/15

- Add a dependency-free Markdown editor to Study Note with Write and Preview modes, a formatting toolbar, keyboard shortcuts, and safe DOM-based rendering.
- Support headings, emphasis, strikethrough, links, quotes, ordered and unordered lists, task lists, code blocks, horizontal rules, and tables in Study Note previews.
- Display incomplete and completed task boxes reliably inside Blackboard, and strike through completed task text.
- Convert a selected HTTP(S) or mailto URL into a Markdown link while keeping the link label selected for immediate editing.
- Add a one-time Markdown writing example to Quick Notes without recreating it after the user deletes it.
- Change Study Note JSON import from replacement to append-only merging, add CSV backup import, reuse matching notebook names, and regenerate colliding IDs instead of overwriting local data.
- Enable Show Study Note and Show Weekly Schedule by default for installations without a saved preference while preserving an explicit disabled setting.
- Replace Schedule's imported-course-only selector with an editable course combobox that accepts manual course names and still fills course, teacher, day, and time fields from imported choices.

## v2.12.0 - 2026/08/15

- Add an optional device-local weekly Schedule workspace to Blackboard's main side panel.
- Add an options-page switch that enables or disables Schedule without deleting saved timetable data.
- Import course codes, names, meeting days, meeting times, and instructor details only after the user clicks Import on the Blackboard Courses page.
- Parse compact Blackboard meeting-day formats, including combined weekday codes and Saturday schedules.
- Import each instructor's first name and preserve Blackboard's `Multiple Instructors` label when a course uses the multi-user instructor control.
- Let users add, edit, delete, color-code, and save schedule entries with course, teacher, day, time, and Room fields.
- Provide editable teacher suggestions and preserve local teacher overrides, manual entries, Room values, and colors across subsequent course imports.
- Display a live current-time line with a visible minute label and update it on every exact minute.
- Refresh the highlighted day and all week date labels automatically across daily, weekly, monthly, and yearly boundaries.
- Improve one-hour and shorter course cards so course names remain readable while Room and time details stay visible.

## v2.11.0 - 2026/08/15

- Replace the previously hard-coded sidebar destinations with user-defined external links.
- Add an options-page switch that hides or shows custom links without deleting their saved configuration.
- Let users add, edit, and remove up to six external destinations with a name, HTTP(S) URL, and Google Material icon.
- Validate stored and submitted links, reject non-HTTP(S) destinations, and open accepted links in a separate tab with opener isolation.
- Update custom links immediately when synchronized extension settings change, including during Blackboard SPA navigation.
- Keep the Dashboard navigation scrollable when additional links exceed the available viewport height.
- Bundle the Apache-2.0 Google Material Icons font locally for the options-page icon picker.
- Match Blackboard's official Courses-page To Do panel to the selected Appearance palette.
- Theme the To Do surface, divider, headings, secondary text, accordion states, assignment hover states, date badges, empty states, and icons with stable semantic selectors.
- Preserve Blackboard's overdue warning colors while applying readable theme colors to the surrounding item content.

## v2.10.5 - 2026/08/15

- Add a footer control that collapses the Dashboard main navigation from its full width to a persistent 64px icon rail.
- Use Google Material Symbols `right_panel_open` and `right_panel_close` for the navigation control without a visible text label.
- Keep native and extension navigation icons available while the panel is collapsed, and expand the Dashboard content into the released space.
- Hide Privacy, Terms, and Accessibility while the navigation is collapsed, with the open-panel control remaining at the bottom edge.
- Remember the collapsed navigation preference in device-local extension storage across page reloads and Blackboard SPA navigation.
- Ignore incomplete synthetic keyboard events and malformed legacy shortcut settings instead of raising an `undefined.toLowerCase()` extension error.

## v2.10.4 - 2026/08/13

- Keep the desktop main navigation above the Study Note workspace so its right-edge shadow remains visible.
- Preserve full Study Note coverage on narrow screens.

## v2.10.3 - 2026/08/13

- Present the popup description as a left-aligned subtitle and unordered feature list.

## v2.10.2 - 2026/08/13

- Align Study Note and extension-provided navigation labels in the main navigation.
- Remove hard-coded non-breaking spaces from custom navigation labels and rely on shared icon spacing.

## v2.10.1 - 2026/08/13

- Replace Todo Calendar with a notes-only Study Note workspace.
- Add notebooks with create, rename, and delete controls.
- Add note search, notebook filtering, and multi-select note deletion.
- Add a configurable global shortcut for opening the Quick Study Note dialog from any Blackboard page.
- Preserve unsaved note and notebook changes with confirmation prompts before leaving Study Note.
- Correct Study Note navigation highlighting when switching between Study Note and Blackboard pages.
- Improve editor, search, action button, notebook selector, typography, and form-control alignment.
- Keep Study Note data device-local with JSON backup import/export and CSV export.

## v2.10.0 - 2026/08/13

- Add an optional Todo Calendar workspace to Blackboard's main navigation.
- Add monthly and Backlog task views with drag-and-drop date changes.
- Add task priorities, notes, completion tracking, and task search.
- Store Todo data only in device-local Chrome Extension storage.
- Add JSON backup import/export and CSV export.
- Add Todo Calendar settings, privacy documentation, and manual regression checks.

## v2.9.1 - 2026/08/10

- Add 10px of internal top spacing above the vertical course-navigation items without moving the navigation container.

## v2.9.0 - 2026/08/10

- Add soft header shadows to Courses, Calendar, Messages, Grades, and Tools pages.
- Add soft full-height shadows to the main navigation drawer and vertical course navigation.
- Prevent Appearance colors and Blackboard's multiply blend mode from tinting custom course covers.
- Add mouse, touch, and keyboard course-cover positioning with a center reset control.

## v2.8.0 - 2026/08/10

- Remove the empty horizontal course-navigation space after the tools move into the vertical sidebar.
- Add a device-local custom course cover image setting with automatic WebP resizing and compression.
- Add a subtle shadow below the Activity Stream header to separate it from the content area.

## v2.7.0 - 2026/08/10

- Add Graphite, Aqua, and Rose reading themes with low-saturation surfaces and accessible text contrast.
- Apply the selected Appearance palette to Blackboard's main navigation and course navigation.
- Detect duplicate extension shortcuts while recording and remind users about browser, operating-system, and Blackboard shortcut conflicts.

## v2.6.0 - 2026/08/02

- Add a course search dialog to the configured search shortcut on the Courses page.
- Add Arrow Up/Down result selection and Enter navigation to course search.
- Open Blackboard's native Course Content search from course outline pages.
- Open Blackboard's native member search from Roster pages.
- Preserve Blackboard's native search fields and result styling on outline and Roster pages.
- Clear the Courses-page search filter when the search dialog is dismissed or a result is opened.
- Navigate search results with CSP-safe course outline URLs instead of Blackboard's `javascript:` card links.
- Add a standalone changelog for future release tracking.
- Add a manual regression checklist for Blackboard pages and extension settings.
- Split the content script into focused theme, banner, sidebar, Group Space, back-to-top, and shared utility modules.
- Keep `content.js` as the SPA initialization coordinator and declare module load order in `manifest.json`.

## Legacy notes through v2.5.1

The following historical notes were migrated from the previous README summary. Earlier releases did not record which individual version introduced each item.

- Add new appearance options.
- Fix keyboard shortcuts.
- Improve the layout.
- Add the back-to-top button.
