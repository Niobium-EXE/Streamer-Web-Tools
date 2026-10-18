'use strict';
globalThis.SWTBackup = (() => {
 const core=()=>globalThis.LiveProfanityCore;
 const normal=x=>String(x||'').normalize('NFKC').toLocaleLowerCase();
 async function mergeFilter(raw){
  const source=raw?.settings||raw;
  if(!source || typeof source!=='object')throw Error('Invalid filter backup');
  let imported;
  if(Array.isArray(source.words)) imported=core().sanitizeSettings(source);
  else imported=core().parseApfConfig(JSON.stringify(source));
  const current=core().sanitizeSettings((await chrome.storage.local.get('settings')).settings);
  const indices=new Map(current.words.map((x,i)=>[normal(x.word),i]));
  let added=0,updated=0;
  for(const word of imported.words){
   const key=normal(word.word);if(!key)continue;
   if(indices.has(key)){const i=indices.get(key);current.words[i]={...word,id:current.words[i].id};updated++;}
   else{indices.set(key,current.words.length);current.words.push(word);added++;}
  }
  for(const key of ['allowlist','disabledSites']){
   const seen=new Set(current[key].map(normal));
   for(const entry of imported[key]||[]){const k=normal(entry);if(!seen.has(k)){current[key].push(entry);seen.add(k);}}
  }
  const r=await chrome.runtime.sendMessage({type:'lpf:mutate-settings',operation:{kind:'replaceSettings',settings:current}});
  if(!r?.ok)throw Error(r?.error||'Filter merge failed');
  return {added,updated};
 }
 async function mergeRules(raw){
  const imported=SiteRuleUtils.normalizeConfig(raw?.config||raw);
  const current=await SiteRuleUtils.loadConfig();
  let added=0,updated=0;
  for(const type of ['cssRules','jsRules']){
   for(const item of imported[type]){
    const i=current[type].findIndex(r=>r.id===item.id || (normal(r.pattern)===normal(item.pattern) && ((r.title&&item.title&&normal(r.title)===normal(item.title))||(type==='cssRules'?r.selector===item.selector:r.code===item.code))));
    if(i>=0){current[type][i]={...item,id:current[type][i].id};updated++;}
    else{const collision=[...current.cssRules,...current.jsRules].some(r=>r.id===item.id);current[type].push({...item,id:collision?SiteRuleUtils.makeId('import'):item.id});added++;}
   }
  }
  await SiteRuleUtils.saveConfig(current);return{added,updated};
 }
 function download(name,obj){
  const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 return {mergeFilter,mergeRules,download};
})();
