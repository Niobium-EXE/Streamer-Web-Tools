/* Streamer Web Tools site filter access control.
 * Blacklist (default): filter everywhere except the domains in disabledSites.
 * Whitelist: filter only domains in disabledSites.
 * Does not change word matching, replacements, or saved word rules.
 */
(() => {
  'use strict';
  const Core = globalThis.LiveProfanityCore;
  if (!Core || Core.__swtSiteModes) return;
  const originalDefaults = Core.defaultSettings;
  const originalSanitize = Core.sanitizeSettings;
  const originalDisabled = Core.isSiteDisabled;

  Core.defaultSettings = (...args) => ({
    ...originalDefaults(...args),
    siteListMode: 'blacklist'
  });
  Core.sanitizeSettings = raw => ({
    ...originalSanitize(raw),
    siteListMode: raw?.siteListMode === 'whitelist' ? 'whitelist' : 'blacklist'
  });

  // The mistaken v1.3.0 word-filter filterMode is intentionally ignored.
  Core.isSiteDisabled = (settings, hostname) => {
    const host = Core.normalizeHost(hostname);
    if (!host) return true;
    const matches = Core.disabledSiteMatches(settings, host).length > 0;
    return settings?.siteListMode === 'whitelist' ? !matches : originalDisabled(settings, host);
  };
  Object.defineProperty(Core, '__swtSiteModes', {value:true});
})();
