# Chrome Web Store — Listing copy and dashboard answers

Prepared: October 22, 2026. Intended for Streamer Web Tools v1.2.0. **Review these answers against the actual uploaded ZIP and any later code changes before certifying them.** The Chrome Web Store reviewer may require further disclosure or code changes.

## Store listing — Product details

**Name:** Streamer Web Tools

**Suggested category:** Productivity (Developer Tools is an alternative if your audience is primarily CSS and JavaScript users).

**Language:** English.

**Short description (if requested):**
Customize webpage text, apply your own CSS and JavaScript rules, and save pages as MHTML.

**Detailed description (paste into the Store listing):**

Streamer Web Tools gives you a convenient set of browser controls for customizing webpages and saving local copies, whether you're livestreaming, working, or just browsing.

**Web Filter**
- Replace words and phrases as webpages update, without refreshing.
- Set custom replacements, matching options, and site exclusions.
- Manage your filters from a popup or full settings page.

**Site Rule Runner**
- Hide unwanted webpage elements with CSS selectors.
- Create website-specific JavaScript rules.
- Name, search, edit, enable, and disable your rules.
- Test your own JavaScript on matching open tabs where supported by your browser.

**Save as MHTML**
- Right-click a webpage and choose Save page as MHTML.
- Archive the current page and resources supported by Chromium's MHTML capture.
- Save a single local .mhtml file for later viewing.

**Easy management**
- Separate filter and site-rule configuration imports and exports.
- Imports add new entries, update matches, and preserve unrelated rules.
- A compact toolbar popup and a dedicated full-page settings interface.

**Privacy:** The built-in filter and site-rule matching work locally in your browser. The extension does not send your saved rules, processed webpage text, or MHTML archives to a developer-controlled server. Custom JavaScript you create or import may make its own network requests; only run scripts you trust.

**Compatibility:** Chromium-based browsers with the necessary APIs. Some JavaScript rule features require User Scripts permission and compatible browser settings.

## Non-commercial use notice — add to the public Store description

**NON-COMMERCIAL USE ONLY.** Streamer Web Tools is free for personal, non-commercial use. Selling, reselling, bundling for a fee, or using the extension for monetized livestreams, sponsored content, advertising-supported productions, paid services, or other revenue-generating activity requires prior written permission from Niobium-EXE. See the Terms of Use: https://github.com/Niobium-EXE/Streamer-Web-Tools/blob/main/LICENSE

Add a brief version of this notice near the bottom of the Chrome Web Store description, above the privacy disclosure, so users see the restriction before installing. Also leave the full Terms of Use inside the extension (already linked from its settings and popup).

## Privacy practices — single-purpose description

Provide user-controlled webpage customization and local webpage preservation in one browser interface, including text replacement, site-specific CSS/JavaScript rules, and user-initiated MHTML saving.

**Review warning:** Google's single-purpose policy may treat filtering, scripting, and archiving as separate purposes even with this shared focus. Do not claim approval is guaranteed; consider separate Web Store listings if Google rejects the bundle.

## Permissions justification

**storage**
Stores user-configured filtered words, replacement settings, allowlists, disabled websites, CSS/JavaScript rules, and preferences locally so they persist between browser sessions.

**tabs**
Identifies the selected tab and its URL to display matching website rules, recover filtering on open tabs, run user-authored scripts on matching tabs, and target the page the user chooses to save.

**activeTab**
Provides access to the actively selected page for user-invoked actions, especially saving that page as an MHTML archive.

**contextMenus**
Creates the Save page as MHTML right-click action and lets users add selected text to their filter.

**scripting**
Injects or restores the extension's packaged filtering scripts on matching tabs so live filtering continues working without requiring a full page refresh.

**userScripts**
Registers and executes JavaScript written or imported by the user on websites matching the user's own rules. This is an optional user-authored scripting feature; code is not downloaded from a developer code server.

**downloads**
Saves the MHTML archive selected by the user to their device, and preserves the .mhtml filename extension.

**offscreen**
Uses an offscreen browser document to create a temporary Blob URL for the locally generated MHTML download, because the service worker cannot create it directly.

**pageCapture**
Captures the current webpage as an MHTML archive only when the user explicitly requests it.

**Host permissions (<all_urls>)**
The user can choose arbitrary websites for word filtering, CSS hiding, and custom JavaScript rules. Access to webpage content and URLs is needed to identify matches and apply those settings locally. The permission does not enable a developer-run browsing-history service.

## Remote code / code execution declaration

The extension does not fetch remote developer-hosted JavaScript for execution. Its packaged logic is in the extension ZIP. A separate, explicitly user-controlled feature executes JavaScript the user writes or imports using Chrome's User Scripts API. Explain this distinction in any remote-code field or reviewer notes. If your uploaded code changes to fetch/execute externally hosted logic, revisit this answer before submission.

## Data usage declarations

**Website content:** Processed locally for visible word filtering, CSS/JavaScript rules and user-initiated MHTML capture. MHTML files can contain private webpage content, but are downloaded locally rather than uploaded to the developer.

**Website addresses / browsing activity:** The current tab URL is read to match rules and select pages. The extension does not intentionally build a developer-accessible history or transmit URL logs to a developer server.

**User-provided content:** Word lists, replacement settings, filters, custom JavaScript and website patterns are saved locally. Optional imports and exports are user-directed.

**Personal/sensitive content:** A user-selected MHTML archive or user-authored script can include personal communications, authentication-related page content, or other sensitive data present on a site. Do not claim the extension is technically incapable of encountering this content. It does not intentionally collect those categories for developer access.

**Sharing / selling / advertising:** The bundled code does not transmit users' webpage text, custom rules or archives to developer-controlled services, and does not sell such information or use it for ad targeting. A user's own scripts or voluntary sharing of downloaded files can disclose information to other parties.

Certify Limited Use statements only if the final version and your actual operational practices support them. Dashboard checkbox terminology can change; review the current descriptions instead of automatically choosing "no data" based only on local processing.

## Additional URLs and account settings

**Privacy policy URL**
https://github.com/Niobium-EXE/Streamer-Web-Tools/blob/main/PRIVACY.md

**Homepage / website**
https://github.com/Niobium-EXE/Streamer-Web-Tools

**Support / contact page**
https://github.com/Niobium-EXE/Streamer-Web-Tools/issues

**Distribution**
Choose Public if you want people to find it through Chrome Web Store search. Choose Unlisted if you only want to share the direct listing URL. Do not set visibility based on whether your GitHub repository is public.

**Primary language**
English.

**Developer contact email**
Enter an email address you control and monitor. Do not publish a fabricated address.

## Required images / submission checklist

- 128 × 128 PNG icon, including transparent margin; this icon should also be embedded in the uploaded extension ZIP for consistency.
- At least one genuine screenshot of the extension working at 1280 × 800 or 640 × 400, showing the actual settings page or popup rather than a fictional interface.
- Small promotional tile, 440 × 280 PNG or JPEG, where required by the Dashboard.
- Optional marquee promotional image, 1400 × 560.
- Store listing details, Privacy practices responses, privacy URL, developer profile, and distribution preferences.
- Test the exact store ZIP, confirm all intended features work, and check permissions and single-purpose policy compliance before submitting.

The Chrome Web Store team determines whether the bundle complies with review policies.

## Applying the new artwork to the packaged extension

Download the 128px store PNG and companion icon pack from the ChatGPT conversation. Place `icon16.png`, `icon32.png`, `icon48.png`, and `icon128.png` inside a `branding/` folder in your GitHub repository. Commit the files, rerun the store ZIP workflow, and use that ZIP for the Chrome Web Store submission. The manifest will automatically reference these icons when all four sizes are present. Otherwise the original Site Rule Runner icon is used.
