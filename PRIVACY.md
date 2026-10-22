# Privacy Policy — Streamer Web Tools

**Effective date:** October 22, 2026  
**Developer:** Niobium-EXE  
**Extension:** Streamer Web Tools

## 1. Overview

Streamer Web Tools is a Chromium browser extension that helps users adjust how websites appear and create local copies of webpages. It includes a live text filter, user-defined CSS/JavaScript site rules, and an MHTML page saver.

The extension processes certain information *inside the user's browser* to provide these features. The developer does not operate a backend service for receiving or storing users' webpage contents, browsing histories, custom rules, or archived pages.

## 2. Information processed and why

**Webpage text and content.** The live filter reads rendered webpage text to identify words or phrases chosen by the user and replace them on the displayed page. This processing occurs locally. The filter does not create a separate archive of all the original webpage text.

**Website addresses.** The extension examines the address or hostname of open webpages to determine which saved rules apply, whether filtering is disabled on the current website, and which tab the user wants to archive. It does not maintain a developer-accessible browsing-history database.

**User-created settings and code.** The extension saves filtered words, replacements, allowlists, excluded websites, CSS selectors, JavaScript code, matching website patterns, rule titles, enabled states, and related preferences. These are entered or imported by the user.

**Webpage archives.** When the user selects Save page as MHTML, the browser captures the current page and resources available to its capture function and downloads an `.mhtml` file. The archive may include personal information, message text, or other private content present in the page. The extension uses a temporary local download helper to create the file; it does not upload the archive to the developer.

**Imported and exported files.** The extension reads configuration files only when selected by the user. It creates configuration exports at the user's request. Existing unrelated rules are retained when merging imported settings, subject to the importer's duplicate-detection rules.

## 3. Storage, retention and deletion

Settings and rules are saved in the browser's local extension storage and remain until the user changes or deletes them, removes the extension, or the browser clears that storage. They are not separately encrypted by the extension; the security of local data also depends on the user's device and browser profile.

Users can edit or delete saved rules in the extension interface. Files downloaded or exported to the user's device are outside the extension's storage; users must remove those files themselves. Disabling a rule does not delete it.

## 4. Data sharing and third parties

The extension does not send processed webpage text, saved settings, custom site rules, or captured MHTML files to a developer-controlled server. The developer does not sell this data, share it with advertisers or data brokers, or use it for targeted advertising or profiling.

**User-authored JavaScript:** Site Rule Runner can execute JavaScript written or imported by the user on matching websites. That code may read content from those websites or make network requests, depending on what it does and what browser security restrictions permit. The extension developer does not control the destinations or data handling of user-authored scripts. Users should import or run only scripts they trust.

**User-controlled sharing:** If a user shares an exported configuration or MHTML archive, its contents are disclosed to the recipients they choose. Saved MHTML files may include resource URLs or links to third-party sites.

**Browser and update providers:** The browser handles ordinary webpage requests, downloads, and Chrome Web Store updates. Where browser policies support separate self-hosted CRX installations, GitHub Pages may serve an update manifest. Browser vendors, GitHub and websites visited by the user may process ordinary network connection information according to their own privacy practices. No saved filter settings, custom scripts or archived pages are intentionally included in those update requests.

## 5. Permissions

The extension requests access to webpages so it can filter rendered text and apply website-specific rules locally. It uses browser storage for preferences; tab and scripting permissions to identify pages and apply features; the User Scripts API for user-authored JavaScript; context-menu permissions for right-click actions; and page-capture, offscreen and download permissions to save MHTML archives. The permissions are used for the disclosed features.

## 6. Children's privacy

Streamer Web Tools is not specifically designed for children. It does not knowingly operate an account-registration system or collect information about children for the developer.

## 7. Chrome Web Store Limited Use disclosure

The use of information received from Google APIs adheres to the **Chrome Web Store User Data Policy, including the Limited Use requirements**. User data is used only to provide or improve the disclosed functions; it is not sold, transferred for personalized advertising, or made available for routine human review by the developer.

## 8. Changes and contact

This policy may be updated if the extension's functionality or data practices change. An updated version will be posted here with a new effective date.

Questions can be reported through [Streamer Web Tools — GitHub Issues](https://github.com/Niobium-EXE/Streamer-Web-Tools/issues). GitHub Issues are public; please do not post private website content, configuration secrets, or archived messages there.
