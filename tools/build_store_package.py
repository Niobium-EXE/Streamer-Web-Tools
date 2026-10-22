#!/usr/bin/env python3
"""Create a clean Chrome Web Store ZIP from an assembled Streamer Web Tools tree.
First run python tools/assemble.py. Never include CRX private keys or update.xml.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import zipfile

ROOT_FILES = (
    "background.js", "popup.html", "popup.css", "popup.js",
    "options.html", "options.css", "options.js", "options-shell.js",
    "sidebar.html", "filter-embedded.css", "terms.html", "terms.css"
)
RUNTIME_DIRS = ("filter", "rules", "mhtml", "shared")
OPTIONAL_DIRS = ("branding",)
ALLOWED = {".html", ".js", ".css", ".json", ".png", ".jpg", ".jpeg",
           ".webp", ".svg", ".woff", ".woff2", ".gif", ".wasm"}

def included_files(repo: Path):
    for name in ROOT_FILES:
        path = repo / name
        if not path.is_file():
            raise FileNotFoundError(f"Required extension file missing: {name}")
        yield name, path
    for dirname in RUNTIME_DIRS + tuple(d for d in OPTIONAL_DIRS if (repo / d).is_dir()):
        folder = repo / dirname
        if not folder.is_dir():
            raise FileNotFoundError(
                f"Missing assembled folder {dirname}/. Run python tools/assemble.py first.")
        for path in sorted(folder.rglob("*")):
            if not path.is_file() or path.is_symlink():
                continue
            relative = path.relative_to(repo)
            if (path.suffix.lower() not in ALLOWED
                    or path.name.startswith(".")
                    or path.name == "manifest.json"
                    or "__pycache__" in relative.parts):
                continue
            yield relative.as_posix(), path

def references(manifest):
    result = [manifest["background"]["service_worker"],
              manifest["action"]["default_popup"], manifest["options_page"]]
    result += list(manifest.get("icons", {}).values())
    result += list(manifest.get("action", {}).get("default_icon", {}).values())
    sidebar = manifest.get("sidebar_action", {})
    if sidebar:
        result.append(sidebar["default_panel"])
        icons = sidebar.get("default_icon", {})
        result += list(icons.values()) if isinstance(icons, dict) else [icons]
    for spec in manifest.get("content_scripts", []):
        result += spec.get("js", []) + spec.get("css", [])
    return result

def build(repo: Path, output: Path, tag: str = ""):
    repo = repo.resolve()
    manifest = json.loads((repo / "manifest.json").read_text("utf-8"))
    version = str(manifest.get("version", ""))
    if not re.fullmatch(r"\d+(?:\.\d+){0,3}", version):
        raise ValueError("Invalid manifest version.")
    if tag and tag != "v" + version:
        raise ValueError(f"Release tag {tag!r} does not match manifest v{version}.")
    if manifest.get("manifest_version") != 3:
        raise ValueError("Expected a Manifest V3 extension.")
    manifest.pop("key", None)
    manifest.pop("update_url", None)
    files = dict(included_files(repo))
    for target in references(manifest):
        if target not in files:
            raise ValueError(f"Manifest references missing runtime file: {target}")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
        for name, path in sorted(files.items()):
            archive.write(path, name)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise RuntimeError("Store ZIP integrity check failed.")
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise RuntimeError("Store ZIP contains duplicate files.")
        check = json.loads(archive.read("manifest.json"))
        assert check["version"] == version
        assert "key" not in check and "update_url" not in check
        for name in names:
            if name.endswith((".pem", ".key", ".py", ".zip", ".crx")):
                raise RuntimeError(f"Unsafe file in Web Store package: {name}")
    print(f"Created {output} (v{version}, {len(names)} runtime files).")
    return output

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--tag", default="")
    args = parser.parse_args()
    build(args.repo, args.out, args.tag)
