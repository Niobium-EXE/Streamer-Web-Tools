'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({console});
for (const file of ['filter/core.js','unicode_filter.js','filter_mode.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const Core = context.LiveProfanityCore;
assert.ok(Core.__swtSiteModes, 'Site mode adapter should be installed');
assert.equal(Core.defaultSettings().siteListMode,'blacklist');
assert.equal(Core.sanitizeSettings({}).siteListMode,'blacklist');
assert.equal(Core.sanitizeSettings({siteListMode:'whitelist'}).siteListMode,'whitelist');

// Existing word-list mode must not accidentally censor every unlisted word.
const original = Core.sanitizeSettings({
  filterMode:'whitelist', // obsolete v1.3.0 property is ignored
  enabled:true, defaultReplacement:'blocked', preserveCase:false,
  surroundBrackets:false,
  words:[{id:'saved',word:'cock',replacement:'COVERED',match:'exact'}],
  disabledSites:['example.com']
});
assert.equal(original.siteListMode,'blacklist');
assert.equal(original.words[0].id,'saved');
assert.equal(Core.filterText('hello cocķ world',Core.compileRules(original),original),
  'hello COVERED world');
assert.equal(Core.filterText('hello world',Core.compileRules(original),original),
  'hello world');
assert.equal(Core.isSiteDisabled(original,'example.com'),true);
assert.equal(Core.isSiteDisabled(original,'sub.example.com'),true);
assert.equal(Core.isSiteDisabled(original,'other.com'),false);
assert.equal(Core.isSiteDisabled(original,'fakeexample.com'),false);
assert.equal(Core.isSiteDisabled(original,''),true);

// Change only where the filter operates; never modify words or replacements.
const allowOnly = Core.sanitizeSettings({...original,siteListMode:'whitelist'});
assert.equal(allowOnly.siteListMode,'whitelist');
assert.equal(Core.isSiteDisabled(allowOnly,'example.com'),false);
assert.equal(Core.isSiteDisabled(allowOnly,'sub.example.com'),false);
assert.equal(Core.isSiteDisabled(allowOnly,'other.com'),true);
assert.equal(Core.isSiteDisabled(allowOnly,'fakeexample.com'),true);
assert.equal(Core.filterText('hello cocķ world',Core.compileRules(allowOnly),allowOnly),
  'hello COVERED world');
assert.equal(allowOnly.words[0].id,'saved');
assert.equal(allowOnly.words[0].replacement,'COVERED');
assert.equal(allowOnly.disabledSites[0],'example.com');

const emptyWhitelist=Core.sanitizeSettings({
  siteListMode:'whitelist',disabledSites:[],words:[{word:'cock'}]
});
assert.equal(Core.isSiteDisabled(emptyWhitelist,'example.com'),true);
const emptyBlacklist=Core.sanitizeSettings({
  siteListMode:'blacklist',disabledSites:[],words:[{word:'cock'}]
});
assert.equal(Core.isSiteDisabled(emptyBlacklist,'example.com'),false);

console.log('Site blacklist/whitelist, Unicode word filters, and settings migration passed.');
