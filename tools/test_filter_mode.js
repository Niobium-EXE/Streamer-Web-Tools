'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root=path.resolve(__dirname,'..');
const context=vm.createContext({console});
for (const file of ['filter/core.js','unicode_filter.js','filter_mode.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const Core=context.LiveProfanityCore;
assert.equal(Core.defaultSettings().filterMode,'blacklist');
assert.equal(Core.sanitizeSettings({words:[{word:'hello'}]}).filterMode,'blacklist');
assert.equal(Core.sanitizeSettings({filterMode:'whitelist'}).filterMode,'whitelist');

function filter(text, options={}) {
  const settings=Core.sanitizeSettings({
    enabled:true, filterMode:options.mode||'blacklist',
    defaultReplacement:'blocked', preserveCase:false, surroundBrackets:false,
    words:[{word:'hello',replacement:'YES',match:'exact'},
           {word:'cock',replacement:'NO',match:'exact'}],
    allowlist:options.allowlist||[],
    ...options
  });
  return Core.filterText(text,Core.compileRules(settings),settings);
}

assert.equal(filter('hello world'),'YES world');
assert.equal(filter('hello world',{mode:'whitelist'}),'hello blocked');
assert.equal(filter('hello, world! 123',{mode:'whitelist'}),'hello, blocked! blocked');
assert.equal(filter('cock cocķ coсķ',{mode:'whitelist'}),'cock cocķ coсķ');
assert.equal(filter('cock cocķ coсķ',{mode:'blacklist'}),'NO NO NO');
assert.equal(filter('hello helloing',{mode:'whitelist'}),'hello blocked');
assert.equal(filter('hello world',{mode:'whitelist',allowlist:['world']}),'hello world');
assert.equal(filter('hello world',{mode:'whitelist',enabled:false}),'hello world');
assert.equal(filter('HELLO WORLD',{mode:'whitelist',preserveCase:true,defaultReplacement:'hidden'}),'HELLO HIDDEN');
assert.equal(filter('hello world',{mode:'whitelist',surroundBrackets:true}),'hello [blocked]');

// Whitelist rules deliberately ignore per-word replacement values.
assert.equal(filter('hello',{mode:'whitelist'}),'hello');
// A mode switch must not mutate persisted settings or rule IDs.
const settings=Core.sanitizeSettings({
  filterMode:'whitelist',enabled:true,defaultReplacement:'xx',
  words:[{id:'saved-1',word:'hello',replacement:'KEEP-ME',match:'exact'}]
});
const before=JSON.stringify(settings);
assert.equal(Core.filterText('hello world',Core.compileRules(settings),settings),
             'hello [xx]');
assert.equal(JSON.stringify(settings),before);
assert.equal(settings.words[0].id,'saved-1');
settings.filterMode='blacklist';
assert.equal(Core.filterText('hello world',Core.compileRules(settings),settings),
             '[KEEP-ME] world');
assert.equal(Core.sanitizeSettings(settings).filterMode,'blacklist');
console.log('Blacklist / whitelist and saved settings tests passed.');
