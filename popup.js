'use strict';
const $=id=>document.getElementById(id);
document.querySelectorAll('nav button').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b===button));
 document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id===button.dataset.view));
}));
$('save').addEventListener('click',async()=>{
 $('save').disabled=true;
 try{const r=await chrome.runtime.sendMessage({type:'swt-save-mhtml'});if(!r?.ok)throw Error(r?.error||'Could not save page');}
 catch(e){$('status').textContent=e.message;document.querySelector('[data-view="backup"]').click();}
 finally{$('save').disabled=false;}
});
function download(name,data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
$('exportFilter').addEventListener('click',async()=>{const s=await chrome.storage.local.get('settings');download('streamer-web-filter.json',s.settings||LiveProfanityCore.defaultSettings());});
$('exportRules').addEventListener('click',async()=>download('streamer-site-rules.json',await SiteRuleUtils.loadConfig()));
let target='';
$('importFilter').addEventListener('click',()=>{target='filter';$('file').click();});
$('importRules').addEventListener('click',()=>{target='rules';$('file').click();});
$('file').addEventListener('change',async()=>{
 const f=$('file').files?.[0];$('file').value='';if(!f)return;
 try{
  const raw=JSON.parse(await f.text());
  if(target==='filter'){
   const old=LiveProfanityCore.sanitizeSettings((await chrome.storage.local.get('settings')).settings);
   const incoming=LiveProfanityCore.sanitizeSettings(raw.settings||raw);
   const existing=new Map(old.words.map((w,i)=>[w.word.normalize('NFKC').toLocaleLowerCase(),i]));
   let added=0,updated=0;
   for(const word of incoming.words){
    const key=word.word.normalize('NFKC').toLocaleLowerCase();if(!key)continue;
    if(existing.has(key)){const i=existing.get(key);old.words[i]={...word,id:old.words[i].id};updated++;}
    else{existing.set(key,old.words.length);old.words.push(word);added++;}
   }
   for(const prop of ['allowlist','disabledSites']){
    const seen=new Set(old[prop].map(x=>String(x).normalize('NFKC').toLowerCase()));
    for(const x of incoming[prop]){const key=String(x).normalize('NFKC').toLowerCase();if(!seen.has(key)){old[prop].push(x);seen.add(key);}}
   }
   old.revision+=1;
   const response=await chrome.runtime.sendMessage({type:'lpf:mutate-settings',operation:{kind:'replaceSettings',settings:old}});
   if(!response?.ok)throw Error(response?.error||'Could not import');
   $('status').textContent=`Filter: ${added} added, ${updated} updated. Other entries preserved.`;
  } else {
   const saved=await SiteRuleUtils.loadConfig();
   const incoming=SiteRuleUtils.normalizeConfig(raw.config||raw);
   let added=0,updated=0;
   for(const collection of ['cssRules','jsRules']){
    const kind=collection==='cssRules'?'css':'js';
    for(const rule of incoming[collection]){
     const same=(a,b)=>a.pattern.trim().toLowerCase()===b.pattern.trim().toLowerCase();
     const i=saved[collection].findIndex(old=>old.id===rule.id || (same(old,rule) && ((old.title&&rule.title&&old.title.trim().toLowerCase()===rule.title.trim().toLowerCase()) || (kind==='css'?old.selector===rule.selector:old.code===rule.code))));
     if(i>=0){saved[collection][i]={...rule,id:saved[collection][i].id};updated++;}
     else{const idExists=[...saved.cssRules,...saved.jsRules].some(x=>x.id===rule.id);saved[collection].push({...rule,id:idExists?SiteRuleUtils.makeId(kind):rule.id});added++;}
    }
   }
   await SiteRuleUtils.saveConfig(saved);
   $('status').textContent=`Site Rules: ${added} added, ${updated} updated. Other entries preserved.`;
  }
 }catch(e){$('status').textContent='Import failed: '+e.message;}
});
