/* Streamer Web Tools Unicode lookalike matching adapter.
 * Runs after the original Live Profanity Filter core on every filtering page.
 * Adds no settings and does not touch chrome.storage: existing rules work as-is.
 * User-authored regex rules keep their original matching semantics.
 */
(() => {
  'use strict';
  const Core = globalThis.LiveProfanityCore;
  if (!Core || Core.__swtUnicodeMatching) return;

  // Normalized Latin variants cover e.g. ķ/ḱ/ｋ/𝓴. Explicit visual
  // confusables additionally cover common Cyrillic and Greek substitutions.
  const VISUAL = {
    a: 'аαɑ', b: 'Ььβϐ', c: 'сϲ', d: 'ԁ', e: 'еεϵ',
    f: 'ғ', g: 'ɡց', h: 'һη', i: 'іιɩ', j: 'ј', k: 'кκϰ',
    l: 'ⅼӏ', m: 'мμ', n: 'ո', o: 'оοօ', p: 'рρ',
    q: 'ԛ', r: 'г', s: 'ѕꜱ', t: 'тτ', u: 'υս',
    v: 'νѵ', w: 'ԝω', x: 'хχ', y: 'уү', z: 'ᴢ',
  };
  const extraUpper = {
    a: 'АΑ', b: 'ВΒ', c: 'СϹ', e: 'ЕΕ', h: 'НΗ', i: 'ІΙ',
    j: 'Ј', k: 'КΚ', m: 'МΜ', o: 'ОΟ', p: 'РΡ',
    s: 'Ѕ', t: 'ТΤ', x: 'ХΧ', y: 'УΥ', z: 'Ζ',
  };
  const lower = new Map();
  const upper = new Map();
  const back = new Map();
  for (let code = 97; code <= 122; code += 1) {
    const a = String.fromCharCode(code);
    lower.set(a, new Set([a]));
    upper.set(a, new Set([a.toUpperCase()]));
  }

  function register(character, base, capital) {
    if (!lower.has(base)) return;
    (capital ? upper : lower).get(base).add(character);
    back.set(character, base);
  }

  function registerCompatibility(start, end) {
    for (let code = start; code <= end; code += 1) {
      const ch = String.fromCodePoint(code);
      const expanded = ch.normalize('NFKD').replace(/\p{M}/gu, '');
      if (!/^[a-zA-Z]$/.test(expanded)) continue;
      register(ch, expanded.toLowerCase(), expanded === expanded.toUpperCase());
    }
  }
  // Latin-1, extended Latin, Latin additional, fullwidth and styled alphabets.
  for (const [start, end] of [
    [0x00c0, 0x024f], [0x1e00, 0x1eff], [0xff21, 0xff5a],
    [0x1d400, 0x1d7ff],
  ]) registerCompatibility(start, end);
  for (const [base, variants] of Object.entries(VISUAL)) {
    for (const ch of variants) register(ch, base, false);
  }
  for (const [base, variants] of Object.entries(extraUpper)) {
    for (const ch of variants) register(ch, base, true);
  }

  const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapeClass = value => value.replace(/[\\\]^\-]/g, '\\$&');
  const wordChar = '[\\p{L}\\p{N}\\p{M}_]';
  const extendedWordChar = '[\\p{L}\\p{N}\\p{M}_-]';

  function foldedBase(ch) {
    if (back.has(ch)) return back.get(ch);
    const decomposed = ch.normalize('NFKD').replace(/\p{M}/gu, '');
    return /^[a-z]$/i.test(decomposed) ? decomposed.toLowerCase() : null;
  }

  function unicodePhrase(rule) {
    const parts = [];
    for (const ch of rule.word) {
      // Combining accents in an entered word should match precomposed forms.
      if (/\p{M}/u.test(ch) && parts.length) continue;
      const base = foldedBase(ch);
      let expression;
      if (base) {
        const expanded = ch.normalize('NFKD').replace(/\p{M}/gu, '');
        const isUpper = expanded === expanded.toUpperCase();
        const available = rule.caseSensitive
          ? (isUpper ? upper.get(base) : lower.get(base))
          : new Set([...lower.get(base), ...upper.get(base)]);
        expression = '[' + [...available].map(escapeClass).join('') + ']\\p{M}*';
      } else {
        expression = escapeRegex(ch);
      }
      parts.push('(?:' + expression + ')' + (rule.repeated ? '+' : ''));
    }
    const separator = rule.separators ? '[-_ \\u200b\\u200c\\u200d\\u2060]*' : '';
    return parts.join(separator);
  }

  const originalCompileRules = Core.compileRules;
  Core.compileRules = function compileUnicodeAwareRules(settings) {
    return originalCompileRules(settings).map(rule => {
      if (rule.match === 'regex') return rule;
      try {
        const phrase = unicodePhrase(rule);
        let source = phrase;
        if (rule.match === 'exact') {
          source = '(?<!' + wordChar + ')' + phrase + '(?!' + wordChar + ')';
        } else if (rule.match === 'whole') {
          source = '(?<!' + wordChar + ')' + extendedWordChar + '*' + phrase +
            extendedWordChar + '*(?!' + wordChar + ')';
        }
        return { ...rule, regex: new RegExp(source, rule.caseSensitive ? 'gu' : 'giu') };
      } catch (error) {
        // A malformed word must not break the other rules.
        return { ...rule, regex: rule.regex, unicodeError: error.message };
      }
    });
  };
  Object.defineProperty(Core, '__swtUnicodeMatching', { value: true });
})();
