'use strict';
importScripts('filter/background.js', 'rules/background.js', 'mhtml/background.js');
function installMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({id:'swt-save-mhtml',title:'Save page as MHTML',contexts:['page','action']});
    chrome.contextMenus.create({id:'lpf-add-selection',title:'Add selection to Web Filter',contexts:['selection']});
  });
}
chrome.runtime.onInstalled.addListener(installMenus);
chrome.runtime.onStartup.addListener(installMenus);
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'swt-save-mhtml') saveMhtml(tab);
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== 'swt-save-mhtml') return;
  chrome.tabs.query({active:true,currentWindow:true})
    .then(([tab]) => tab?.id ? saveMhtml(tab) : Promise.reject(new Error('No active tab')))
    .then(() => sendResponse({ok:true}), error => sendResponse({ok:false,error:String(error)}));
  return true;
});
