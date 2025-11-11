import { openModal, closeModal, formatDate } from './utils.js';
import { storage } from './storage.js';
import { escapeHTML } from './sanitize.js';

let cropper=null; let currentCaptcha=''; let lastRegistration=null;

export function showCardSection(name){ const ids=['cardWelcome','cardForm','cardSuccess','cardLookup','cardRules']; ids.forEach(id=>document.getElementById(id)?.classList.add('hidden')); const map={ welcome:'cardWelcome', form:'cardForm', success:'cardSuccess', lookup:'cardLookup', rules:'cardRules' }; const id=map[name]||'cardWelcome'; document.getElementById(id)?.classList.remove('hidden'); }

export function calculateTotal(){ const ct=document.getElementById('cardType'); const rt=document.getElementById('readerType'); const delivery=document.querySelector('input[name="delivery"]:checked')?.value; const price=+ct?.selectedOptions?.[0]?.dataset?.price||0; const discount=+rt?.selectedOptions?.[0]?.dataset?.discount||0; const ship = delivery==='home'?30000:0; const total = Math.max(0, Math.round(price*(1-discount/100))+ship); document.getElementById('totalCost').textContent = `${total.toLocaleString('vi-VN')} VNĐ`; return total; }
export function validateAge(){ const birth=document.getElementById('birthDate').value; const readerType=document.getElementById('readerType').value; const err=document.getElementById('ageError'); err.classList.add('hidden'); if(!birth) return true; const age = (()=>{ const d=new Date(birth); const diff=Date.now()-d.getTime(); const a=new Date(diff); return Math.abs(a.getUTCFullYear()-1970); })(); if(readerType==='thieunhi' && age>15){ err.textContent='Thẻ thiếu nhi chỉ áp dụng cho 1-15 tuổi.'; err.classList.remove('hidden'); return false;} return true; }
export function validateIdNumber(){ const v=document.getElementById('idNumber').value.trim(); const err=document.getElementById('idError'); err.classList.add('hidden'); if(!/^\d{9}$/.test(v) && !/^\d{12}$/.test(v)){ err.textContent='CMND 9 số hoặc CCCD 12 số.'; err.classList.remove('hidden'); return false;} return true; }
export function validateEmail(){ const v=document.getElementById('email').value.trim(); const err=document.getElementById('emailError'); err.classList.add('hidden'); const ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); if(!ok){ err.textContent='Email không hợp lệ.'; err.classList.remove('hidden'); } return ok; }
export function validatePhone(){ const v=document.getElementById('phone').value.trim(); const err=document.getElementById('phoneError'); err.classList.add('hidden'); const ok=/^0\d{9}$/.test(v); if(!ok){ err.textContent='Số điện thoại 10 số, bắt đầu bằng 0.'; err.classList.remove('hidden'); } return ok; }

export function handlePhotoUpload(e){ const file=e.target.files?.[0]; if(!file) return; clearPhotoError(); if(!file.type.startsWith('image/')){ showPhotoError('Vui lòng chọn tệp hình ảnh.'); return; } if(file.size>3*1024*1024){ showPhotoError('Ảnh vượt quá 3MB.'); return; } const reader=new FileReader(); reader.onload=()=>{ document.getElementById('previewImage').src=reader.result; document.getElementById('photoPreview').classList.remove('hidden'); document.getElementById('uploadArea').classList.add('hidden'); }; reader.readAsDataURL(file); }
export function showPhotoError(msg){ const el=document.getElementById('photoError'); el.textContent=msg; el.classList.remove('hidden'); }
export function clearPhotoError(){ document.getElementById('photoError').classList.add('hidden'); }
export function openCropper(){ const src=document.getElementById('previewImage').src; if(!src) return; const img=document.getElementById('cropperImage'); img.src=src; openModal('cropperModal'); setTimeout(()=>{ cropper?.destroy(); cropper=new Cropper(img,{ aspectRatio:3/4, viewMode:1, autoCropArea:1, movable:false, zoomable:true, background:false }); },50); }
export function closeCropper(){ cropper?.destroy(); cropper=null; closeModal('cropperModal'); }
export function applyCrop(){ if(!cropper) return; const canvas=cropper.getCroppedCanvas({ width:300, height:400 }); const dataUrl=canvas.toDataURL('image/jpeg',0.9); document.getElementById('previewImage').src=dataUrl; storage.setJSON?.('cardPhotoDataUrl', dataUrl); localStorage.setItem('cardPhotoDataUrl', dataUrl); closeCropper(); }
export function removePhoto(){ document.getElementById('previewImage').src=''; document.getElementById('photoPreview').classList.add('hidden'); document.getElementById('uploadArea').classList.remove('hidden'); localStorage.removeItem('cardPhotoDataUrl'); }

export function generateCaptcha(){ const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; currentCaptcha = Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join(''); document.getElementById('captchaCode').textContent=currentCaptcha; }

export function handleCardRegistration(e){
	e.preventDefault();
	if(!validateAge()||!validateIdNumber()||!validateEmail()||!validatePhone()) return;
	const captcha=document.getElementById('captchaInput').value.trim().toUpperCase();
	if(captcha!==currentCaptcha){ notifyError('Mã xác thực không đúng.'); generateCaptcha(); return; }
	const total=calculateTotal();
	const rd=id=>document.getElementById(id)?.value?.trim();
	const regCode='DK'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
	const createdAt=new Date().toISOString();
	const expDateObj=new Date(createdAt); expDateObj.setFullYear(expDateObj.getFullYear()+1);
	const record={
		code:regCode,
		cardType:document.getElementById('cardType').value,
		readerType:document.getElementById('readerType').value,
		name:rd('fullName'), gender:rd('gender'), birthDate:rd('birthDate'), idNumber:rd('idNumber'),
		address:rd('address'), email:rd('email'), phone:rd('phone'), occupation:rd('occupation'), workplace:rd('workplace'),
		nationality:rd('nationality'), delivery:document.querySelector('input[name="delivery"]:checked')?.value,
		total, photo: localStorage.getItem('cardPhotoDataUrl')||null, createdAt, expireDate: expDateObj.toISOString()
	};
	const list=storage.getRegistrations();
	list.push(record);
	storage.setRegistrations(list);
	lastRegistration=record;
	document.getElementById('registrationCode').textContent=record.code;
	document.getElementById('successName').textContent=record.name;
	document.getElementById('successCardType').textContent=toCardTypeName(record.cardType);
	document.getElementById('successTotal').textContent=`${record.total.toLocaleString('vi-VN')} VNĐ`;
	document.getElementById('transferContent').textContent=record.code;
	const qrBox=document.querySelector('#bankPayment .qr-code');
	qrBox.innerHTML='';
	const payload=`PAYMENT|BANK:TVDN|AMT:${record.total}|CONTENT:${record.code}`;
	new QRCode(qrBox,{ text:payload, width:192, height:192 });
	showCardSection('success');
}
export function downloadQR(){ const canvas=document.querySelector('#bankPayment .qr-code canvas'); if(!canvas) return; const link=document.createElement('a'); link.href=canvas.toDataURL('image/png'); link.download='qr-thanh-toan.png'; link.click(); }
function buildCardHTML(data){ const photo = data.photo || document.getElementById('previewImage')?.src || ''; const typeName=toCardTypeName(data.cardType); const exp = data.expireDate ? (/\d{4}-\d{2}-\d{2}T/.test(data.expireDate) ? formatDate(data.expireDate) : data.expireDate) : '31/12/2025'; const qrId=`qr-${data.code||'preview'}`; const safeName=escapeHTML(data.name||''); const safeCode=escapeHTML(data.code||''); return `
		<div class="libcard" role="img" aria-label="Xem trước thẻ bạn đọc">
			<img src="card_image.png" alt="Mẫu thẻ" class="libcard__bg" loading="lazy"/>
			<div class="libcard__panel"></div>
			<div class="libcard__brandbar"></div>
		${photo?`<img src="${photo}" alt="Ảnh bạn đọc" class="libcard__photo" loading="lazy"/>`:''}
			<div class="libcard__title">THƯ VIỆN KHOA HỌC TỔNG HỢP ĐÀ NẴNG</div>
			<div class="libcard__subtitle">Thẻ bạn đọc</div>
		<div class="libcard__field libcard__field--name">${safeName}</div>
		<div class="libcard__field libcard__field--id">Mã thẻ: <strong>${safeCode}</strong></div>
		<div class="libcard__field libcard__field--type">Loại thẻ: ${typeName||''}</div>
		<div class="libcard__field libcard__field--expire">Hiệu lực đến: ${exp}</div>
		<div class="libcard__qr"><div id="${qrId}"></div></div>
	</div>`; }

export function previewCard(){ const rec= lastRegistration || storage.getRegistrations().slice(-1)[0]; if(!rec) return; const host=document.getElementById('cardPreviewCanvas'); if(host){ host.innerHTML = buildCardHTML(rec); const qrBox=host.querySelector('.libcard__qr > div'); if(qrBox){ new QRCode(qrBox,{ text: rec.code, width:40, height:40, correctLevel: QRCode.CorrectLevel.H }); } } openModal('cardPreviewModal'); }
export function closeCardPreview(){ closeModal('cardPreviewModal'); }
export function handleCardLookup(e){ e.preventDefault(); const name=document.getElementById('lookupName').value.trim().toLowerCase(); const birth=document.getElementById('lookupBirth').value; const phone=document.getElementById('lookupPhone').value.trim(); const list=storage.getRegistrations(); const found=list.filter(r=> r.name?.trim().toLowerCase()===name && r.birthDate===birth && r.phone===phone ); const box=document.getElementById('lookupContent'); document.getElementById('lookupResults').classList.remove('hidden'); if(found.length===0){ box.innerHTML='<p class="text-red-600">Không tìm thấy hồ sơ phù hợp.</p>'; return;} box.innerHTML = found.map(r=>{
	const html = buildCardHTML(r);
	const safeCode=escapeHTML(r.code||'');
	const safeName=escapeHTML(r.name||'');
	return `<div class="p-4 border rounded mb-3">
		<div class="mb-3">${html}</div>
		<div class="text-sm text-gray-700">
			<p><strong>Mã đăng ký:</strong> ${safeCode}</p>
			<p><strong>Họ tên:</strong> ${safeName}</p>
			<p><strong>Loại thẻ:</strong> ${toCardTypeName(r.cardType)}</p>
			<p><strong>Tổng tiền:</strong> ${r.total.toLocaleString('vi-VN')} VNĐ</p>
			<p><strong>Ngày đăng ký:</strong> ${formatDate(r.createdAt)}</p>
			<p><strong>Hiệu lực đến:</strong> ${r.expireDate ? formatDate(r.expireDate) : '—'}</p>
			<p><strong>Trạng thái:</strong> Đang chờ xử lý</p>
		</div>
	</div>`; }).join('');
	// Initialize QR codes for each rendered card
		box.querySelectorAll('.libcard__qr > div').forEach((el)=>{ const codeEl = el.closest('.libcard')?.querySelector('.libcard__field--id'); const codeText = codeEl ? codeEl.textContent.replace('Mã thẻ:','').trim() : ''; new QRCode(el,{ text: codeText||'CARD', width:40, height:40, correctLevel: QRCode.CorrectLevel.H }); }); }

function toCardTypeName(v){ return ({ doc:'Thẻ đọc', muon:'Thẻ mượn', thieunhi:'Thẻ thiếu nhi', shub:'Thẻ Shub' }[v]||v); }
