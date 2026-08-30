# Manual Testing

BB Better Layout has no automated browser test suite. Run this checklist against the supported Blackboard Ultra deployment after loading the extension as an unpacked extension in Chrome.

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
- [x] With custom links enabled, confirm each saved destination appears in the global navigation only once.
- [x] Confirm the Dashboard footer control is the final sidebar item, below Privacy, Terms, and Accessibility when the panel is expanded.
- [x] Confirm the footer control shows the Google Material Symbols `right_panel_close` and `right_panel_open` icons without a visible text label.
- [x] Collapse the Dashboard navigation and confirm it becomes a 64px rail while native, Study Note, and external-link icons remain visible and aligned.
- [x] Confirm Privacy, Terms, and Accessibility are hidden while collapsed and the open-panel icon remains at the bottom edge.
- [x] Reopen the navigation and confirm labels, legal links, the 200px panel width, and the original content offset are restored.
- [x] Reload Blackboard and move between SPA routes; confirm the selected expanded or collapsed state persists.
- [x] Confirm Study Note and custom external-link labels share the same left alignment.
- [x] Confirm custom links open in a new tab and the original Blackboard tab stays open.
- [x] Confirm there are no new errors from the extension in the page console during navigation.

## Custom external-link checks

- [x] Open the options page and confirm Custom External Links loads the saved enabled state and link rows.
- [x] Add `Learning Portal`, `https://example.com`, and the School Material icon; save and confirm the link appears in Blackboard's main navigation.
- [x] Change a selected Material icon and confirm both its options-page preview and sidebar glyph update.
- [x] Confirm the Add Link control becomes disabled at six rows and synchronized storage never renders more than six links.
- [x] Try an empty name, malformed URL, `javascript:`, `data:`, and `file:` destination; confirm saving is rejected with an inline error.
- [x] Disable custom links and confirm all saved destinations disappear while their options-page rows remain available.
- [x] Re-enable custom links and confirm the previously saved destinations return without being re-entered.
- [x] Remove a link, save, and confirm the sidebar updates without leaving a duplicate or stale destination.
- [x] Confirm each external link opens in a new tab with `noopener noreferrer` and leaves the Blackboard tab open.
- [x] On a short viewport with six links, confirm the main navigation remains scrollable and all destinations are reachable.

## Schedule checks

- [x] With no saved preference, open the options page and confirm Show Weekly Schedule is enabled by default; confirm a previously saved `false` value remains disabled.
- [x] Enable Schedule in the options page and confirm a single `Schedule` entry appears in Blackboard's main side panel.
- [ ] Disable and re-enable Schedule and confirm saved courses are not deleted.
- [x] Confirm opening Schedule does not read or store Blackboard course cards until Import is clicked.
- [x] On `/ultra/course`, click Import and confirm available course codes, names, meeting days, and meeting times create the expected weekly entries.
- [x] Confirm instructor names are reduced to their first name while Blackboard multi-user courses display `Multiple Instructors` in full.
- [x] Edit a `Multiple Instructors` course, enter a teacher override, save, and confirm another Import keeps the local teacher value.
- [x] Open Add course, type a new value directly into Course, and confirm Course name mirrors the manual value and the entry saves successfully.
- [x] Open Add course again, select an imported Course suggestion, and confirm code, name, teacher, days, and start/end times are filled automatically.
- [ ] Confirm manually created schedule entries remain after Blackboard courses are imported again.
- [ ] Confirm editing a course preserves its selected days, start/end time, color, teacher, and Room after closing and reopening the editor.
- [x] Confirm one-hour cards show teacher/time plus Room without overlapping the course name.
- [x] Confirm sub-hour cards prioritize course code, Room, and time, with complete details still available in the tooltip and editor.
- [x] Confirm longer entries display teacher, time, and Room on separate readable lines.
- [x] Confirm the current-time line includes a visible time label.
- [ ] Leave Schedule open across an exact minute and confirm the time label advances without reopening the workspace.
- [x] Verify a simulated midnight refresh updates today's highlight and changes a week spanning August 31 to September 1 into the correct month labels.
- [x] Verify a week spanning December 28 to January 3 uses the correct year-boundary dates.
- [ ] Add, edit, delete, and Empty several manual entries, then reload Blackboard and confirm the resulting schedule persists locally.
- [ ] Switch every Appearance and confirm Schedule cards, grid lines, dialogs, controls, and metadata remain readable.

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
- [ ] Cute Pink
- [ ] For each reading theme, confirm the main navigation and course navigation use the selected palette with readable hover and active states.
- [ ] Confirm the Dashboard drawer, Privacy, Terms, Accessibility, and the collapse control follow every Appearance without exposing Blackboard's dark footer background.
- [x] On `/ultra/course`, confirm the official To Do panel surface, divider, headings, secondary text, accordion arrows, date badges, and empty states follow each custom Appearance palette.
- [x] Confirm To Do accordion summaries and assignment links use a readable themed hover and keyboard-focus state.
- [x] Confirm To Do overdue dates and badge status bars retain Blackboard's warning colors after switching Appearance.
- [ ] Confirm To Do primary and secondary text remain readable in Nord Snow, Paper, Sage, Sky, Lavender, Graphite, Aqua, and Cute Pink.
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
- [x] Confirm incomplete synthetic keydown events and malformed legacy shortcut values do not add an `undefined.toLowerCase()` extension error.
- [ ] Assign a shortcut already used by another extension action and confirm it is rejected with a conflict warning.
- [ ] Confirm the settings hint reminds users about browser, operating-system, and Blackboard shortcut conflicts.
- [x] On `/ultra/course`, trigger course search and confirm its dialog opens with the search input focused.
- [x] Type a course name or section number, use Arrow Up/Down to change the selected result, and press Enter to open it.
- [x] After opening a result with Enter, return to `/ultra/course` and confirm its native search field is empty and the full course list is restored.
- [x] Confirm opening a search result does not add a `Running the JavaScript URL violates...` error to the extension error page or DevTools console.
- [x] On `/ultra/courses/*/outline`, trigger search and confirm Blackboard's native Course Content search field expands and receives focus without opening the Your Courses dialog.
- [x] Confirm the Course Content search results retain Blackboard's original layout and styling.
- [ ] On `/ultra/courses/*/outline`, trigger the Courses shortcut and confirm Blackboard's native Your Courses dialog opens with its Search courses field focused without navigating away.
- [ ] Close Your Courses, then trigger Search Current Page and confirm Course Content search opens without reopening the course switcher.
- [ ] In Your Courses search, use Arrow Up/Down to highlight a result, press Enter to open it, and press Escape to close the dialog.
- [ ] Confirm Your Courses is centered on desktop and mobile widths, and remains readable in every Appearance.
- [ ] In every Appearance, confirm the Search courses field background, focused floating-label mask, caret, and typed text remain clearly readable without a dark bar behind the label.
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

- [x] With no saved preference, open the options page and confirm Show Study Note is enabled by default; confirm a previously saved `false` value remains disabled.
- [ ] Enable Study Note in the options page and confirm its entry appears once in Blackboard's main navigation without refreshing.
- [ ] Disable Study Note while it is open and confirm the workspace, quick-note modal, and navigation entry are removed.
- [ ] Open Study Note from Activity, Courses, and a single course; confirm the three-pane layout does not cover the visible navigation.
- [ ] With Study Note open on a desktop viewport, confirm the main navigation keeps its right-edge shadow above the workspace.
- [ ] Create notebooks and notes, move a note by changing its Notebook field, and reload Blackboard to confirm they persist locally.
- [ ] Search by note title and content and confirm the middle note list updates.
- [ ] Open an existing note and confirm it starts in Preview; switch to another existing note and confirm Preview is restored, then create a note and confirm it starts in Write.
- [ ] Edit and delete a note and confirm the notebook counts and editor state update.
- [ ] Configure Quick Study Note in the options shortcut table and confirm the shortcut updates immediately.
- [ ] Trigger Quick Study Note from Activity, Courses, Calendar, and a single course without changing the current page.
- [ ] Save a note through the quick modal and confirm it appears in the Study Note workspace.
- [ ] Confirm the shortcut does not interrupt typing in Blackboard inputs, textareas, selects, or editable fields.
- [x] Confirm Quick Notes receives one Markdown Writing Example after the feature update and that deleting the example does not recreate it on the next load.
- [x] Use the Markdown toolbar and keyboard shortcuts, switch between Write and Preview, and confirm headings, emphasis, links, quotes, lists, code, horizontal rules, and tables render correctly.
- [x] Preview `- [ ]   todo list` and `- [x] done`; confirm both checkboxes remain visible inside Blackboard and the completed task text is struck through.
- [x] Select an HTTP(S) URL and click the link tool; confirm the result is `[link text](selected URL)` with `link text` selected for editing.
- [x] Confirm raw HTML or script text in a note remains inert text in Preview and unsafe URL schemes do not become links.
- [x] Export JSON, import it with existing notes present, and confirm the backup is appended without clearing local notes; matching notebooks are reused and colliding IDs do not overwrite data.
- [x] Export CSV, import it with existing notes present, and confirm Markdown containing commas, line breaks, and escaped quotes round-trips correctly.
- [ ] Try importing malformed JSON, malformed CSV, an unsupported file type, and a file over 10 MB; confirm existing notes remain unchanged.
- [ ] If legacy Todo data exists, confirm it appears once in the Imported Todo notebook.
- [ ] Confirm Escape closes the quick-note modal and then closes the Study Note workspace.
- [ ] Switch each reading theme and confirm Study Note text, fields, borders, selection states, and buttons remain readable.

## Privacy and permissions check

- [x] Confirm `content_scripts.matches` remains limited to the intended Blackboard Ultra deployment.
- [x] Confirm no new extension permissions or host permissions were added unintentionally.
- [x] Confirm no Blackboard DOM content, cookies, session data, grades, or submissions are sent to an external service.
- [ ] Confirm Study Note data uses `chrome.storage.local` only and import/export performs no network request.
