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
- [x] Reload Blackboard and confirm the selected theme persists.

## Keyboard shortcut checks

- [x] Open the extension options and save a custom shortcut containing at least one modifier key.
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
- [x] Open the options page from the popup and confirm existing settings still load.

## Privacy and permissions check

- [x] Confirm `content_scripts.matches` remains limited to `https://adamson.blackboard.com/*`.
- [x] Confirm no new extension permissions or host permissions were added unintentionally.
- [x] Confirm no Blackboard DOM content, cookies, session data, grades, or submissions are sent to an external service.
