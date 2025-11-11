const queue=[];
let showing=false;

function renderContainer(){ if(document.getElementById('toastHost')) return; const div=document.createElement('div'); div.id='toastHost'; div.setAttribute('aria-live','polite'); div.className='fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm'; document.body.appendChild(div);} 

function showNext(){ if(showing) return; const item=queue.shift(); if(!item) return; showing=true; const host=document.getElementById('toastHost'); if(!host) return; const el=document.createElement('div'); const type=item.type||'info'; const colors={ success:'bg-green-600', error:'bg-red-600', warn:'bg-yellow-600', info:'bg-gray-800' }; const iconMap={ success:'✅', error:'⚠️', warn:'⚠️', info:'ℹ️' }; el.className=`toast opacity-0 translate-y-2 transition-all text-white px-4 py-3 rounded shadow-lg flex items-start gap-3 pointer-events-auto ${colors[type]||colors.info}`; el.innerHTML=`<span class="text-xl leading-none">${iconMap[type]||iconMap.info}</span><div class="flex-1 text-sm leading-snug">${item.message}</div><button aria-label="Đóng" class="text-white/80 hover:text-white ml-2" data-toast-close>&times;</button>`; host.appendChild(el); requestAnimationFrame(()=>{ el.classList.remove('opacity-0','translate-y-2'); el.classList.add('opacity-100','translate-y-0'); }); const remove=()=>{ el.classList.add('opacity-0','translate-y-2'); setTimeout(()=>{ el.remove(); showing=false; showNext(); },180); }; const timeout=setTimeout(remove, item.duration||3500); el.addEventListener('click',e=>{ if(e.target.closest('[data-toast-close]')){ clearTimeout(timeout); remove(); }}); }

export function notify(message, opts={}){ renderContainer(); queue.push({ message, ...opts }); showNext(); }

export function notifySuccess(msg,opts={}){ notify(msg,{...opts,type:'success'}); }
export function notifyError(msg,opts={}){ notify(msg,{...opts,type:'error'}); }
export function notifyWarn(msg,opts={}){ notify(msg,{...opts,type:'warn'}); }
export function notifyInfo(msg,opts={}){ notify(msg,{...opts,type:'info'}); }
