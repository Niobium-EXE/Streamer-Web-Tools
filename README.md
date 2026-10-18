# Streamer Web Tools

A Chromium / Opera GX extension combining:

- **Live Web Filter** (from [Live Profanity Filter](https://github.com/Niobium-EXE/Live-Profanity-Filter-Chromium-Extension))
- **Site Rule Runner** (from [Site Rule Runner](https://github.com/Niobium-EXE/Site-Rule-Runner))
- **Save as MHTML** (from [One-Click MHTML](https://github.com/Niobium-EXE/One-Click-MHTML))

The toolbar button **always opens the combined popup**. Right-click the webpage and choose **Save page as MHTML**; you can also right-click the extension's icon and choose the same command. There is also a Save as MHTML button within the popup.

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

When a GitHub release tag such as `v1.1.0` matches `manifest.json`'s version, the `Publish CRX` workflow can publish the signed CRX and a GitHub Pages `update.xml`.

1. Generate a **permanent, dedicated** CRX signing key (never commit it or reuse another extension's signing key).
2. Set GitHub Actions repository secret `CRX_PRIVATE_KEY_B64` to the **base64-encoded PEM private key**. A new key produces a different extension ID and separate storage.
3. Enable GitHub Pages with **GitHub Actions** as the publishing source and allow the `github-pages` environment.
4. Publish a release with tag `v1.1.0`. The workflow signs `Streamer-Web-Tools-v1.1.0.crx`, uploads an unpacked ZIP and publishes the update manifest.

**Important:** Chrome/Opera can restrict installation and automatic updating of extensions outside their official stores. Signed self-hosted CRX automatic updates work only where browser policy/installation methods permit them. A .crx release is not a way to bypass browser extension security restrictions.

## Permissions

Site rules and live filtering need access to matched websites. MHTML uses `pageCapture`, `downloads`, `offscreen` and a context menu. JavaScript rules need the browser's User Scripts permission; depending on your Chromium version, **Allow User Scripts** must be enabled manually.

The original repositories remain independent. The build process fetches and adapts copies into `filter/`, `rules/`, and `mhtml/`. Original extension sources are not committed to this repository. For repeatable releases, pin upstream commits in the assembly script before publishing.
