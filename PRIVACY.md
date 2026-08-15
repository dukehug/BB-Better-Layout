# Privacy Policy for BB Better Layout

Effective date: August 15, 2026

BB Better Layout (the "Extension") is an independent Chrome extension designed to improve the Blackboard Ultra interface. This Privacy Policy explains what information the Extension processes, how it is used, and whether it is shared.

## Information processed by the Extension

### Blackboard page content

The Extension reads limited content and interface elements on the supported Blackboard Ultra deployment, such as course titles, section numbers, navigation items, and page structure. This processing is necessary to create course banners, improve the course grid, build the side navigation, apply reading themes, provide keyboard navigation, and perform a user-requested Schedule import.

This information is processed locally in the user's browser. It is not stored by the developer, sent to a developer-operated server, sold, or used for advertising.

### User preferences

The Extension stores the user's selected reading theme, customized keyboard shortcuts, and custom-link settings (enabled state, names, URLs, and icon choices) using the `chrome.storage.sync` API. If Chrome Sync is enabled, Google Chrome may synchronize these preferences between browsers signed in to the same Google account. An optional custom course cover image is resized in the browser and stored separately using `chrome.storage.local`, so it remains on the current device and is not uploaded by the Extension. The developer does not receive or have access to these preferences or images.

Users can change or reset these preferences from the Extension's options page. They can also remove locally stored Extension data by uninstalling the Extension or clearing Extension data in Chrome.

### Study Note data

If the user enables and uses Study Note, the Extension stores note titles, note content, notebook names, and created or modified timestamps in `chrome.storage.local`. Study Note data remains in the current Chrome profile and is not synchronized by the Extension or sent to a server. The user can export this data to a local JSON backup or CSV file. JSON and CSV backups are read locally only when the user explicitly selects a file to import.

### Schedule data

If the user enables Schedule, Blackboard course cards are read only after the user clicks Import on the Courses page. The Extension may then store course titles, course codes, instructor display names, meeting days and times, Room values, colors, and local teacher overrides in `chrome.storage.local`. Users may also create or edit timetable entries manually. Schedule data remains in the current Chrome profile and is not synchronized by the Extension or sent to a server.

## Information not collected

The Extension does not intentionally collect, store, or transmit:

- Student numbers, email addresses, or identity information outside instructor display names explicitly imported into Schedule
- Blackboard usernames, passwords, authentication tokens, or cookies
- Grades, assignment submissions, messages, or personal communications
- Financial, health, or location information
- Browsing history or activity outside the supported Blackboard Ultra deployment
- Analytics, advertising identifiers, or usage tracking data

## External services and links

The Extension loads the Google Material Icons stylesheet to display navigation icons. As a result, the browser may request icon-related resources from Google. Google may receive standard network information associated with that request, such as the user's IP address, browser information, and request metadata. This processing is governed by the Google Privacy Policy. The Extension developer does not receive this information.

The Extension provides optional user-defined external links as well as project links to GitHub and weekly.52hz.im. These websites operate independently and are governed by their own privacy policies. The Extension does not send Blackboard page content to these websites.

## Data sharing and sale

The developer does not sell, rent, share, or transfer user data to third parties. The Extension does not use user data for personalized advertising, creditworthiness, lending, or unrelated purposes. No developer or other person is given access to read a user's Blackboard content through the Extension.

## Data retention

Blackboard page content is processed temporarily while the relevant page is open and is not retained by the developer. Theme and keyboard-shortcut preferences remain in Chrome storage until the user resets them, clears Extension data, or uninstalls the Extension, subject to Chrome Sync behavior controlled by the user and Google. A custom course cover, Study Note data, and Schedule data remain in local Extension storage until the user removes them, clears Extension data, or uninstalls the Extension.

## Security

The Extension does not operate a server that receives Blackboard content or user preferences. All packaged executable code is included with the Extension. Connections to supported websites and external resources use HTTPS.

## Chrome Web Store Limited Use disclosure

The Extension's use of information received from Chrome APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. Information is used only to provide and improve the Extension's user-facing Blackboard layout, theme, navigation, Study Note, and Schedule features.

## Changes to this policy

This Privacy Policy may be updated if the Extension's functionality or data practices change. Material changes will be published with an updated effective date.

## Contact

Questions or privacy concerns may be submitted through the project's public support page:

https://github.com/dukehug/BB-Better-Layout/issues
