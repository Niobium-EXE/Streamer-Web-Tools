# Chrome Web Store publishing — Streamer Web Tools

## Build your first store ZIP

1. Open **Actions → Build Chrome Web Store ZIP → Run workflow**.
2. Open the completed workflow run, download the **Chrome-Web-Store-ZIP** artifact, and extract it.
3. Upload the enclosed `Streamer-Web-Tools-v1.2.0-Chrome-Web-Store.zip` to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Do not upload the GitHub `.crx` or the source archive.
4. Fill in the store listing, privacy declarations, permission justifications, and screenshots. Include a public privacy policy URL, such as `https://github.com/Niobium-EXE/Streamer-Web-Tools/blob/main/PRIVACY.md`.
5. Submit for Google's review. Approval and timing are determined by Google.

The ZIP includes the assembled `filter/`, `rules/`, `mhtml/` and `shared/` runtime code. It deliberately excludes `update_url`, `key`, workflow files, signing materials, and build tooling. The package must be built *after* `python tools/assemble.py` to include those components.

## One-time automatic-update publishing setup

Google's API can update an **existing** listing. It does not replace the dashboard's initial listing creation/review.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project; enable the **Chrome Web Store API**.
2. Create a **service account** and enable its access in the Chrome Web Store Developer Dashboard's publisher/account service-account settings. Securely create its JSON credentials, if permitted by your Google Cloud policy. Keep this private.
3. On the GitHub repository, open **Settings → Secrets and variables → Actions**.
4. Create secret `CWS_SERVICE_ACCOUNT_JSON` with the complete service-account JSON. Never commit it.
5. Create variables `CWS_PUBLISHER_ID` and `CWS_EXTENSION_ID`, taken from your Chrome Web Store publisher and **existing Chrome Web Store item**. Do not use the unpacked/CRX extension ID unless it actually is the store ID.
6. After your store listing has been initially published, bump the version in `manifest.json` and publish a matching GitHub release tag like `v1.2.1`. The optional `chrome-web-store` job assembles a clean ZIP and submits the new version to Google after the CRX release job succeeds.

**Note:** This automated path currently depends on the `packed-release` job succeeding, including its separate `CRX_PRIVATE_KEY_B64` signing secret and GitHub Pages setup. You can always build and manually upload the Web Store ZIP independently using the first section instead.

## Privacy and permission justifications

Use the actual extension behavior in your store disclosure; do not claim that it never reads page contents. Suggested descriptions:

- **Single purpose:** Provide user-controlled webpage filtering, site-specific CSS/JavaScript automation, and manual one-click webpage archiving in a unified toolbox.
- **Broad host access (`<all_urls>`):** Required because the user can apply live text filtering and their own site rules on arbitrary websites. The text processing occurs locally.
- **`storage`:** Save filter rules, site rules, and user preferences locally.
- **`scripting` / `userScripts`:** Repair/reinject filtering and execute explicitly user-created scripts on matching pages. User Scripts availability depends on Chromium version and browser permissions.
- **`tabs` / `activeTab`:** Detect the current site's URL, report matching rules, and target the tab the user selects for page capture.
- **`pageCapture` / `downloads` / `offscreen`:** Capture MHTML when requested and download an archive preserving its `.mhtml` extension.
- **`contextMenus`:** Provide right-click Save page as MHTML and Add selection to filter.

Review the permissions for possible minimization before the first store submission. Do not disclose personal browsing data or server collection that the software does not actually perform.

## Required listing materials

The extension includes 16-, 32-, 48-, and 128-pixel icons through its assembled Site Rule Runner icon assets. Prepare genuine store screenshots and the store's promotional assets and listing text according to the latest Chrome Web Store Dashboard requirements. This repository does not fabricate screenshots or imply a Google review has passed.

## What happens to saved settings?

The Chrome Web Store install may have a different extension ID than the developer or GitHub CRX copy. Extension storage does **not** automatically transfer between IDs. Export both the Web Filter configuration and Site Rules configuration, then import them separately to the Store installation. The merge importer preserves unrelated existing entries.

## Security notes

Do not place Google JSON credentials or CRX private keys in the repository. Do not upload a signed GitHub CRX to the Web Store. Keep private user-authored scripts out of public GitHub issues and store screenshots. The Web Store may reject broad permissions, remote code, unsafe user-script behavior, or other policy violations; successful ZIP generation does not guarantee approval.

Official Google documentation:
- https://developer.chrome.com/docs/webstore/using-api
- https://developer.chrome.com/docs/webstore/service-accounts
- https://developer.chrome.com/docs/webstore/publish
