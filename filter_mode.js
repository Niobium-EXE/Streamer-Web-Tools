/* Filter mode support. Blacklist is the default for existing installations.
 * Whitelist preserves words matched by enabled rules and masks other word tokens.
 * All processing is local and the user's saved word list remains unchanged.
 */
(() => {
  'use strict';
  const Core = globalThis.LiveProfanityCore;
  if (!Core || Core.__swtFilterModes) return;

  const oldDefaults = Core.defaultSettings;
  const oldSanitize = Core.sanitizeSettings;
  const oldFilter = Core.filterText;
  Core.defaultSettings = (...args) => ({ ...oldDefaults(...args), filterMode: 'blacklist' });
  Core.sanitizeSettings = (raw) => ({
    ...oldSanitize(raw),
    filterMode: raw?.filterMode === 'whitelist' ? 'whitelist' : 'blacklist'
  });

  const tokenPattern = /[\p{L}\p{N}][\p{L}\p{M}\p{N}_'’]*/gu;
  const cachedAllowlist = new WeakMap();

  function getAllowlistPatterns(settings) {
    if (cachedAllowlist.has(settings)) return cachedAllowlist.get(settings);
    const words = (settings.allowlist || []).filter(Boolean).map(word =>
      Core.normalizeWord({ word, match: 'exact', enabled: true })
    );
    const patterns = Core.compileRules({ words });
    cachedAllowlist.set(settings, patterns);
    return patterns;
  }

  function protectedRanges(text, rules) {
    const ranges = [];
    for (const rule of rules) {
      if (!rule.regex) continue;
      const re = new RegExp(rule.regex.source, rule.regex.flags.includes('g')
        ? rule.regex.flags : rule.regex.flags + 'g');
      let result;
      while ((result = re.exec(text)) !== null) {
        if (result[0].length) ranges.push([result.index, result.index + result[0].length]);
        else re.lastIndex += 1;
      }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const range of ranges) {
      if (!merged.length || merged[merged.length - 1][1] < range[0]) merged.push(range);
      else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], range[1]);
    }
    return merged;
  }

  function preserveCase(original, replacement) {
    if (!replacement || !original) return replacement;
    if (original.toUpperCase() === original && original.toLowerCase() !== original)
      return replacement.toUpperCase();
    const first = original[0];
    if (first && first.toUpperCase() === first && first.toLowerCase() !== first)
      return replacement[0].toUpperCase() + replacement.slice(1);
    return replacement;
  }

  Core.filterText = function withFilterMode(text, compiledRules, settings) {
    if (settings?.filterMode !== 'whitelist') return oldFilter(text, compiledRules, settings);
    if (!settings.enabled || !text) return text;

    // In whitelist mode rule matches mean "keep", including Unicode lookalikes
    // and user-authored regex. The separate allowlist also remains protected.
    const ranges = protectedRanges(text,
      [...compiledRules, ...getAllowlistPatterns(settings)]);
    const defaultReplacement = String(settings.defaultReplacement || 'censored');
    let rangeIndex = 0;
    let last = 0;
    let result = '';
    tokenPattern.lastIndex = 0;
    for (const match of text.matchAll(tokenPattern)) {
      const start = match.index;
      const end = start + match[0].length;
      while (rangeIndex < ranges.length && ranges[rangeIndex][1] <= start) rangeIndex++;
      const allowed = rangeIndex < ranges.length
        && ranges[rangeIndex][0] < end && ranges[rangeIndex][1] > start;
      result += text.slice(last, start);
      if (allowed) result += match[0];
      else {
        const replacement = settings.preserveCase
          ? preserveCase(match[0], defaultReplacement) : defaultReplacement;
        result += settings.surroundBrackets ? '[' + replacement + ']' : replacement;
      }
      last = end;
    }
    return result + text.slice(last);
  };

  Object.defineProperty(Core, '__swtFilterModes', { value: true });
})();
