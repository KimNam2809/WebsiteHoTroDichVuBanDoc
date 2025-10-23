// modules/ai.js
// Lightweight AI-like features: rule-based/chat stub + recommendations and demand forecast.
import { api } from './api.js';

let chatOpen = false;

export function initAI(){
  // FAB toggle
  document.getElementById('aiChatFab')?.addEventListener('click', openChat);
  // Modal submit
  document.getElementById('aiChatForm')?.addEventListener('submit', onChatSubmit);
  // Refresh buttons
  document.querySelector('[data-ai-action="refresh-recos"]')?.addEventListener('click', renderRecommendations);
  document.querySelector('[data-ai-action="refresh-forecast"]')?.addEventListener('click', renderForecast);
  // Initial render
  renderRecommendations();
  renderForecast();
}

export function openChat(){
  const el = document.getElementById('aiChatModal');
  el?.classList.remove('hidden');
  el?.classList.add('flex');
  chatOpen = true;
  ensureWelcome();
}
export function closeChat(){
  const el = document.getElementById('aiChatModal');
  el?.classList.add('hidden');
  el?.classList.remove('flex');
  chatOpen = false;
}

function ensureWelcome(){
  const body = document.getElementById('aiChatBody');
  if (!body) return;
  if (body.dataset.welcomeShown) return;
  body.dataset.welcomeShown = '1';
  appendBot("Xin chào! Mình là trợ lý AI của thư viện. Bạn có thể hỏi về tra cứu sách, thủ tục thẻ, mượn - trả - gia hạn, đặt chỗ ngồi, v.v.");
}

async function onChatSubmit(e){
  e.preventDefault();
  const input = document.getElementById('aiChatInput');
  const text = input?.value?.trim();
  if (!text) return;
  appendUser(text);
  input.value = '';
  // Simple intent routing (rule-based placeholder)
  const reply = await getBotReply(text);
  appendBot(reply);
}

function appendUser(msg){ appendMsg(msg, 'user'); }
function appendBot(msg){ appendMsg(msg, 'bot'); }
function appendMsg(msg, who){
  const body = document.getElementById('aiChatBody');
  if (!body) return;
  const wrap = document.createElement('div');
  wrap.className = who==='user' ? 'text-right' : 'text-left';
  const bubble = document.createElement('div');
  bubble.className = 'inline-block px-3 py-2 rounded-lg text-sm ' + (who==='user' ? 'bg-purple-600 text-white' : 'bg-white border');
  bubble.textContent = msg;
  wrap.appendChild(bubble);
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
}

async function getBotReply(text){
  const t = text.toLowerCase();
  // Simple patterns
  if (/thẻ|làm thẻ|đăng ký thẻ/.test(t)){
    return 'Để làm thẻ: vào mục "Làm thẻ", chọn loại thẻ, điền thông tin bắt buộc, tải ảnh 3x4, sau đó gửi đơn. Bạn cần CMND/CCCD và email/điện thoại hợp lệ.';
  }
  if (/mượn|trả|gia hạn/.test(t)){
    return 'Mượn-trả-gia hạn: bạn chọn sách trong "Tìm sách", nhấn Mượn/Đặt/Gia hạn rồi điền biểu mẫu. Hệ thống sẽ xác nhận và hướng dẫn chi tiết.';
  }
  if (/đặt chỗ|chỗ ngồi|booking/.test(t)){
    return 'Đặt chỗ ngồi: vào mục Dịch vụ đặt chỗ hoặc bấm nút "Đặt chỗ" trên trang chính để mở biểu mẫu, sau đó chọn ngày-giờ, khu vực, số ghế.';
  }
  if (/giờ mở cửa|thời gian hoạt động|lịch/.test(t)){
    return 'Giờ mở cửa: 8:00–21:00 từ Thứ 2 đến Thứ 7, Chủ nhật mở 9:00–17:00. Ngày lễ có thể thay đổi.';
  }
  if (/gợi ý|đề xuất|nên đọc/.test(t)){
    await renderRecommendations();
    return 'Mình đã cập nhật danh sách gợi ý theo sở thích của bạn ở mục "Gợi ý tài liệu cho bạn".';
  }
  // Fallback: echo + help
  return 'Mình chưa hiểu yêu cầu. Bạn có thể hỏi: "Làm thẻ thế nào?", "Cách mượn/gia hạn sách?", "Đặt chỗ ngồi?", hoặc "Gợi ý sách cho mình".';
}

async function renderRecommendations(){
  const host = document.getElementById('aiRecommendations');
  if (!host) return;
  host.innerHTML = '';
  const books = await api.getBooks();
  const profile = getUserProfile();
  // Simple scoring: prefer category recently viewed, available, recent year
  const scored = books.map(b=>({
    book:b,
    score: (b.available?2:0) + (b.year? Math.max(0, (b.year-2000)/10):0) + (profile.prefCat && b.category===profile.prefCat?3:0)
  }))
  .sort((a,b)=>b.score-a.score)
  .slice(0,6)
  .map(x=>x.book);
  for(const b of scored){
    const card = document.createElement('div');
    card.className = 'border rounded-lg p-3 hover:shadow transition';
    card.innerHTML = `
      <div class="text-sm font-semibold mb-1">${b.title}</div>
      <div class="text-xs text-gray-600">${b.author||''}</div>
      <div class="mt-2 text-xs">Chủ đề: <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700">${b.category||'khác'}</span></div>
      <div class="mt-2 text-xs ${b.available? 'text-green-600':'text-red-600'}">${b.available? 'Có sẵn':'Đang bận'}</div>
      <div class="mt-2"><button class="text-sm text-blue-600 hover:text-blue-800" data-ai="borrow" data-id="${b.id}">Mượn</button></div>
    `;
    host.appendChild(card);
  }
  // quick bind borrow buttons to open borrow modal
  document.querySelectorAll('[data-ai="borrow"]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = Number(e.currentTarget.getAttribute('data-id'));
      window.showBookDetails?.(id);
      window.openBorrowModal?.(id);
    });
  });
}

async function renderForecast(){
  const host = document.getElementById('aiForecast');
  if (!host) return;
  host.innerHTML = '';
  // Synthetic simple forecast based on day of week & sample usage
  const today = new Date().getDay();
  const seats = [60,65,70,80,90,75,68][today];
  const loans = [120,140,160,180,200,170,150][today];
  const returns = [90,100,110,130,150,120,110][today];
  const extendsN = [30,35,40,45,50,48,42][today];
  const items = [
    { icon:'💺', text:`Nhu cầu chỗ ngồi dự kiến: ${seats}% (cao vào khung 9–11h, 14–16h)` },
    { icon:'📚', text:`Mượn sách trong ngày: ~${loans} lượt` },
    { icon:'↩️', text:`Trả sách trong ngày: ~${returns} lượt` },
    { icon:'⏳', text:`Gia hạn trong ngày: ~${extendsN} lượt` }
  ];
  for(const it of items){
    const row = document.createElement('div');
    row.className='flex items-center gap-3 p-3 rounded border';
    row.innerHTML = `<span class="text-xl">${it.icon}</span><span class="text-sm text-gray-700">${it.text}</span>`;
    host.appendChild(row);
  }
}

function getUserProfile(){
  try{ return JSON.parse(localStorage.getItem('aiProfile')||'{}'); }catch{ return {}; }
}

// Optional helpers for auto-fill flows
export function autofillCard(data){
  // Fill a few sample fields in card registration
  document.getElementById('fullName')?.setAttribute('value', data?.fullName||'');
  document.getElementById('email')?.setAttribute('value', data?.email||'');
  document.getElementById('phone')?.setAttribute('value', data?.phone||'');
}
