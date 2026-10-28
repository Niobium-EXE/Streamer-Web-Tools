'use strict';
// Run after tools/assemble.py so this uses the real upstream filter core.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
for (const file of ['filter/core.js', 'unicode_filter.js']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}
const core = context.LiveProfanityCore;
assert.ok(core?.__swtUnicodeMatching, 'Unicode adapter was not installed');
function testRule(options, input, expected) {
  const settings = core.sanitizeSettings({
    enabled: true, defaultReplacement: 'blocked',
    surroundBrackets: false, preserveCase: false,
    words: [{word: 'cock', replacement: 'blocked', match: 'exact', ...options}],
    allowlist: [], disabledSites: []
  });
  const before = JSON.stringify(settings);
  const output = core.filterText(input, core.compileRules(settings), settings);
  assert.equal(output, expected, JSON.stringify({input, options}));
  assert.equal(JSON.stringify(settings), before, 'Compilation must not mutate saved rules');
}
testRule({}, 'cock', 'blocked');
testRule({}, 'cocķ', 'blocked');
testRule({}, 'cocḱ', 'blocked');
testRule({}, 'coсķ', 'blocked'); // Cyrillic es
testRule({}, 'сoсķ', 'blocked'); // two Cyrillic es characters
testRule({}, 'ｃｏｃｋ', 'blocked');
testRule({}, '𝒄𝒐𝒄𝒌', 'blocked');
testRule({}, 'coc\u0327k', 'blocked'); // decomposed cedilla
testRule({}, 'cocktail and peacock', 'cocktail and peacock');
testRule({}, 'mycock', 'mycock');
testRule({repeated:true}, 'cooock', 'blocked');
testRule({separators:true}, 'c o c ķ', 'blocked');
testRule({match:'partial'}, 'mycocķthing', 'myblockedthing');
testRule({match:'whole'}, 'mycocķthing', 'blocked');
testRule({caseSensitive:true}, 'COCK', 'COCK');
testRule({caseSensitive:true}, 'cocķ', 'blocked');
testRule({enabled:false}, 'cocķ', 'cocķ');

const regexSettings=core.sanitizeSettings({
  enabled:true, preserveCase:false, surroundBrackets:false, 
  words:[{word:'c.ck',replacement:'regexp',match:'regex'}]
});
assert.equal(core.filterText('cick',core.compileRules(regexSettings),regexSettings),'regexp');

const originalSettings=core.sanitizeSettings({
  enabled:false, defaultReplacement:'custom', surroundBrackets:false,
  allowlist:['example'], disabledSites:['example.org'],
  words:[{word:'cock',replacement:'something',match:'exact'}]
});
core.compileRules(originalSettings);
assert.equal(originalSettings.enabled, false);
assert.equal(originalSettings.defaultReplacement, 'custom');
assert.equal(originalSettings.words[0].replacement, 'something');
assert.equal(originalSettings.disabledSites[0], 'example.org');
console.log('Streamer Web Tools Unicode filter tests passed.');
