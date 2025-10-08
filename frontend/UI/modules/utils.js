export function openModal(id){ const el=document.getElementById(id); if(!el) return; el.classList.remove('hidden'); el.classList.add('flex'); }
export function closeModal(id){ const el=document.getElementById(id); if(!el) return; el.classList.add('hidden'); el.classList.remove('flex'); }
export function setTodayMin(id){ const el=document.getElementById(id); if(!el) return; el.min=new Date().toISOString().split('T')[0]; el.value=el.min; }
export function setTodayMinIn(selector){ document.querySelectorAll(selector).forEach(el=>{ el.min=new Date().toISOString().split('T')[0]; el.value=el.min; }); }
export function addDays(dateStr, days){ const d=new Date(dateStr); d.setDate(d.getDate()+days); return d.toISOString(); }
export function formatDate(dateStr){ const d=new Date(dateStr); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}/${mm}/${yyyy}`; }
export function initGlobalEscClose(ids){ document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ ids.forEach(closeModal); } }); }
export function initOutsideClickClose(ids){ window.addEventListener('click',e=>{ ids.forEach(id=>{ const el=document.getElementById(id); if(el && !el.classList.contains('hidden') && e.target===el){ closeModal(id); } }); }); }
export function debounce(fn, wait=300){ let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args), wait); }; }
