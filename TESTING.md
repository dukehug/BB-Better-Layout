# Manual Testing

BB Better Layout has no automated browser test suite. Run this checklist against `https://adamson.blackboard.com/` after loading the extension as an unpacked extension in Chrome.

Record the Chrome version, extension version, test date, and any failed page or selector when reporting results.

## Required bug-fix regression check

These checks mirror the required self-test steps in `AGENT.md`.

- [x] Open the Courses list page and confirm course cards use the expected grid layout.
- [x] Confirm each visible course banner shows its course title and, when available, its section number without duplicated content.
- [x] Open a single course and confirm the vertical course navigation appears with icons and remains aligned below the course header after resizing the window.
- [x] On a single course page with long content, scroll to the bottom, confirm the back-to-top button appears, and confirm it returns the correct scroll container to the top.
- [x] Switch to at least one different reading theme and confirm it applies without refreshing the Blackboard page.
- [x] Trigger at least one configured keyboard shortcut and confirm it performs the saved action.

## SPA and navigation checks

- [x] Move between Activity, Courses, and a single course without a full page reload; confirm enhancements reappear after each route change.
- [x] Return from a single course to a global page and confirm stale vertical-course-navigation spacing or classes are removed.
- [x] Confirm the global navigation contains Schedule App, Outlook, AdU Live, and AdU Calendar only once.
- [ ] Confirm Study Note and all four custom navigation labels share the same left alignment.
- [x] Confirm custom links open in a new tab and the original Blackboard tab stays open.
- [x] Confirm there are no new errors from the extension in the page console during navigation.

## Theme checks

Run the full set when changing theme code or theme CSS.

- [x] Default Light
- [x] Nord Snow
- [x] Paper Reading
- [x] Sage Reading
- [x] Sky Reading
- [x] Lavender Reading
- [ ] Graphite Reading
- [ ] Aqua Reading
- [ ] Rose Reading
- [ ] For each reading theme, confirm the main navigation and course navigation use the selected palette with readable hover and active states.
- [x] Reload Blackboard and confirm the selected theme persists.
- [ ] Choose a JPEG, PNG, or WebP course cover in Appearance and confirm it updates all open course pages immediately.
- [ ] Reload Blackboard and confirm the local course cover persists on this device.
- [ ] Select Use Default and confirm Blackboard's original course cover returns.
- [ ] Confirm Appearance changes do not tint or obscure the selected custom course cover.
- [ ] Drag the cover preview horizontally and vertically and confirm the course-page image position updates immediately.
- [ ] Focus the cover preview, adjust it with Arrow keys, and confirm Shift + Arrow uses a larger step.
- [ ] Select Center Image and confirm the cover returns to its default 50% / 50% position.

## Keyboard shortcut checks

- [x] Open the extension options and save a custom shortcut containing at least one modifier key.
- [ ] Assign a shortcut already used by another extension action and confirm it is rejected with a conflict warning.
- [ ] Confirm the settings hint reminds users about browser, operating-system, and Blackboard shortcut conflicts.
- [x] On `/ultra/course`, trigger course search and confirm its dialog opens with the search input focused.
- [x] Type a course name or section number, use Arrow Up/Down to change the selected result, and press Enter to open it.
- [x] After opening a result with Enter, return to `/ultra/course` and confirm its native search field is empty and the full course list is restored.
- [x] Confirm opening a search result does not add a `Running the JavaScript URL violates...` error to the extension error page or DevTools console.
- [x] On `/ultra/courses/*/outline`, trigger search and confirm Blackboard's native Course Content search field expands and receives focus without opening the Your Courses dialog.
- [x] Confirm the Course Content search results retain Blackboard's original layout and styling.
- [x] On `/ultra/courses/*/outline/roster`, trigger search and confirm Blackboard's native Roster search field expands and receives focus without opening the Your Courses dialog.
- [x] Press Escape or click outside the Courses-page search dialog and confirm it closes, clears the native Courses search field, restores the full course list, and restores focus.
- [x] Focus an input, textarea, select, or editable field and confirm the shortcut does not interrupt typing.
- [x] Reset shortcuts and confirm the defaults work again.

## Group Space and extension UI checks

- [x] On a Group Space member list, open an avatar with a mouse and close it with the close button or overlay.
- [x] Open an avatar using Enter or Space, close it with Escape, and confirm focus returns to the avatar.
- [x] Open the toolbar popup and confirm its displayed version matches `manifest.json`.
- [ ] Confirm the popup description uses a left-aligned subtitle and a readable four-item feature list.
- [x] Open the options page from the popup and confirm existing settings still load.
- [x] On Activity Stream, confirm the header shadow clearly separates the header without obscuring content.
- [x] Confirm Courses, Calendar, Messages, Grades, and Tools use the same soft header shadow.
- [x] Confirm the global navigation drawer and vertical course navigation use a soft edge shadow.
- [x] On a course page, confirm no empty horizontal-navigation space remains above the course cover.
- [x] Confirm the vertical course-navigation container stays fixed while its Content item begins 10px below the course header.

## Study Note checks

- [ ] Enable Study Note in the options page and confirm its entry appears once in Blackboard's main navigation without refreshing.
- [ ] Disable Study Note while it is open and confirm the workspace, quick-note modal, and navigation entry are removed.
- [ ] Open Study Note from Activity, Courses, and a single course; confirm the three-pane layout does not cover the visible navigation.
- [ ] With Study Note open on a desktop viewport, confirm the main navigation keeps its right-edge shadow above the workspace.
- [ ] Create notebooks and notes, move a note by changing its Notebook field, and reload Blackboard to confirm they persist locally.
- [ ] Search by note title and content and confirm the middle note list updates.
- [ ] Edit and delete a note and confirm the notebook counts and editor state update.
- [ ] Configure Quick Study Note in the options shortcut table and confirm the shortcut updates immediately.
- [ ] Trigger Quick Study Note from Activity, Courses, Calendar, and a single course without changing the current page.
- [ ] Save a note through the quick modal and confirm it appears in the Study Note workspace.
- [ ] Confirm the shortcut does not interrupt typing in Blackboard inputs, textareas, selects, or editable fields.
- [ ] Export JSON, replace the current notes through JSON import, and confirm notebooks and note content match the backup.
- [ ] Export CSV and confirm titles, notebooks, content, and timestamps open correctly in a spreadsheet.
- [ ] Try importing malformed JSON and a file over 10 MB and confirm the current notes are not replaced.
- [ ] If legacy Todo data exists, confirm it appears once in the Imported Todo notebook.
- [ ] Confirm Escape closes the quick-note modal and then closes the Study Note workspace.
- [ ] Switch each reading theme and confirm Study Note text, fields, borders, selection states, and buttons remain readable.

## Privacy and permissions check

- [x] Confirm `content_scripts.matches` remains limited to `https://adamson.blackboard.com/*`.
- [x] Confirm no new extension permissions or host permissions were added unintentionally.
- [x] Confirm no Blackboard DOM content, cookies, session data, grades, or submissions are sent to an external service.
- [ ] Confirm Study Note data uses `chrome.storage.local` only and import/export performs no network request.
