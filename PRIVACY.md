# Privacy Policy — Streamer Web Tools

**Effective:** October 18, 2026  
**Developer:** Niobium-EXE

Streamer Web Tools combines a local webpage text filter, user-defined site rules, and a user-initiated MHTML archiver.

## Information processed
- **Web Filter:** Reads rendered text on webpages and locally replaces words or phrases according to user-created rules. It saves rules, preferences, allowlists, and excluded sites in browser extension storage.
- **Site Rule Runner:** Reads the current page URL to match user-created website patterns. It can hide matching elements and execute JavaScript supplied by the user on matching pages. Saved CSS/JavaScript rules are stored in browser extension storage.
- **MHTML saver:** When explicitly requested, Chrome's pageCapture API captures the current page, including resources that Chromium can archive. The resulting file is downloaded to the user's device.
- **Import/export:** Configuration JSON files are read only when selected by the user or downloaded at the user's request.

The extension's broad website permissions are needed for optional filtering and user-configured rules across arbitrary websites. The extension may encounter personal or sensitive content displayed on webpages because those features work locally within the browser.

## Storage and sharing
Settings and rules are stored locally in Chrome extension storage. The developer does not operate a server that receives or stores filtered webpage content, website browsing histories, rule configuration, or exported MHTML files. The extension does not sell user data, use it for ads, or transmit it to the developer.

The user may choose to export JSON settings or MHTML captures. Such files can contain sensitive information or page content; whoever receives a shared file may see its contents. MHTML archives can contain third-party resources and links that could make network requests when opened, depending on the browser.

## Network access
Filtering and site-rule matching do not require a developer-controlled network service. User-authored JavaScript rules can perform network operations if the browser and target webpage permit them; these actions are determined by the user-provided code, not by the extension developer. The browser may fetch normal page resources while pages are displayed or archived.

Chrome Web Store installations are updated by the browser's Chrome Web Store mechanism. Signed GitHub CRX builds may use the project's GitHub Pages update manifest where browser policy permits self-hosted installs and updates. GitHub and browser vendors may receive ordinary network-request information.

## Retention and deletion
Settings remain in browser storage until changed or removed by the user, the extension is uninstalled, or the browser clears them. Users can delete saved rules in the extension's options pages. Exported files must be removed separately by the user.

## User data and Limited Use
The extension uses browser data only to provide the filtering, rule execution, and page-saving functionality selected by the user. The developer does not use this information for advertising or data brokerage. Developer access to content processed locally is not provided by the extension.

## Changes and contact
Material changes to privacy practices will be described in updated versions of this policy. Report questions through [Streamer Web Tools GitHub Issues](https://github.com/Niobium-EXE/Streamer-Web-Tools/issues). Do not include private page contents or credentials in public issues.
