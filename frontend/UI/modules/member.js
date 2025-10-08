export function showLoginForm(){ document.getElementById('loginForm').classList.remove('hidden'); document.getElementById('registerForm').classList.add('hidden'); document.getElementById('loginTab').classList.add('bg-purple-600','text-white'); document.getElementById('registerTab').classList.remove('bg-purple-600','text-white'); document.getElementById('registerTab').classList.add('bg-gray-100','text-gray-600'); }
export function showRegisterForm(){ document.getElementById('loginForm').classList.add('hidden'); document.getElementById('registerForm').classList.remove('hidden'); document.getElementById('registerTab').classList.add('bg-purple-600','text-white'); document.getElementById('loginTab').classList.remove('bg-purple-600','text-white'); document.getElementById('loginTab').classList.add('bg-gray-100','text-gray-600'); }

// ---------- Data helpers ----------
function getSessionMember(){ return JSON.parse(localStorage.getItem('member')||'null'); }
function getLoans(){ return JSON.parse(localStorage.getItem('memberLoans')||'[]'); }
function getRead(){ return JSON.parse(localStorage.getItem('memberRead')||'[]'); }
function getPoints(){ return +localStorage.getItem('memberPoints')||0; }
function seedDemoData(){ if(!localStorage.getItem('memberLoans')){ const today=new Date(); const toISO=(d)=>d.toISOString(); const addDays=(d,n)=>{ const c=new Date(d); c.setDate(c.getDate()+n); return c; }; const loans=[
	{ id:'BK001', title:'Đắc Nhân Tâm', author:'Dale Carnegie', borrowedAt: toISO(addDays(today,-5)), dueAt: toISO(addDays(today,9)), status:'borrowing' },
	{ id:'BK042', title:'Sapiens', author:'Yuval Noah Harari', borrowedAt: toISO(addDays(today,-10)), dueAt: toISO(addDays(today,4)), status:'borrowing' }
]; localStorage.setItem('memberLoans', JSON.stringify(loans)); }
 if(!localStorage.getItem('memberRead')){ const read=[
	{ id:'BK120', title:'Atomic Habits', author:'James Clear', finishedAt:new Date().toISOString(), rating:5 },
	{ id:'BK077', title:'Nhà Giả Kim', author:'Paulo Coelho', finishedAt:new Date().toISOString(), rating:4 }
]; localStorage.setItem('memberRead', JSON.stringify(read)); }
 if(!localStorage.getItem('memberPoints')){ localStorage.setItem('memberPoints','450'); }
}

// ---------- Renderers ----------
function setCounts(){
	const loansEl=document.getElementById('memberLoansCount'); if(loansEl) loansEl.textContent=getLoans().length;
	const readEl=document.getElementById('memberReadCount'); if(readEl) readEl.textContent=getRead().length;
	// notifications badge (placeholder uses points as unread count fallback)
	const notifEl=document.getElementById('memberNotifBadge'); if(notifEl){ const unread=getPoints(); if(unread>0){ notifEl.textContent=unread; notifEl.classList.remove('hidden'); } }
}

function renderLoans(){ const body=document.getElementById('memberPanelBody'); const items=getLoans(); if(items.length===0){ body.innerHTML='<p class="text-gray-500">Chưa có sách đang mượn.</p>'; return; } body.innerHTML = items.map((b,i)=>{
	const due=new Date(b.dueAt); const now=new Date(); const daysLeft=Math.ceil((due-now)/86400000); const warn=daysLeft<=3; return `
	<div class="border border-gray-200 rounded-lg overflow-hidden">
		<div class="flex items-center justify-between p-4 bg-gray-50">
			<div>
				<h4 class="font-semibold">${b.title}</h4>
				<p class="text-gray-600 text-sm">${b.author}</p>
			</div>
			<div class="text-right">
				<p class="text-sm ${warn?'text-red-600':'text-gray-600'}">Hạn trả: ${formatVN(due)}</p>
				<button class="text-purple-600 hover:text-purple-800 text-sm" data-loan-action="toggle" data-index="${i}">Chi tiết</button>
			</div>
		</div>
		<div class="px-4 py-3 hidden" data-loan-detail="${i}">
			<div class="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
				<div>⏱️ Ngày mượn: <span class="font-medium">${formatVN(new Date(b.borrowedAt))}</span></div>
				<div>📅 Hạn trả: <span class="font-medium">${formatVN(new Date(b.dueAt))}</span></div>
				<div>📘 Mã sách: <span class="font-medium">${b.id}</span></div>
				<div>⏳ Còn lại: <span class="font-medium">${daysLeft} ngày</span></div>
			</div>
			<div class="mt-3 flex gap-3">
				<button class="px-3 py-1 rounded bg-blue-600 text-white text-sm">Gia hạn</button>
				<button class="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm">Lịch sử</button>
			</div>
		</div>
	</div>`; }).join(''); }

function renderRead(){ const body=document.getElementById('memberPanelBody'); const items=getRead(); if(items.length===0){ body.innerHTML='<p class="text-gray-500">Chưa có sách đã đọc.</p>'; return; } body.innerHTML = items.map((b)=>`
	<div class="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
		<div>
			<h4 class="font-semibold">${b.title}</h4>
			<p class="text-gray-600 text-sm">${b.author}</p>
		</div>
		<div class="text-right text-sm text-gray-600">
			<p>Hoàn thành: ${formatVN(new Date(b.finishedAt))}</p>
			<p>Đánh giá: ${'⭐'.repeat(b.rating)}</p>
		</div>
	</div>`).join(''); }

function renderNotifications(){ const body=document.getElementById('memberPanelBody');
	const list=document.getElementById('memberNotificationsList');
	if(list){ list.innerHTML = `
		<div class="p-4 border rounded bg-white shadow-sm">
			<div class="flex items-center justify-between">
				<div class="font-semibold text-sm text-gray-700">Nhắc trả sách sắp tới</div>
				<span class="text-xs text-orange-600">3 ngày nữa</span>
			</div>
			<div class="text-xs text-gray-600 mt-1">Cuốn "Đắc Nhân Tâm" sẽ đến hạn trong 3 ngày. Vui lòng trả hoặc gia hạn.</div>
		</div>`; }
	// Keep main body consistent with loans panel design style
	body.querySelector('[data-member-section="notifications"]');
}

function renderProfile(){ const body=document.getElementById('memberPanelBody'); const m=getSessionMember()||{}; const regs=JSON.parse(localStorage.getItem('registrations')||'[]'); const latestReg = regs.slice(-1)[0]||{}; const exp = latestReg?.expireDate ? formatVN(new Date(latestReg.expireDate)) : '—'; body.innerHTML = `
	<div class="grid md:grid-cols-2 gap-6">
		<div class="bg-gray-50 p-4 rounded-lg">
			<h4 class="font-semibold mb-3">Thông tin cá nhân</h4>
			<div class="space-y-1 text-sm text-gray-700">
				<p>Họ và tên: <span class="font-medium">${m.name||'—'}</span></p>
				<p>Email: <span class="font-medium">${m.email||'—'}</span></p>
				<p>Điện thoại: <span class="font-medium">${m.phone||'—'}</span></p>
				<p>Địa chỉ: <span class="font-medium">${m.address||'—'}</span></p>
				<p>Ngày sinh: <span class="font-medium">${m.birth?formatVN(new Date(m.birth)):'—'}</span></p>
			</div>
		</div>
		<div class="bg-gray-50 p-4 rounded-lg">
			<h4 class="font-semibold mb-3">Tình trạng thẻ</h4>
			<div class="space-y-1 text-sm text-gray-700">
				<p>Hiệu lực đến: <span class="font-medium">${exp}</span></p>
				<p>Phạm vi hiệu lực: <span class="font-medium">Toàn hệ thống Thư viện KHTH Đà Nẵng</span></p>
				<p>Trạng thái: <span class="font-medium ${exp==='—'?'text-gray-500':'text-green-600'}">${exp==='—'?'Chưa phát hành':'Hoạt động'}</span></p>
			</div>
		</div>
	</div>`; }

function formatVN(d){ const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}/${mm}/${yyyy}`; }

// ---------- Controller ----------
import { notifyError, notifySuccess } from './notify.js';
export function handleLogin(e){ e.preventDefault(); const member=JSON.parse(localStorage.getItem('member')||'null'); if(!member){ notifyError('Chưa có tài khoản. Vui lòng đăng ký.'); return;} localStorage.setItem('isLoggedIn','true'); showMemberDashboard(member.name); }
export function handleRegister(e){ e.preventDefault(); const form=e.target; const name=form.querySelector('input[type="text"]').value.trim(); const phone=form.querySelector('input[type="tel"]').value.trim(); const email=form.querySelector('input[type="email"]').value.trim(); const address=form.querySelector('textarea').value.trim(); const birth=form.querySelector('input[type="date"]').value; const occupation=form.querySelector('select').value; const m={ name, phone, email, address, birth, occupation, createdAt:new Date().toISOString() }; localStorage.setItem('member', JSON.stringify(m)); notifySuccess('Đăng ký thành công. Vui lòng đăng nhập.'); showLoginForm(); }
function showMemberDashboard(name){
	const n = name || (getSessionMember()?.name || 'Bạn đọc');
	document.getElementById('memberName').textContent = n;
	document.getElementById('memberDashboard').classList.remove('hidden');
	seedDemoData(); setCounts();
	// default select loans section
	switchPanel('loans');
}
export function logout(){ localStorage.removeItem('isLoggedIn'); document.getElementById('memberDashboard').classList.add('hidden'); showLoginForm(); }
export function autoDashboard(){ if(localStorage.getItem('isLoggedIn')==='true'){ const member=JSON.parse(localStorage.getItem('member')||'{}'); showMemberDashboard(member.name); } }

export function bindMemberInteractions(){
	document.addEventListener('click',(e)=>{
		const t=e.target.closest('[data-member-panel]');
		if(t){ e.preventDefault(); switchPanel(t.dataset.memberPanel); }
	});
	document.addEventListener('click',(e)=>{ const t=e.target.closest('[data-loan-action="toggle"]'); if(!t) return; e.preventDefault(); const idx=t.dataset.index; const detail=document.querySelector(`[data-loan-detail="${idx}"]`); detail?.classList.toggle('hidden'); });
}

function switchPanel(panel){
	const title=document.getElementById('memberPanelTitle'); if(!title) return;
	document.querySelectorAll('#memberPanelBody [data-member-section]').forEach(sec=>{
		const match = sec.getAttribute('data-member-section')===panel;
		sec.classList.toggle('hidden', !match);
	});
	if(panel==='loans'){ title.textContent='Sách đang mượn'; renderLoans(); }
	else if(panel==='history'){ title.textContent='Lịch sử mượn trả'; /* history rendering placeholder */ }
	else if(panel==='notifications'){ title.textContent='Thông báo'; renderNotifications(); }
	else if(panel==='profile'){ title.textContent='Cập nhật hồ sơ'; /* profile update handled in form */ }
}
