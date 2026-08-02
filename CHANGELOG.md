# Changelog

This file records notable user-facing and maintenance changes to BB Better Layout.
Release entries use the version from `manifest.json` and the date format `YYYY/MM/DD`.

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
