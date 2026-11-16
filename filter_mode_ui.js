/* Filter mode control for the full Web Filter settings page. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const section = document.createElement('section');
  section.className = 'swt-mode-settings panel';
  section.innerHTML = [
    '<div class="swt-mode-row">',
    '<div><h2>Filtering mode</h2><p class="subtle">Choose what your word list means.</p></div>',
    '<label for="swtFilterMode">Mode',
    '<select id="swtFilterMode"><option value="blacklist">Blacklist</option>',
    '<option value="whitelist">Whitelist</option></select></label></div>',
    '<p id="swtModeHint" class="subtle" aria-live="polite"></p>',
    '<details class="swt-mode-help"><summary>What is the difference?</summary>',
    '<p><strong>Blacklist:</strong> replaces the words you add, leaving other words alone.</p>',
    '<p><strong>Whitelist:</strong> leaves the words you add untouched and replaces other words with your default replacement. Individual word replacements are ignored in this mode. Your saved words are not deleted when switching.</p>',
    '</details>'
  ].join('');
  hero.insertAdjacentElement('afterend', section);
  const select = document.querySelector('#swtFilterMode');
  const hint = document.querySelector('#swtModeHint');
  const explanations = {
    blacklist: 'Blacklist: only words on your list are replaced.',
    whitelist: 'Whitelist: words on your list are kept; all other words are replaced. This can change most of a page.'
  };
  const update = mode => {
    const value = mode === 'whitelist' ? mode : 'blacklist';
    if (document.activeElement !== select) select.value = value;
    hint.textContent = explanations[value];
  };
  chrome.runtime.sendMessage({type:'lpf:get-settings'}).then(result => {
    if (result?.ok) update(result.settings?.filterMode);
  }).catch(err => { hint.textContent = 'Could not load filter mode: ' + err.message; });
  select.addEventListener('change', async () => {
    const next = select.value;
    hint.textContent = 'Saving…';
    try {
      const response = await chrome.runtime.sendMessage({
        type:'lpf:mutate-settings',
        operation:{kind:'patch',patch:{filterMode:next}}
      });
      if (!response?.ok) throw Error(response?.error || 'Could not save mode');
      update(response.settings.filterMode);
    } catch (error) {
      hint.textContent = error.message;
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) update(changes.settings.newValue?.filterMode);
  });
})();
