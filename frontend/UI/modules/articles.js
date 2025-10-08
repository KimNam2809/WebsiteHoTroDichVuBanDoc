import { openModal, closeModal } from './utils.js';
import { escapeHTML, safeHTML } from './sanitize.js';
import { notifySuccess } from './notify.js';

const articles = {
  main:{icon:'🏛️',imageTitle:'Khai trương phòng đọc 24/7',title:'Thư viện chính thức khai trương phòng đọc 24/7',summary:'Từ ngày 15/12/2024, phòng đọc hoạt động 24/7 phục vụ bạn đọc.',date:'10/12/2024',author:'Ban Biên tập',views:'1,247',category:'Thông báo',tag:'Tin nóng',content:'<p>Phòng đọc 24/7...</p>'},
  exhibition:{icon:'🎨',imageTitle:'Triển lãm Đà Nẵng 25 năm',title:'Triển lãm “Đà Nẵng - 25 năm”',summary:'Ảnh và tư liệu...',date:'08/12/2024',author:'Phòng Sự kiện',views:'892',category:'Sự kiện',tag:'Triển lãm',content:'<p>Triển lãm diễn ra...</p>'},
  app:{icon:'📱',imageTitle:'Ứng dụng thư viện',title:'Ra mắt ứng dụng thư viện thông minh',summary:'Tìm kiếm AI...',date:'05/12/2024',author:'Trung tâm CNTT',views:'1,156',category:'Công nghệ',tag:'App mới',content:'<p>Ứng dụng có mặt...</p>'},
  course:{icon:'🎓',imageTitle:'Khóa kỹ năng số',title:'Khóa học kỹ năng số miễn phí',summary:'Dành cho người cao tuổi...',date:'03/12/2024',author:'Phòng Đọc',views:'634',category:'Giáo dục',tag:'Workshop',content:'<p>Đăng ký tại quầy...</p>'},
  newbooks:{icon:'📚',imageTitle:'Sách mới tháng 12',title:'Cập nhật 500+ đầu sách mới',summary:'Khoa học, công nghệ...',date:'01/12/2024',author:'Phòng Bổ sung',views:'789',category:'Sách mới',tag:'Cập nhật',content:'<p>Danh mục sẽ được...</p>'}
};

export function showArticle(id){ const a=articles[id]; if(!a) return; document.getElementById('articleIcon').textContent=a.icon; document.getElementById('articleImageTitle').textContent=a.imageTitle; document.getElementById('articleTitle').textContent=a.title; document.getElementById('articleSummary').textContent=a.summary; document.getElementById('articleDate').textContent=a.date; document.getElementById('articleAuthor').textContent=a.author; document.getElementById('articleViews').textContent=a.views; document.getElementById('articleCategory').textContent=a.category; document.getElementById('articleTag').textContent=a.tag; // article.content is curated static HTML, sanitize allow-list anyway
  document.getElementById('articleContent').innerHTML = safeHTML(a.content);
  window.showPage('article'); }
export function printArticle(){ window.print(); }
export function handleComment(e){ e.preventDefault(); notifySuccess('Đã gửi bình luận. Cảm ơn bạn!'); e.target.reset(); }

const events={ ai:{ title:'Hội thảo "AI trong thư viện"', time:'15/12/2024 - 14:00', place:'Hội trường A', desc:'Ứng dụng AI nâng cao trải nghiệm bạn đọc.' }, club:{ title:'Câu lạc bộ đọc sách', time:'18/12/2024 - 19:00', place:'Phòng đọc 2', desc:'Chủ đề: Thói quen đọc hiệu quả.' }, cv:{ title:'Workshop viết CV', time:'20/12/2024 - 15:30', place:'Phòng máy tính', desc:'Hướng dẫn viết CV chuẩn ATS.' } };
export function showEvent(key){ const ev=events[key]; if(!ev) return; document.getElementById('eventTitle').textContent=ev.title; const time=escapeHTML(ev.time); const place=escapeHTML(ev.place); const desc=escapeHTML(ev.desc); document.getElementById('eventContent').innerHTML=`<p><strong>Thời gian:</strong> ${time}</p><p><strong>Địa điểm:</strong> ${place}</p><p>${desc}</p>`; const el=document.getElementById('eventModal'); el.classList.remove('hidden'); el.classList.add('flex'); }
export function closeEventModal(){ const el=document.getElementById('eventModal'); el.classList.add('hidden'); el.classList.remove('flex'); }
