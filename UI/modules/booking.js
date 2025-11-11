import { openModal, closeModal, setTodayMinIn } from './utils.js';
import { notifyError, notifySuccess } from './notify.js';

let holdTimer=null; let holdDeadline=null; let selectedSeat=null; let currentLayout=null;

const layouts={
	'study-room':{ rows:5, cols:6, entrances:[{r:1,c:1}], shelves:[{r:1,c:6},{r:2,c:6}] },
	'computer':  { rows:4, cols:8, entrances:[{r:1,c:1},{r:4,c:8}], shelves:[{r:2,c:4},{r:3,c:5}] },
	'workshop':  { rows:6, cols:10, entrances:[{r:1,c:5}], shelves:[{r:1,c:9},{r:6,c:2}] }
};

// Mock existing reservations for demonstration
function getReserved(service,date,time){ return JSON.parse(localStorage.getItem('reservedSlots')||'{}')[`${service}|${date}|${time}`]||[]; }
function setReserved(service,date,time,arr){ const all=JSON.parse(localStorage.getItem('reservedSlots')||'{}'); all[`${service}|${date}|${time}`]=arr; localStorage.setItem('reservedSlots', JSON.stringify(all)); }

export function showBookingForm(){ setTodayMinIn('#bookingModal input[type="date"]'); openModal('bookingModal'); resetState(); }
export function closeBookingModal(){ clearHold(); closeModal('bookingModal'); }

function resetState(){ selectedSeat=null; currentLayout=null; document.getElementById('seatMapSection')?.classList.add('hidden'); document.getElementById('seatMapContainer').innerHTML=''; document.getElementById('bookingCountdown').textContent=''; }

function startHoldCountdown(){ clearHold(); holdDeadline = Date.now()+5*60*1000; updateCountdown(); holdTimer=setInterval(updateCountdown,1000); }
function clearHold(){ if(holdTimer){ clearInterval(holdTimer); holdTimer=null; } holdDeadline=null; document.getElementById('bookingCountdown').textContent=''; }
function updateCountdown(){ if(!holdDeadline){ return; } const left=holdDeadline-Date.now(); if(left<=0){ clearHold(); notifyError('Hết thời gian giữ chỗ (5 phút). Vui lòng đặt lại.'); closeBookingModal(); return; } const m=Math.floor(left/60000); const s=Math.floor((left%60000)/1000); document.getElementById('bookingCountdown').textContent=`Giữ chỗ còn: ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }

function renderSeatMap(){ const service=document.getElementById('bookingService').value; const date=document.getElementById('bookingDate').value; const time=document.getElementById('bookingTime').value; if(!service||!date||!time) return; const conf=layouts[service]; if(!conf) return; currentLayout=conf; const container=document.getElementById('seatMapContainer'); container.innerHTML=''; const reserved=getReserved(service,date,time); const grid=document.createElement('div'); grid.className='grid gap-2'; grid.style.gridTemplateColumns = `repeat(${conf.cols}, minmax(0, 1fr))`;
	for(let r=1;r<=conf.rows;r++){
		for(let c=1;c<=conf.cols;c++){
			const key=`${r}-${c}`;
			const isEntrance = conf.entrances.some(e=>e.r===r&&e.c===c);
			const isShelf = conf.shelves.some(e=>e.r===r&&e.c===c);
			const isReserved = reserved.includes(key);
			const seat=document.createElement('button');
			seat.type='button';
			seat.className='h-8 flex items-center justify-center text-xs rounded border transition select-none';
			seat.dataset.pos=key;
			if(isEntrance){
				seat.className+=' bg-green-100 border-green-500 cursor-default';
				seat.textContent='Cửa';
				seat.disabled=true;
			} else if(isShelf){
				seat.className+=' bg-amber-100 border-amber-500 cursor-default';
				seat.textContent='Kệ';
				seat.disabled=true;
			} else if(isReserved){
				seat.className+=' bg-red-200 border-red-500 cursor-not-allowed';
				seat.textContent='Đã đặt';
				seat.disabled=true;
			} else {
				seat.className+=' bg-white hover:bg-blue-50 border-gray-300';
				seat.textContent='Trống';
				seat.addEventListener('click',()=> selectSeat(seat));
			}
			grid.appendChild(seat);
		}
	}
	container.appendChild(grid);
}

function selectSeat(btn){ const buttons=[...document.querySelectorAll('#seatMapContainer button')]; buttons.forEach(b=>{ if(!b.disabled){ b.classList.remove('bg-blue-200','border-blue-500'); b.classList.add('bg-white','border-gray-300'); b.textContent='Trống'; }}); btn.classList.remove('bg-white','border-gray-300'); btn.classList.add('bg-blue-200','border-blue-500'); btn.textContent='Bạn chọn'; selectedSeat=btn.dataset.pos; startHoldCountdown(); }

// Policy enforcement helpers
function canCancel(booking){ const start=new Date(`${booking.date}T${booking.time}`); const now=new Date(); const diff=(start-now)/(1000*60*60); return diff>=24; }
function recordNoShow(userId){ const k='noShowCount'; const m=JSON.parse(localStorage.getItem('member')||'{}'); const key=`${userId||m.email||'anon'}:${k}`; const count=+(localStorage.getItem(key)||'0')+1; localStorage.setItem(key,String(count)); return count; }
function tooManyNoShows(userId){ const m=JSON.parse(localStorage.getItem('member')||'{}'); const key=`${userId||m.email||'anon'}:noShowCount`; return +(localStorage.getItem(key)||'0')>=3; }

export function handleBooking(e){ e.preventDefault(); const service=document.getElementById('bookingService').value; const date=document.getElementById('bookingDate').value; const time=document.getElementById('bookingTime').value; if(!service||!date||!time){ notifyError('Vui lòng chọn đầy đủ dịch vụ, ngày và giờ.'); return;} if(!selectedSeat){ notifyError('Vui lòng chọn chỗ trong sơ đồ phòng.'); return;} // No-show policy gate
	const member=JSON.parse(localStorage.getItem('member')||'{}'); if(tooManyNoShows(member.email)){ notifyError('Bạn đã quá 3 lần không đến đúng giờ. Không thể đặt chỗ trực tuyến.'); return; }
	// Confirm and store
	const keyList=getReserved(service,date,time); if(keyList.includes(selectedSeat)){ notifyError('Chỗ vừa được đặt bởi người khác. Vui lòng chọn chỗ khác.'); renderSeatMap(); return; }
	keyList.push(selectedSeat); setReserved(service,date,time,keyList); clearHold(); notifySuccess('Đặt lịch thành công! Vui lòng có mặt đúng giờ.'); closeBookingModal(); }

// Bind: when selecting service/date/time, show seat map
document.addEventListener('change',(e)=>{
	const id=(e.target||{}).id; if(id==='bookingService'||id==='bookingDate'||id==='bookingTime'){
		const svc=document.getElementById('bookingService').value; const date=document.getElementById('bookingDate').value; const time=document.getElementById('bookingTime').value;
		if(svc){ document.getElementById('seatMapSection')?.classList.remove('hidden'); renderSeatMap(); }
	}
});

// Note: Actual enforcement of 15-minute no-show and 24-hour cancel windows would run server-side; here we store counts and block after 3 no-shows as a demo.
