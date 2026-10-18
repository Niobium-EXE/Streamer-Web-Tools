'use strict';
(() => {
 const frame=document.getElementById('filterSettingsFrame');
 const status=document.getElementById('backupStatus');
 const resize=()=>{try{const doc=frame.contentDocument;if(doc)frame.style.height=Math.max(600,doc.documentElement.scrollHeight+32)+'px';}catch(_){}};
 frame.addEventListener('load',()=>{
  resize();
  try{new ResizeObserver(resize).observe(frame.contentDocument.documentElement);}catch(_){}
 });
 document.getElementById('filterExport').addEventListener('click',async()=>{
  SWTBackup.download('streamer-web-filter.json',(await chrome.storage.local.get('settings')).settings||LiveProfanityCore.defaultSettings());
  status.textContent='Filter backup downloaded.';
 });
 document.getElementById('filterImport').addEventListener('click',()=>document.getElementById('filterFile').click());
 document.getElementById('filterFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{const counts=await SWTBackup.mergeFilter(JSON.parse(await file.text()));status.textContent=`Web Filter: ${counts.added} added, ${counts.updated} updated. Existing unrelated entries preserved.`;}
  catch(error){status.textContent='Filter import failed: '+error.message;}
 });
 const hash=location.hash.slice(1);if(['css','js','filter','data'].includes(hash))showSection(hash);
 document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>{history.replaceState(null,'','#'+n.dataset.section);}));
})();
