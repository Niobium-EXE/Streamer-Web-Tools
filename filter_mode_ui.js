/* Full settings: site inclusion/exclusion mode, next to the domain list. */
(() => {
  'use strict';
  const textarea = document.getElementById('disabledSites');
  if (!textarea) return;
  const container = textarea.closest('div');
  const heading = container?.querySelector('h2');
  if (heading) heading.textContent = 'Website filtering';
  const originalDescription = container?.querySelector('p.subtle');
  if (originalDescription) originalDescription.textContent = 'One domain per line. Subdomains are included. Your saved websites stay the same when switching modes.';
  const widget = document.createElement('div');
  widget.className = 'swt-site-settings';
  widget.innerHTML = [
    '<label for="swtSiteMode">Website list mode</label>',
    '<select id="swtSiteMode">',
    '<option value="blacklist">Blacklist — exclude listed sites</option>',
    '<option value="whitelist">Whitelist — only filter listed sites</option>',
    '</select>',
    '<p id="swtSiteHint" class="subtle" aria-live="polite"></p>',
    '<details class="swt-mode-help"><summary>What is the difference?</summary>',
    '<p><strong>Blacklist:</strong> filter all websites except the sites listed below.</p>',
    '<p><strong>Whitelist:</strong> filter only the sites listed below. Every other site stays unfiltered.</p>',
    '<p>Both modes use the same word filters and replacements. Switching modes never deletes your saved words or websites.</p>',
    '</details>',
  ].join('');
  textarea.insertAdjacentElement('beforebegin', widget);

  const selector = document.getElementById('swtSiteMode');
  const hint = document.getElementById('swtSiteHint');
  let activeMode = 'blacklist';
  const hints = {
    blacklist: 'Blacklist: the listed websites will NOT be filtered.',
    whitelist: 'Whitelist: ONLY the listed websites will be filtered. An empty list filters nowhere.'
  };
  function render(mode) {
    activeMode = mode === 'whitelist' ? 'whitelist' : 'blacklist';
    if (document.activeElement !== selector) selector.value = activeMode;
    hint.textContent = hints[activeMode];
  }
  chrome.runtime.sendMessage({type:'lpf:get-settings'}).then(reply => {
    if (!reply?.ok) throw Error(reply?.error || 'Unable to load site settings');
    render(reply.settings?.siteListMode);
  }).catch(error => { hint.textContent = error.message; });

  selector.addEventListener('change', async () => {
    const prior = activeMode;
    selector.disabled = true;
    hint.textContent = 'Saving website filtering mode…';
    try {
      const reply = await chrome.runtime.sendMessage({
        type:'lpf:mutate-settings',
        operation: {kind:'patch',patch:{siteListMode:selector.value}}
      });
      if (!reply?.ok) throw Error(reply?.error || 'Unable to save site mode');
      render(reply.settings.siteListMode);
    } catch (error) {
      render(prior);
      hint.textContent = 'Could not save: ' + error.message;
    } finally { selector.disabled = false; }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) render(changes.settings.newValue?.siteListMode);
  });
})();
