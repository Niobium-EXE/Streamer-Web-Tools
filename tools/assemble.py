#!/usr/bin/env python3
"""Vendor the three upstream extensions into one unpacked extension tree.
Run from the repo root: python tools/assemble.py
The source copies are refreshed from upstream's main branches at build time.
"""
from pathlib import Path
import io, json, re, shutil, urllib.request, zipfile

ROOT=Path(__file__).resolve().parents[1]
SOURCES={
  "filter":"Live-Profanity-Filter-Chromium-Extension",
  "rules":"Site-Rule-Runner",
  "mhtml":"One-Click-MHTML",
}
def replace_once(content, old, new, name):
    if content.count(old)!=1:
        raise RuntimeError(f"{name}: expected one occurrence, found {content.count(old)}: {old[:60]}")
    return content.replace(old,new)
def download_source(folder, repo):
    url=f"https://github.com/Niobium-EXE/{repo}/archive/refs/heads/main.zip"
    req=urllib.request.Request(url,headers={"User-Agent":"Streamer-Web-Tools-Builder"})
    with urllib.request.urlopen(req,timeout=60) as res:
        data=res.read()
    with zipfile.ZipFile(io.BytesIO(data)) as zip_file:
        for entry in zip_file.infolist():
            path=Path(*Path(entry.filename).parts[1:])
            if not path.parts or entry.is_dir() or ".." in path.parts:
                continue
            if path.suffix.lower() not in {".js",".html",".css",".png",".json",".svg",".woff",".woff2"}:
                continue
            dest=ROOT/folder/path
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(zip_file.read(entry))
def patch(folder,path,func):
    target=ROOT/folder/path
    original=target.read_text(encoding="utf-8")
    patched=func(original)
    target.write_text(patched,encoding="utf-8")

def filter_background(s):
    s=replace_once(s,"importScripts('core.js');","importScripts('filter/core.js');","filter/background.js")
    start=s.index("  chrome.contextMenus.removeAll(() => {")
    end=s.index("\n});",start)
    # Keep the onInstalled initialization, but centralize context menus.
    s=s[:start]+s[end:]
    return s

def mhtml_background(s):
    s=replace_once(s,"const OFFSCREEN_DOCUMENT = 'offscreen.html';","const OFFSCREEN_DOCUMENT = 'mhtml/offscreen.html';","mhtml/background.js")
    start="chrome.action.onClicked.addListener(async (tab) => {"
    s=replace_once(s,start,"async function saveMhtml(tab) {","mhtml/background.js")
    anchor="\n});\n\nchrome.runtime.onMessage.addListener((message) => {"
    s=replace_once(s,anchor,"\n}\n\nchrome.runtime.onMessage.addListener((message) => {","mhtml/background.js")
    # Prevent MHTML status titles from changing the shared popup title.
    s=s.replace("await chrome.action.setTitle({ tabId, title: 'Saving page as MHTML…' });","")
    s=s.replace("await chrome.action.setTitle({ tabId, title: 'Could not save this page as MHTML' });","")
    s=s.replace("await chrome.action.setTitle({ tabId, title: 'Save this page as MHTML' });","")
    return s

def rules_background(s):
    s=replace_once(s,'importScripts("shared.js");','importScripts("rules/shared.js");',"rules/background.js")
    # This extension has its own toolbar icon and title, but the combined toolbar belongs to Streamer Web Tools.
    s=re.sub(r"    await chrome.action.setIcon\(\{ tabId, path: active \? ACTIVE_ICONS : INACTIVE_ICONS \}\);\s*await chrome.action.setTitle\(\{\s*tabId,\s*title: active \? \"Site Rule Runner — rules active on this site\" : \"Site Rule Runner — no active rules on this site\"\s*\}\);","",s,count=1)
    return s

def pop_filter(s):
    return replace_once(s,"files: ['core.js', 'content.js']","files: ['filter/core.js', 'filter/content.js']","filter/popup.js") if False else s.replace("files: ['core.js', 'content.js']","files: ['filter/core.js', 'filter/content.js']").replace("chrome.runtime.openOptionsPage()","chrome.runtime.openOptionsPage()")
def pop_rules(s):
    return s.replace("chrome.runtime.openOptionsPage()","chrome.runtime.openOptionsPage()")
def filter_sidebar(s):
    return s.replace("chrome.runtime.getURL('options.html?source=opera-sidebar')","chrome.runtime.getURL('options.html?source=opera-sidebar')")

def main():
    for folder, repo in SOURCES.items():
        print(f"Downloading {repo}")
        target=ROOT/folder
        if target.exists():shutil.rmtree(target)
        download_source(folder,repo)
    patch("filter","background.js",filter_background)
    patch("filter","popup.js",pop_filter)
    patch("filter","sidebar.js",filter_sidebar)
    patch("filter","options.js",lambda s:s.replace("await mutate({ kind: 'replaceSettings', settings: imported });","await SWTBackup.mergeFilter(imported); await getSettings();"))
    patch("filter","options.html",lambda s:s.replace('<script src="options.js"></script>','<script src="../rules/shared.js"></script><script src="../shared/backup.js"></script><script src="options.js"></script>'))
    patch("rules","background.js",rules_background)
    patch("rules","popup.js",pop_rules)
    patch("mhtml","background.js",mhtml_background)
    # Optionally allow disabling all site rules without destructively modifying individual rule toggles.
    # The normal CSS and JS editors remain unchanged.
    print("Combined extension assembled at",ROOT)
if __name__=="__main__":main()
