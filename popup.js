'use strict';

const $ = id => document.getElementById(id);
const Core = globalThis.LiveProfanityCore;
let settings = Core.defaultSettings();
let siteConfig = {cssRules:[], jsRules:[]};
let currentTab = null;
let hostname = '';
let importTarget = '';

const MODE_HELP = {
  blacklist: 'Blacklist: replace words on your list and leave other words unchanged.',
  whitelist: 'Whitelist: keep words on your list and replace other words with your default replacement. This can affect most of a page. Existing entries stay saved.'
};

function status(message) {
  const el = $('status');
  el.textContent = message;
  el.hidden = !message;
}

function selectTab(name) {
  document.querySelectorAll('.tab').forEach(button => {
    const selected = button.dataset.view === name;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('.pane').forEach(pane =>
    pane.classList.toggle('active', pane.id === name)
  );
  $('scrollArea').scrollTop = 0;
  status('');
}

async function loadFilter() {
  const response = await chrome.runtime.sendMessage({type:'lpf:get-settings'});
  if (!response?.ok) throw Error(response?.error || 'Cannot read Web Filter settings');
  settings = Core.sanitizeSettings(response.settings);
  renderFilter();
}
async function mutate(operation) {
  const response = await chrome.runtime.sendMessage({type:'lpf:mutate-settings',operation});
  if (!response?.ok) throw Error(response?.error || 'Cannot save Web Filter settings');
  settings = Core.sanitizeSettings(response.settings);
  renderFilter();
  return settings;
}
async function loadRules() {
  siteConfig = await SiteRuleUtils.loadConfig();
  renderRules();
}
function openSettings(section) {
  const path = chrome.runtime.getURL('options.html' + (section ? '#' + section : ''));
  chrome.tabs.create({url:path});
}

function renderFilter() {
  $('filterEnabled').checked = settings.enabled;
  const mode = settings.filterMode === 'whitelist' ? 'whitelist' : 'blacklist';
  $('filterMode').value = mode;
  $('modeHint').textContent = MODE_HELP[mode];
  $('newReplacement').disabled = mode === 'whitelist';
  $('newReplacement').title = mode === 'whitelist'
    ? 'Whitelist mode uses the default replacement for words that are not listed.' : '';
  $('filterCount').textContent = settings.words.length + ' saved';
  const disabled = hostname && Core.isSiteDisabled(settings, hostname);
  $('siteToggle').disabled = !hostname;
  $('siteToggle').textContent = !hostname ? 'Site exclusions unavailable here'
    : disabled ? 'Enable filtering on this site' : 'Disable filtering on this site';
  renderSavedWords();
}
function renderSavedWords() {
  const root = $('editRuleSelect');
  const chosen = root.value;
  root.replaceChildren();
  for (const rule of [...settings.words].sort((a,b)=>a.word.localeCompare(b.word))) {
    const option = document.createElement('option');
    option.value = rule.id;
    option.textContent = rule.word;
    root.append(option);
  }
  root.disabled = !settings.words.length;
  $('saveEdit').disabled = !settings.words.length;
  $('deleteEdit').disabled = !settings.words.length;
  if (settings.words.some(x=>x.id===chosen)) root.value = chosen;
  fillEditFields();
}
function fillEditFields() {
  const rule = settings.words.find(x=>x.id===$('editRuleSelect').value);
  if (!rule) {
    for(const id of ['editWord','editReplacement']) $(id).value='';
    return;
  }
  $('editWord').value = rule.word;
  $('editReplacement').value = rule.replacement;
  $('editMatch').value = rule.match;
  $('editEnabled').checked = rule.enabled;
  $('editRepeated').checked = rule.repeated;
  $('editSeparators').checked = rule.separators;
}

function ruleMatches(rule) {
  return currentTab?.url && SiteRuleUtils.patternMatchesUrl(rule.pattern,currentTab.url);
}
function renderRules() {
  const matches = [
    ...siteConfig.cssRules.filter(ruleMatches).map(rule=>({type:'css',rule})),
    ...siteConfig.jsRules.filter(ruleMatches).map(rule=>({type:'js',rule}))
  ];
  $('ruleCount').textContent = matches.length + ' matching';
  const root=$('siteRulesList');
  root.replaceChildren();
  if (!matches.length) {
    const empty=document.createElement('div');
    empty.className='empty';
    empty.textContent='No saved rules match this site.';
    root.append(empty);
    return;
  }
  for (const {type,rule} of matches) {
    const wrapper=document.createElement('div');
    wrapper.className='rule-item'+(rule.enabled?'':' off');
    const head=document.createElement('div');
    head.className='rule-head';
    const info=document.createElement('div');
    info.className='rule-info';
    const title=document.createElement('div');
    title.className='rule-title';
    title.textContent=rule.title|| (type==='css'?rule.selector:'JavaScript rule');
    const detail=document.createElement('div');
    detail.className='rule-meta';
    detail.textContent=(type==='css'?'CSS · ':'JS · ')+rule.pattern;
    info.append(title,detail);
    const actions=document.createElement('div');
    actions.className='rule-actions';
    const toggle=document.createElement('input');
    toggle.type='checkbox';
    toggle.checked=rule.enabled;
    toggle.title=rule.enabled?'Disable rule':'Enable rule';
    toggle.setAttribute('aria-label','Enable '+(rule.title||type+' rule'));
    toggle.addEventListener('change',async()=>{
      const next=toggle.checked;
      const list=type==='css'?siteConfig.cssRules:siteConfig.jsRules;
      const target=list.find(x=>x.id===rule.id);
      if(target)target.enabled=next;
      try {
        siteConfig=await SiteRuleUtils.saveConfig(siteConfig);
        status(next?'Rule enabled.':'Rule disabled.');
      } catch(error) { toggle.checked=!next;status(error.message); }
    });
    if(type==='js') {
      const run=document.createElement('button');
      run.type='button';
      run.className='btn';
      run.textContent='Run';
      run.title='Run this JavaScript now on matching tabs';
      run.addEventListener('click',async()=>{
        run.disabled=true;
        try {
          const result=await chrome.runtime.sendMessage({
            type:'srr-run-js-now', pattern:rule.pattern, code:rule.code
          });
          if(!result?.ok) throw Error(result?.message||'Could not run JavaScript');
          status(result.message||'Rule executed.');
        } catch(error){status(error.message);}
        finally{run.disabled=false;}
      });
      actions.append(run);
    }
    actions.append(toggle);
    head.append(info,actions);
    wrapper.append(head);
    root.append(wrapper);
  }
}

async function reconnectActivePage() {
  if (!currentTab?.id || !/^https?:/i.test(currentTab.url||'')) return;
  try {
    const pong=await chrome.tabs.sendMessage(currentTab.id,{type:'lpf:ping'});
    if(pong?.ok)return;
  } catch (_) {}
  try {
    await chrome.scripting.executeScript({
      target:{tabId:currentTab.id},
      files:['filter/core.js','unicode_filter.js','filter_mode.js','filter/content.js']
    });
  } catch (_) {
    // Protected pages and browser internal URLs are not injectable.
  }
}

async function run(action) {
  try { await action(); }
  catch(error) { status(error?.message||String(error)); }
}

function attachEvents() {
  document.querySelectorAll('.tab').forEach(button=>
    button.addEventListener('click',()=>selectTab(button.dataset.view))
  );
  document.querySelectorAll('[data-settings]').forEach(button=>
    button.addEventListener('click',()=>openSettings(button.dataset.settings))
  );
  $('openOptions').addEventListener('click',()=>chrome.runtime.openOptionsPage());

  $('filterEnabled').addEventListener('change',()=>run(async()=>{
    await mutate({kind:'patch',patch:{enabled:$('filterEnabled').checked}});
    status(settings.enabled?'Web Filter enabled.':'Web Filter disabled.');
  }));
  $('filterMode').addEventListener('change',()=>run(async()=>{
    await mutate({kind:'patch',patch:{filterMode:$('filterMode').value}});
    status(settings.filterMode==='whitelist'?'Whitelist enabled. Other words will be replaced.':'Blacklist enabled.');
  }));
  $('siteToggle').addEventListener('click',()=>run(async()=>{
    if(!hostname)return;
    await mutate({kind:'toggleSite',hostname});
    status(Core.isSiteDisabled(settings,hostname)?'Filtering disabled on this website.':'Filtering enabled on this website.');
  }));
  $('addFilterForm').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
    const word=$('newWord').value.trim();
    if(!word)return;
    if(settings.words.some(x=>x.word.normalize('NFKC').toLowerCase()===word.normalize('NFKC').toLowerCase()))
      throw Error('That word is already saved. Edit its existing entry instead.');
    await mutate({kind:'addWord',entry:{word,replacement:$('newReplacement').value,match:'exact'}});
    $('newWord').value='';$('newReplacement').value='';
    status('Word added. Open pages update automatically.');
  });});
  $('editRuleSelect').addEventListener('change',fillEditFields);
  $('saveEdit').addEventListener('click',()=>run(async()=>{
    const id=$('editRuleSelect').value;
    const word=$('editWord').value.trim();
    if(!id||!word)throw Error('A word or phrase is required.');
    if(settings.words.some(x=>x.id!==id&&x.word.toLowerCase()===word.toLowerCase()))
      throw Error('Another saved entry already uses that word.');
    await mutate({kind:'updateWord',id,patch:{
      word,replacement:$('editReplacement').value,match:$('editMatch').value,
      enabled:$('editEnabled').checked,repeated:$('editRepeated').checked,
      separators:$('editSeparators').checked
    }});
    status('Word updated.');
  }));
  $('deleteEdit').addEventListener('click',()=>run(async()=>{
    const id=$('editRuleSelect').value;
    if(!id)return;
    await mutate({kind:'deleteWord',id});
    status('Saved word removed.');
  }));

  $('ruleType').addEventListener('change',()=>{
    const js=$('ruleType').value==='js';
    $('ruleValueLabel').textContent=js?'JavaScript code':'CSS selector or class';
    $('ruleValue').placeholder=js?'// Code to run on this site':'.element-to-hide';
    $('ruleValue').rows=js?5:3;
  });
  $('addRuleForm').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
    const type=$('ruleType').value;
    const title=$('ruleName').value.trim();
    const pattern=$('ruleSite').value.trim();
    const value=$('ruleValue').value.trim();
    if(!pattern||!SiteRuleUtils.chromeMatchPattern(pattern))throw Error('Enter a valid website pattern.');
    if(!value)throw Error('Enter a CSS selector or JavaScript code.');
    if(type==='css'){
      siteConfig.cssRules.push({id:SiteRuleUtils.makeId('css'),title,pattern,
        selector:SiteRuleUtils.normalizeSelector(value),enabled:true});
    }else{
      siteConfig.jsRules.push({id:SiteRuleUtils.makeId('js'),title,pattern,
        code:value,enabled:true});
    }
    siteConfig=await SiteRuleUtils.saveConfig(siteConfig);
    $('ruleName').value='';$('ruleValue').value='';
    renderRules();
    status('Site rule saved.');
    $('quickAddRule').open=false;
  });});

  $('save').addEventListener('click',()=>run(async()=>{
    $('save').disabled=true;
    try {
      const result=await chrome.runtime.sendMessage({type:'swt-save-mhtml'});
      if(!result?.ok)throw Error(result?.error||'Unable to save this page');
      status('MHTML capture started. Check your Downloads.');
    }finally{$('save').disabled=false;}
  }));
  $('exportFilter').addEventListener('click',()=>run(async()=>{
    await loadFilter();
    SWTBackup.download('streamer-web-filter.json',settings);
    status('Web Filter config exported.');
  }));
  $('exportRules').addEventListener('click',()=>run(async()=>{
    await loadRules();
    SWTBackup.download('streamer-site-rules.json',siteConfig);
    status('Site Rules config exported.');
  }));
  $('importFilter').addEventListener('click',()=>{importTarget='filter';$('file').click();});
  $('importRules').addEventListener('click',()=>{importTarget='rules';$('file').click();});
  $('file').addEventListener('change',()=>{
    const file=$('file').files?.[0];
    $('file').value='';
    if(!file)return;
    run(async()=>{
      const raw=JSON.parse(await file.text());
      const counts=importTarget==='filter'
        ? await SWTBackup.mergeFilter(raw)
        : await SWTBackup.mergeRules(raw);
      if(importTarget==='filter')await loadFilter();
      else await loadRules();
      status((importTarget==='filter'?'Web Filter':'Site Rules')+
        ': '+counts.added+' added, '+counts.updated+' updated. Others preserved.');
    });
  });

  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local')return;
    if(changes.settings){
      settings=Core.sanitizeSettings(changes.settings.newValue);
      const active=document.activeElement;
      // Avoid clearing edit fields while the user types.
      if(!active || !active.closest?.('#filterEditPanel'))renderFilter();
      else {
        $('filterEnabled').checked=settings.enabled;
        $('filterMode').value=settings.filterMode;
      }
    }
    if(changes.cssRules||changes.jsRules)loadRules().catch(()=>{});
  });
}

async function init() {
  attachEvents();
  try {
    [currentTab]=await chrome.tabs.query({active:true,currentWindow:true});
    hostname=new URL(currentTab?.url||'').hostname;
  }catch(_){hostname='';}
  $('siteName').textContent=hostname||'Browser page';
  $('ruleSite').value=hostname||'';
  await Promise.all([loadFilter(),loadRules()]);
  reconnectActivePage().catch(()=>{});
}
init().catch(error=>status('Unable to initialize: '+error.message));
