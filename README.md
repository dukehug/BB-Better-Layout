# BB Better Layout

This Chrome extension enhances Blackboard Ultra by maximizing screen space.
New features include a vertical sidebar, automatically generated text banners, and customizable quick links for a smoother workflow.

This is an independent project. It is not affiliated with, endorsed by, or officially supported by Anthology or Blackboard.

## Privacy and Support

- [Privacy Policy](PRIVACY.md)
- [Changelog](CHANGELOG.md)
- [Manual Testing](TESTING.md)
- [Support and issue reports](https://github.com/dukehug/BB-Better-Layout/issues)

## Features

- Collapsible Dashboard side navigation with a persistent 64px icon rail
- Simple subject banner
- Back to top button
- Nine reading appearances and customizable keyboard shortcuts
- Optional device-local custom image for course-page covers
- Context-aware keyboard search for Courses, Course Content, and Roster pages
- Appearance-aware styling for Blackboard's official Courses-page To Do panel
- Device-local Study Note workspace with notebooks, search, quick notes, and JSON/CSV export
- Up to six optional custom sidebar links with validated URLs and Google Material icons

## What you can do with this extension
- Collapse the Dashboard navigation to icons only and restore it from the footer control without losing your preferred state after a reload.
- Search courses from the Courses page, course materials from an outline, or members from a Roster using the same shortcut.
- Choose a comfortable reading appearance.
- Keep the Courses-page To Do panel visually consistent with the selected reading appearance without losing overdue warning colors.
- Organize notes into notebooks and capture a quick note from any Blackboard page using a customizable shortcut.
- Export Study Note data as JSON for backup or CSV for use in a spreadsheet.
- Create your own sidebar destinations, then hide or restore the group without deleting its settings.

## Version
- v2.11.0 <br> Date: 2026/08/15

## Changes

v2.11.0 - 2026/08/15

- Add up to six user-defined external sidebar destinations.
- Add a settings switch plus name, HTTP(S) URL, and Google Material icon controls for each destination.
- Validate unsafe or malformed URLs, update open Blackboard pages when settings change, and keep saved links when the feature is disabled.
- Bundle the Material Icons font locally for the options-page picker and keep long sidebars scrollable.

v2.10.5 - 2026/08/15

- Add a Google Material Symbols footer control for switching between the full Dashboard navigation and a 64px icon rail.
- Keep the panel control at the bottom, remove its visible text label, and hide Blackboard's legal footer links while collapsed.
-  Match Blackboard's official Courses-page To Do panel to every extension Appearance while preserving its overdue status colors.
- Prevent incomplete keyboard events or legacy shortcut settings from producing a `toLowerCase()` extension error.

v2.10.4 - 2026/08/13

- Preserve the main navigation edge shadow while Study Note is open.

See [CHANGELOG.md](CHANGELOG.md) for the complete maintained change history.

## Screenshots

- Extension Settings Page <br>
![figure-2](shotscreen/settings.jpg)

- Single Course <br>
![figure-3](shotscreen/single_course.jpg)
