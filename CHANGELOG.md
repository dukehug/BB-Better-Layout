# Changelog

This file records notable user-facing and maintenance changes to BB Better Layout.
Release entries use the version from `manifest.json` and the date format `YYYY/MM/DD`.

## v2.10.4 - 2026/08/13

- Keep the desktop main navigation above the Study Note workspace so its right-edge shadow remains visible.
- Preserve full Study Note coverage on narrow screens.

## v2.10.3 - 2026/08/13

- Present the popup description as a left-aligned subtitle and unordered feature list.

## v2.10.2 - 2026/08/13

- Align Study Note, Schedule App, Outlook, AdU Live, and AdU Calendar labels in the main navigation.
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
