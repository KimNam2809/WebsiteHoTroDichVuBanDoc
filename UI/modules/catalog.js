import { openModal, closeModal, setTodayMin, addDays, formatDate, debounce } from './utils.js';
import { notifyChange } from './stats.js';
import { api } from './api.js';
import { escapeHTML } from './sanitize.js';
import { notifySuccess, notifyError, notifyInfo } from './notify.js';
import { storage } from './storage.js';

let books=[]; let currentBookList=[]; let pageSize=8; let currentBookForAction=null; let initialized=false;

function normalizeText(s){
	return (s||'')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g,'') // strip diacritics
		.replace(/đ/g,'d');
}

export async function ensureInit(){ if(initialized) return; books = await api.getBooks(); currentBookList = books.slice(); renderBookPage(1); // attach debounced search
	const input=document.getElementById('searchInput'); if(input && !input.dataset.debounced){ input.addEventListener('keyup', debounce(()=>searchBooks(),300)); input.dataset.debounced='1'; }
	initialized=true; }

export function searchBooks(){
	const qRaw=document.getElementById('searchInput').value.trim();
	const catRaw=document.getElementById('categoryFilter').value.trim();
	const mode=(document.querySelector('input[name="searchMode"]:checked')?.value)||'contains';
	const noDia=document.getElementById('noDiacritics')?.checked!==false; // default true
	const selFields=[...document.querySelectorAll('input[name="searchField"]:checked')].map(i=>i.value);
	const norm = (s)=> noDia ? normalizeText(s) : (s||'').toLowerCase();
	const q = norm(qRaw);
	const cat = norm(catRaw);
	currentBookList = books.filter(b=>{
		const fieldMap={ title:b.title, author:b.author, code:b.code||'', category:b.category||'' };
		const joined = (selFields.length? selFields : ['title','author']).map(f=>fieldMap[f]||'').join(' ');
		const hay = norm(joined);
		const matchQ = !q || (mode==='contains' ? hay.includes(q) : mode==='starts' ? hay.startsWith(q) : hay===q);
		const matchC = !cat || norm(b.category||'')===cat;
		return matchQ && matchC;
	});
	renderBookPage(1);
}

function renderBookPage(page){ const start=(page-1)*pageSize; const items=currentBookList.slice(start,start+pageSize); renderBookCards(items); renderPagination(page, Math.ceil(currentBookList.length/pageSize)); }
function renderBookCards(items){ const grid=document.getElementById('bookGrid'); if(!grid) return; grid.innerHTML= items.map(b=>`
	<div class="bg-white p-4 rounded-lg shadow-lg card-hover relative h-full flex flex-col">
		<span class="absolute top-3 right-3 px-2 py-1 rounded-full text-xs ${b.available!==false ? 'bg-green-100 text-green-700':'bg-red-100 text-red-700'}">${b.available!==false ? 'Có sẵn':'Đã mượn'}</span>
		<div class="pr-16">
			<h3 class="text-lg font-semibold">${b.title}</h3>
			<p class="text-gray-600 text-sm">${b.author} • ${b.year||''}</p>
			<p class="text-xs text-gray-500 mt-1">Mã: ${b.code||b.id} • Thể loại: ${b.category||''}</p>
		</div>
		<div class="mt-4 flex gap-2 pt-2 border-t border-gray-100 mt-auto">
			<button class="flex-1 text-center px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700" data-book-detail="${b.id}">Chi tiết</button>
			${b.available!==false
				? `<button class="flex-1 text-center px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-900" data-book-borrow="${b.id}">Mượn</button>`
				: `<button class="flex-1 text-center px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700" data-book-reserve="${b.id}">Đặt trước</button>`}
		</div>
	</div>`).join(''); grid.querySelectorAll('[data-book-detail]').forEach(btn=>btn.addEventListener('click',()=>showBookDetails(+btn.dataset.bookDetail))); grid.querySelectorAll('[data-book-borrow]').forEach(btn=>btn.addEventListener('click',()=>openBorrowModal(+btn.dataset.bookBorrow))); grid.querySelectorAll('[data-book-reserve]').forEach(btn=>btn.addEventListener('click',()=>openReserveModal(+btn.dataset.bookReserve))); }
function renderPagination(page,totalPages){ const container=document.getElementById('pagination'); if(!container) return; if(totalPages<=1){ container.innerHTML=''; return;} let html=`<button class="px-3 py-2 mx-1 rounded border ${page===1?'opacity-50 cursor-not-allowed':'hover:bg-gray-100'}" ${page===1?'disabled':`data-page="${page-1}"`}>&laquo; Trước</button>`; for(let p=1;p<=totalPages;p++){ html+=`<button class="px-3 py-2 mx-1 rounded ${p===page?'bg-purple-600 text-white':'border hover:bg-gray-100'}" data-page="${p}">${p}</button>`;} html+=`<button class="px-3 py-2 mx-1 rounded border ${page===totalPages?'opacity-50 cursor-not-allowed':'hover:bg-gray-100'}" ${page===totalPages?'disabled':`data-page="${page+1}"`}>Sau &raquo;</button>`; container.innerHTML=html; container.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>renderBookPage(+btn.dataset.page))); }

export function showBookDetails(id){
	const b=books.find(x=>x.id==id); if(!b) return; currentBookForAction=b;
	document.getElementById('bookTitle').textContent=b.title;
	const img = b.panorama || b.image || b.cover || `https://source.unsplash.com/1200x600/?book,${encodeURIComponent(b.category||'library')}`;
	const safeAuthor=escapeHTML(b.author||'');
	const safeCode=escapeHTML(b.code||String(b.id));
	const safeCat=escapeHTML(b.category||'');
	const safeYear=escapeHTML(b.year||'');
	document.getElementById('bookDetails').innerHTML = `
		<div class="rounded-lg overflow-hidden mb-4">
			<img src="${img}" alt="Ảnh sách ${b.title}" class="w-full h-56 sm:h-64 md:h-72 object-cover" loading="lazy">
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="space-y-2">
				<p><strong>Tác giả:</strong> ${safeAuthor}</p>
				<p><strong>Mã sách:</strong> ${safeCode}</p>
				<p><strong>Thể loại:</strong> ${safeCat}</p>
			</div>
			<div class="space-y-2">
				<p><strong>Năm XB:</strong> ${safeYear}</p>
				<p><strong>Trạng thái:</strong> ${b.available!==false?'Có sẵn':'Đã mượn'}</p>
			</div>
		</div>
		<div class="mt-4 flex flex-wrap gap-2">
			${b.available!==false
				? `<button class="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700" id="detailBorrowBtn">Mượn</button>`
				: `<button class="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900" id="detailReserveBtn">Đặt trước</button>`}
			<button class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" id="detailExtendBtn">Gia hạn</button>
		</div>`;
	openModal('bookModal');
	document.getElementById('detailBorrowBtn')?.addEventListener('click',()=>openBorrowModal(b.id));
	document.getElementById('detailReserveBtn')?.addEventListener('click',()=>openReserveModal(b.id));
	document.getElementById('detailExtendBtn')?.addEventListener('click',openExtendModal);
}
export function closeBookModal(){ closeModal('bookModal'); }

export function openBorrowModal(bookId){ if(bookId){ currentBookForAction=books.find(b=>b.id==bookId)||currentBookForAction; } setTodayMin('borrowDate'); openModal('borrowModal'); }
export function closeBorrowModal(){ closeModal('borrowModal'); }
export function handleBorrow(e){
	e.preventDefault();
	const readerId=document.getElementById('borrowReaderId').value.trim();
	const borrowDate=document.getElementById('borrowDate').value;
	const borrowDays=+document.getElementById('borrowDays').value;
	if(!currentBookForAction) return;
	const due=addDays(borrowDate, borrowDays);
	const loans=storage.getLoans();
	loans.push({ readerId, bookId: currentBookForAction.id, code: currentBookForAction.code||currentBookForAction.id, title: currentBookForAction.title, borrowDate, borrowDays, dueDate: due });
	storage.setLoans(loans);
	notifyChange();
	notifySuccess(`Đã mượn: ${currentBookForAction.title}\nHạn trả: ${formatDate(due)}`);
	closeBorrowModal();
	closeBookModal();
}

export function openReserveModal(bookId){ if(bookId){ currentBookForAction=books.find(b=>b.id==bookId)||currentBookForAction; } setTodayMin('reserveDate'); openModal('reserveModal'); }
export function closeReserveModal(){ closeModal('reserveModal'); }
export function handleReserve(e){
	e.preventDefault();
	const readerId=document.getElementById('reserveReaderId').value.trim();
	const reserveDate=document.getElementById('reserveDate').value;
	const reservations=storage.getReservations();
	reservations.push({ readerId, bookId: currentBookForAction?.id, title: currentBookForAction?.title, reserveDate });
	storage.setReservations(reservations);
	notifyChange();
	notifyInfo('Đã đặt trước. Giữ sách trong 24h vào ngày đã chọn.');
	closeReserveModal();
	closeBookModal();
}

export function openExtendModal(){ openModal('extendModal'); }
export function closeExtendModal(){ closeModal('extendModal'); }
export function handleExtend(e){
	e.preventDefault();
	const readerId=document.getElementById('extendReaderId').value.trim();
	const extendDays=+document.getElementById('extendDays').value;
	const loans=storage.getLoans();
	const idx=loans.findIndex(l=> l.readerId===readerId && (!currentBookForAction || l.bookId===currentBookForAction.id));
	if(idx===-1){ notifyError('Không tìm thấy bản ghi mượn phù hợp.'); return; }
	const newDue=addDays(loans[idx].dueDate, extendDays);
	loans[idx].dueDate=newDue;
	storage.setLoans(loans);
	notifyChange();
	notifySuccess(`Gia hạn thành công đến: ${formatDate(newDue)}`);
	closeExtendModal();
	closeBookModal();
}
