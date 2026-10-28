# Streamer Web Tools

[![License: Non-Commercial](https://img.shields.io/badge/License-Non--Commercial-red)](LICENSE)

**Commercial use is prohibited without written permission from Niobium-EXE.**

> **License: non-commercial use only.** Streamer Web Tools may not be used to earn money, including monetized streaming, sponsored content, paid work, or resale, without prior written permission from Niobium-EXE. See the [LICENSE](LICENSE) and the [in-extension Terms of Use](terms.html). The project's public GitHub source and free Chrome Web Store download do not grant commercial-use rights.

A Chromium / Opera GX extension combining:

- **Live Web Filter** (from [Live Profanity Filter](https://github.com/Niobium-EXE/Live-Profanity-Filter-Chromium-Extension))
- **Site Rule Runner** (from [Site Rule Runner](https://github.com/Niobium-EXE/Site-Rule-Runner))
- **Save as MHTML** (from [One-Click MHTML](https://github.com/Niobium-EXE/One-Click-MHTML))

The toolbar button **always opens the combined popup**. Right-click the webpage and choose **Save page as MHTML**; you can also right-click the extension's icon and choose the same command. There is also a Save as MHTML button within the popup.

## Unicode lookalike filtering (v1.2.2)

Existing and newly added **Web Filter** words automatically match common lookalike characters, including Latin accented variants such as `ķ`, decomposed accents, fullwidth/styled Latin letters, and common Cyrillic/Greek lookalikes. For example, a saved rule for `cock` also matches `cocķ` and `coсķ` (the latter uses Cyrillic `с`). There is no setting to migrate and no stored filters are overwritten or reset. Existing per-rule options (exact, partial, whole, repeated letters, separators, and case sensitivity) continue to work. Advanced regex rules are kept unchanged to preserve their regex semantics.

## Import and export

The popup has separate JSON import/export buttons for **Filter** and **Site Rules**. Import is a **merge**, not a full replacement:

- Matching filter words (case-insensitive, normalized Unicode) are updated with the imported entry, keeping their existing identifiers.
- Nonmatching filter words remain untouched. Nonmatching imported words are added.
- Filter allowlist and disabled-site lists are unioned without erasing existing entries.
- The current filter enabled state and global preferences are preserved.
- CSS rule duplicates match an existing rule by ID, or website plus title (when titled), or website plus selector.
- JavaScript rule duplicates match by ID, or website plus title (when titled), or website plus exact code.
- Updated site rules keep their original IDs; unrelated rules are never deleted.
- Imports from the original extensions, and Advanced Profanity Filter's JSON format, are supported.

**Storage migration:** Chrome stores settings separately for each extension ID. Export your settings from the old standalone extensions and import them into Streamer Web Tools before removing the old copies. Imports don't erase unrelated entries.

## Developer installation

This source repository uses an **assembly step** to fetch the upstream extension modules. Open **Actions → Build unpacked extension → Run workflow**, download the `Streamer-Web-Tools-unpacked` artifact, extract it, and select its folder from Chrome / Opera **Extensions → Developer mode → Load unpacked**. Alternatively, run `python tools/assemble.py` locally, then load this repository folder. The repository root alone is not installable until the assembly step has run.

## Packed .crx releases and auto updates

When a GitHub release tag such as `v1.2.1` matches `manifest.json`'s version, the `Publish CRX` workflow can publish the signed CRX and a GitHub Pages `update.xml`.

1. Generate a **permanent, dedicated** CRX signing key (never commit it or reuse another extension's signing key).
2. Set GitHub Actions repository secret `CRX_PRIVATE_KEY_B64` to the **base64-encoded PEM private key**. A new key produces a different extension ID and separate storage.
3. Enable GitHub Pages with **GitHub Actions** as the publishing source and allow the `github-pages` environment.
4. Publish a release with tag `v1.2.1`. The workflow signs `Streamer-Web-Tools-v1.2.1.crx`, uploads an unpacked ZIP and publishes the update manifest.

**Important:** Chrome/Opera can restrict installation and automatic updating of extensions outside their official stores. Signed self-hosted CRX automatic updates work only where browser policy/installation methods permit them. A .crx release is not a way to bypass browser extension security restrictions.

## Permissions

Site rules and live filtering need access to matched websites. MHTML uses `pageCapture`, `downloads`, `offscreen` and a context menu. JavaScript rules need the browser's User Scripts permission; depending on your Chromium version, **Allow User Scripts** must be enabled manually.

The original repositories remain independent. The build process fetches and adapts copies into `filter/`, `rules/`, and `mhtml/`. Original extension sources are not committed to this repository. For repeatable releases, pin upstream commits in the assembly script before publishing.

## Full settings page

Use Open full settings in the popup. The options page is based on the original Site Rule Runner layout, with CSS Rules, JavaScript Rules, Web Filter, and Import & Export tabs. Each tool retains its own editable configuration, with merge-on-import for both tools.

## Chrome Web Store

A dedicated **Build Chrome Web Store ZIP** GitHub Actions workflow assembles the three upstream modules and creates a sanitized store upload ZIP (independent of the CRX signing secret). The optional release-time **chrome-web-store** job can upload new versions of an existing listing through the Google Chrome Web Store API v2 once configured.

For initial submission and automated update setup, read [CHROME-WEB-STORE.md](CHROME-WEB-STORE.md). The extension-specific [privacy policy](PRIVACY.md) provides a public URL for the Store listing. A store listing, screenshots, Google developer account, service account and actual Google review must be completed by the developer.

## Custom store and toolbar icon

To install new branding in both the GitHub and Chrome Web Store builds, create a `branding/` folder in this repository and upload `icon16.png`, `icon32.png`, `icon48.png`, and `icon128.png` to it. The assembly script automatically selects this complete set for the manifest, and the Store ZIP packager includes the folder. Do not upload the entire icon-pack ZIP to the root; upload its individual PNG files to `branding/`. The new artwork is only integrated into the binary *after* those files are committed and a new ZIP is built.
