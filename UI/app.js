// Data: articles
const articles = {
  main: {
    title: "Thư viện chính thức khai trương phòng đọc hoạt động 24/7",
    summary: "Từ ngày 15/12/2024, Thư viện Khoa học Tổng hợp Đà Nẵng chính thức khai trương phòng đọc hoạt động 24/7, đáp ứng nhu cầu học tập và nghiên cứu của bạn đọc trong thành phố.",
    date: "10/12/2024",
    author: "Ban biên tập",
    views: "1,247 lượt xem",
    category: "Tin tức",
    tag: "TIN HOT",
    icon: "🏛️",
    imageTitle: "Khai trương phòng đọc 24/7",
    gradient: "from-blue-500 to-purple-600"
  },
  exhibition: {
    title: "Triển lãm 'Đà Nẵng - 25 năm thành lập thành phố trực thuộc TW'",
    summary: "Triển lãm ảnh và tư liệu quý về quá trình phát triển của thành phố Đà Nẵng qua 25 năm trở thành thành phố trực thuộc Trung ương.",
    date: "08/12/2024",
    author: "Phòng Văn hóa",
    views: "892 lượt xem",
    category: "Sự kiện",
    tag: "SỰ KIỆN",
    icon: "🎨",
    imageTitle: "Triển lãm Đà Nẵng - 25 năm",
    gradient: "from-green-400 to-blue-500"
  },
  app: {
    title: "Ra mắt ứng dụng thư viện thông minh với công nghệ AI",
    summary: "Ứng dụng mới với nhiều tính năng hiện đại: tìm kiếm AI, đặt chỗ online, thông báo thông minh và nhiều tiện ích khác.",
    date: "05/12/2024",
    author: "Phòng Công nghệ",
    views: "1,156 lượt xem",
    category: "Công nghệ",
    tag: "CÔNG NGHỆ",
    icon: "📱",
    imageTitle: "Ứng dụng thông minh",
    gradient: "from-purple-400 to-pink-500"
  },
  course: {
    title: "Khóa học kỹ năng số miễn phí cho người cao tuổi",
    summary: "Chương trình đào tạo sử dụng máy tính, internet cơ bản dành cho người cao tuổi, giúp họ hòa nhập với thời đại số.",
    date: "03/12/2024",
    author: "Phòng Đào tạo",
    views: "634 lượt xem",
    category: "Đào tạo",
    tag: "MIỄN PHÍ",
    icon: "🎓",
    imageTitle: "Khóa học kỹ năng số",
    gradient: "from-orange-400 to-red-500"
  }
};

// Additional homepage article
articles.newbooks = {
  title: "Cập nhật 500+ đầu sách mới tháng 12",
  summary: "Bổ sung nhiều đầu sách hay trong các lĩnh vực khoa học, công nghệ, văn học và kỹ năng sống.",
  date: "01/12/2024",
  author: "Thư viện",
  views: "789 lượt xem",
  category: "Tin thư viện",
  tag: "SÁCH MỚI",
  icon: "📚",
  imageTitle: "Sách mới tháng 12",
  gradient: "from-teal-400 to-green-500"
};

// Data: books
const books = [
  { id: 1, title: "Đắc Nhân Tâm", author: "Dale Carnegie", category: "kỹ năng sống", isbn: "978-604-2-00001-1", publisher: "NXB Tổng hợp TP.HCM", year: 2020, pages: 320, description: "Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử trong cuộc sống.", available: true, location: "Kệ A1-15", cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&q=80&auto=format&fit=crop" },
  { id: 2, title: "Sapiens: Lược sử loài người", author: "Yuval Noah Harari", category: "lịch sử", isbn: "978-604-2-00002-2", publisher: "NXB Thế giới", year: 2019, pages: 512, description: "Câu chuyện về sự tiến hóa của loài người từ thời tiền sử đến hiện đại.", available: false, location: "Kệ B2-08", cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&q=80&auto=format&fit=crop" },
  { id: 3, title: "Atomic Habits", author: "James Clear", category: "kỹ năng sống", isbn: "978-604-2-00003-3", publisher: "NXB Thế giới", year: 2021, pages: 368, description: "Hướng dẫn xây dựng thói quen tốt và loại bỏ thói quen xấu.", available: true, location: "Kệ A2-22", cover: "https://images.unsplash.com/photo-1528208079124-0fd6f97424c7?w=1200&q=80&auto=format&fit=crop" },
  { id: 4, title: "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", author: "Nguyễn Nhật Ánh", category: "văn học", isbn: "978-604-2-00004-4", publisher: "NXB Trẻ", year: 2018, pages: 280, description: "Tiểu thuyết về tuổi thơ miền quê Việt Nam đầy chất thơ.", available: true, location: "Kệ C1-05", cover: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1200&q=80&auto=format&fit=crop" },
  { id: 5, title: "Kinh Tế Học Vĩ Mô", author: "N. Gregory Mankiw", category: "kinh tế", isbn: "978-604-2-00005-5", publisher: "NXB Kinh tế", year: 2020, pages: 640, description: "Giáo trình kinh tế học vĩ mô cơ bản cho sinh viên.", available: true, location: "Kệ D3-12", cover: "https://images.unsplash.com/photo-1518081461904-9ac3d06c88f2?w=1200&q=80&auto=format&fit=crop" },
  { id: 6, title: "Doraemon - Nobita và Vương Quốc Robot", author: "Fujiko F. Fujio", category: "thiếu nhi", isbn: "978-604-2-00006-6", publisher: "NXB Kim Đồng", year: 2021, pages: 180, description: "Cuộc phiêu lưu thú vị của Doraemon và Nobita.", available: true, location: "Kệ E1-30", cover: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80&auto=format&fit=crop" }
];

// App state
let currentPage = 'home';
let isLoggedIn = false;
let currentCaptcha = '';

// Pagination state
let currentBookPage = 1;
const pageSize = 8; // cards per page
let currentBookList = [...books];
let currentBookForAction = null; // book object set on details open

// Navigation
function showPage(pageId) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById(pageId + 'Page');
  if (el) el.classList.remove('hidden');
  currentPage = pageId;
  if (pageId === 'catalog') {
    renderBookPage(1, currentBookList);
  } else if (pageId === 'cardRegistration') {
    showCardSection('welcome');
  }
  const mm = document.getElementById('mobileMenu');
  if (mm) mm.classList.add('hidden');
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('hidden');
}

// Card Registration
function showCardSection(sectionName) {
  document.querySelectorAll('.card-section').forEach(s => s.classList.add('hidden'));
  const id = 'card' + sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
  const sec = document.getElementById(id);
  if (sec) sec.classList.remove('hidden');
  if (sectionName === 'form') generateCaptcha();
}

function generateCaptcha() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  currentCaptcha = captcha;
  const codeEl = document.getElementById('captchaCode');
  if (codeEl) codeEl.textContent = captcha;
}

function validateAge() {
  const birthInput = document.getElementById('birthDate');
  if (!birthInput || !birthInput.value) return true;
  const birthDate = new Date(birthInput.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  const cardType = document.getElementById('cardType')?.value;
  const ageError = document.getElementById('ageError');
  if (cardType === 'thieunhi' && age > 15) {
    if (ageError) { ageError.textContent = 'Thẻ thiếu nhi chỉ dành cho trẻ em từ 1-15 tuổi'; ageError.classList.remove('hidden'); }
    return false;
  }
  if (ageError) ageError.classList.add('hidden');
  return true;
}

function validateIdNumber() {
  const idNumber = document.getElementById('idNumber')?.value || '';
  const idError = document.getElementById('idError');
  if (idNumber.length !== 9 && idNumber.length !== 12) {
    if (idError) { idError.textContent = 'CMND phải có 9 số hoặc CCCD phải có 12 số'; idError.classList.remove('hidden'); }
    return false;
  }
  if (idError) idError.classList.add('hidden');
  return true;
}

function validateEmail() {
  const email = document.getElementById('email')?.value || '';
  const emailError = document.getElementById('emailError');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (emailError) { emailError.textContent = 'Email không hợp lệ'; emailError.classList.remove('hidden'); }
    return false;
  }
  if (emailError) emailError.classList.add('hidden');
  return true;
}

function validatePhone() {
  const phone = document.getElementById('phone')?.value || '';
  const phoneError = document.getElementById('phoneError');
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneRegex.test(phone)) {
    if (phoneError) { phoneError.textContent = 'Số điện thoại phải có 10-11 chữ số'; phoneError.classList.remove('hidden'); }
    return false;
  }
  if (phoneError) phoneError.classList.add('hidden');
  return true;
}

function calculateTotal() {
  const cardType = document.getElementById('cardType');
  const readerType = document.getElementById('readerType');
  const delivery = document.querySelector('input[name="delivery"]:checked');
  if (!cardType?.value || !readerType?.value) return;
  let basePrice = parseInt(cardType.selectedOptions[0].dataset.price) || 0;
  const discount = parseInt(readerType.selectedOptions[0].dataset.discount) || 0;
  basePrice = Math.round(basePrice * (100 - discount) / 100);
  if (delivery && delivery.value === 'home') basePrice += 30000;
  const totalEl = document.getElementById('totalCost');
  if (totalEl) totalEl.textContent = basePrice.toLocaleString('vi-VN') + ' VNĐ';
}

// Image validation
function showPhotoError(msg){ const el=document.getElementById('photoError'); if(el){ el.textContent=msg; el.classList.remove('hidden'); } }
function clearPhotoError(){ const el=document.getElementById('photoError'); if(el){ el.textContent=''; el.classList.add('hidden'); } }

function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  clearPhotoError();
  // Validate type and size (<= 3MB)
  const validTypes = ['image/jpeg','image/png','image/webp'];
  if (!validTypes.includes(file.type)) { showPhotoError('Chỉ chấp nhận ảnh JPEG/PNG/WebP'); event.target.value=''; return; }
  if (file.size > 3*1024*1024) { showPhotoError('Kích thước ảnh tối đa 3MB'); event.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = function (e) {
    const tmpImg = new Image();
    tmpImg.onload = function(){
      // Basic dimension check (>= 300x400)
      if (tmpImg.width < 300 || tmpImg.height < 400) {
        showPhotoError('Kích thước ảnh tối thiểu 300x400');
        event.target.value='';
        return;
      }
      const img = document.getElementById('previewImage');
      if (img) img.src = e.target.result;
      document.getElementById('photoPreview')?.classList.remove('hidden');
      document.getElementById('uploadArea')?.classList.add('hidden');
    };
    tmpImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// (removed duplicate cropper block)

// (removed duplicate form utility and validation functions)

// CropperJS integration
let cropperInstance = null;
function openCropper(){
  const src = document.getElementById('previewImage')?.src;
  if(!src){ alert('Chưa có ảnh để cắt.'); return; }
  const img = document.getElementById('cropperImage');
  img.src = src;
  const modal = document.getElementById('cropperModal');
  modal?.classList.remove('hidden');
  modal?.classList.add('flex');
  // lock body scroll
  document.body.classList.add('modal-open');
  setTimeout(()=>{
    cropperInstance && cropperInstance.destroy();
    cropperInstance = new Cropper(img, { aspectRatio: 3/4, viewMode: 1, autoCropArea: 1, movable: true, zoomable: true, scalable: false, rotatable: false });
  },0);
}
function closeCropper(){
  const modal = document.getElementById('cropperModal');
  modal?.classList.add('hidden');
  modal?.classList.remove('flex');
  document.body.classList.remove('modal-open');
  if (cropperInstance){ cropperInstance.destroy(); cropperInstance = null; }
}
function applyCrop(){
  if(!cropperInstance) return;
  const canvas = cropperInstance.getCroppedCanvas({ width: 300, height: 400 });
  document.getElementById('previewImage').src = canvas.toDataURL('image/jpeg', 0.92);
  closeCropper();
}

function removePhoto() {
  const file = document.getElementById('photoUpload');
  if (file) file.value = '';
  document.getElementById('photoPreview')?.classList.add('hidden');
  document.getElementById('uploadArea')?.classList.remove('hidden');
  clearPhotoError();
}

function handleCardRegistration(event) {
  event.preventDefault();
  const captchaInput = document.getElementById('captchaInput')?.value?.toUpperCase() || '';
  if (captchaInput !== currentCaptcha) { alert('Mã xác thực không đúng. Vui lòng thử lại.'); generateCaptcha(); return; }
  if (!validateAge() || !validateIdNumber() || !validateEmail() || !validatePhone()) { alert('Vui lòng kiểm tra lại thông tin đã nhập.'); return; }
  const formData = {
    cardType: document.getElementById('cardType')?.value,
    readerType: document.getElementById('readerType')?.value,
    fullName: document.getElementById('fullName')?.value,
    gender: document.getElementById('gender')?.value,
    birthDate: document.getElementById('birthDate')?.value,
    idNumber: document.getElementById('idNumber')?.value,
    address: document.getElementById('address')?.value,
    email: document.getElementById('email')?.value,
    phone: document.getElementById('phone')?.value,
    occupation: document.getElementById('occupation')?.value,
    workplace: document.getElementById('workplace')?.value,
    nationality: document.getElementById('nationality')?.value,
    delivery: document.querySelector('input[name="delivery"]:checked')?.value,
    totalCost: document.getElementById('totalCost')?.textContent
  };
  const registrationCode = 'DK' + new Date().getFullYear() + Math.random().toString().substr(2, 6);
  // Persist to localStorage
  const records = JSON.parse(localStorage.getItem('registrations')||'[]');
  records.push({ code: registrationCode, name: formData.fullName, phone: formData.phone, birth: formData.birthDate, cardType: formData.cardType, total: formData.totalCost, createdAt: Date.now() });
  localStorage.setItem('registrations', JSON.stringify(records));
  // Update UI
  document.getElementById('registrationCode').textContent = registrationCode;
  document.getElementById('successName').textContent = formData.fullName || '';
  document.getElementById('successCardType').textContent = document.getElementById('cardType')?.selectedOptions?.[0]?.text || '';
  document.getElementById('successTotal').textContent = formData.totalCost || '';
  const transfer = registrationCode + ' ' + (formData.fullName || '');
  document.getElementById('transferContent').textContent = transfer;
  // Generate QR text with amount (if parseable)
  const amount = (formData.totalCost||'').replace(/[^0-9]/g,'');
  let qrText = transfer;
  if (amount) qrText = `${transfer} | Amount=${amount}`;
  const qrWrap = document.getElementById('qrCode');
  if (qrWrap) { qrWrap.innerHTML = ''; new QRCode(qrWrap, { text: qrText, width: 200, height: 200 }); }
  showCardSection('success');
}

function handleCardLookup(event) {
  event.preventDefault();
  const name = document.getElementById('lookupName')?.value || '';
  const birth = document.getElementById('lookupBirth')?.value || '';
  const phone = document.getElementById('lookupPhone')?.value || '';
  const records = JSON.parse(localStorage.getItem('registrations')||'[]');
  const matched = records.find(r => r.name?.toLowerCase()===name.toLowerCase() && r.birth===birth && r.phone===phone);
  let randomStatus = 'Đang xét duyệt';
  let registrationCode = 'DK' + new Date().getFullYear() + Math.random().toString().substr(2, 6);
  if (matched){ registrationCode = matched.code; randomStatus = 'Đăng ký thành công'; }
  let statusColor = 'text-blue-600';
  if (randomStatus === 'Đăng ký thành công') statusColor = 'text-green-600';
  if (randomStatus === 'Đang xét duyệt') statusColor = 'text-yellow-600';
  if (randomStatus === 'Đã được duyệt') statusColor = 'text-purple-600';
  const results = document.getElementById('lookupContent');
  if (results) {
    results.innerHTML = `
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold mb-2">Thông tin tìm thấy:</h4>
        <p><strong>Họ tên:</strong> ${name}</p>
        <p><strong>Mã đăng ký:</strong> ${registrationCode}</p>
        <p><strong>Trạng thái:</strong> <span class="${statusColor} font-semibold">${randomStatus}</span></p>
        <p><strong>Ngày đăng ký:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
      </div>`;
  }
  document.getElementById('lookupResults')?.classList.remove('hidden');
}

function downloadQR() {
  const qrWrap = document.getElementById('qrCode');
  if (!qrWrap) return;
  const img = qrWrap.querySelector('img') || qrWrap.querySelector('canvas');
  if (!img) { alert('Chưa có mã QR để tải.'); return; }
  const link = document.createElement('a');
  link.download = 'qr-payment.png';
  link.href = img.tagName.toLowerCase() === 'canvas' ? img.toDataURL('image/png') : img.src;
  link.click();
}

function previewCard() {
  document.getElementById('previewCardId').textContent = document.getElementById('registrationCode').textContent;
  document.getElementById('previewCardName').textContent = document.getElementById('successName').textContent;
  document.getElementById('previewCardType').textContent = document.getElementById('successCardType').textContent;
  const modal = document.getElementById('cardPreviewModal');
  modal?.classList.remove('hidden');
  modal?.classList.add('flex');
}

function closeCardPreview() {
  const modal = document.getElementById('cardPreviewModal');
  modal?.classList.add('hidden');
  modal?.classList.remove('flex');
}

// Books catalog
function paginate(items, page, size) {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

function renderBookCards(list) {
  const bookGrid = document.getElementById('bookGrid');
  if (!bookGrid) return;
  bookGrid.innerHTML = '';
  list.forEach(book => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-lg overflow-hidden card-hover cursor-pointer';
    card.onclick = () => showBookDetails(book);
    card.innerHTML = `
      <div class="p-6">
        <div class="text-4xl mb-4">📚</div>
        <h3 class="text-lg font-semibold mb-2 text-gray-800">${book.title}</h3>
        <p class="text-gray-600 mb-2">Tác giả: ${book.author}</p>
        <p class="text-sm text-gray-500 mb-3">Thể loại: ${book.category}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs px-2 py-1 rounded-full ${book.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${book.available ? 'Có sẵn' : 'Đã mượn'}</span>
          <button class="text-purple-600 hover:text-purple-800 text-sm font-semibold">Xem chi tiết</button>
        </div>
      </div>`;
    bookGrid.appendChild(card);
  });
}

function renderPagination(totalItems, page, size) {
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  const container = document.getElementById('pagination');
  if (!container) return;
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'flex space-x-2';
  const addBtn = (label, targetPage, disabled, isActive=false) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = `px-4 py-2 rounded-lg ${isActive ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    if (!disabled) btn.onclick = () => renderBookPage(targetPage, currentBookList);
    wrap.appendChild(btn);
  };
  addBtn('Trước', Math.max(1, page - 1), page === 1);
  // show up to 5 pages
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) addBtn(String(p), p, false, p === page);
  addBtn('Sau', Math.min(totalPages, page + 1), page === totalPages);
  container.appendChild(wrap);
}

function renderBookPage(page, list) {
  currentBookPage = page;
  const pageItems = paginate(list, page, pageSize);
  renderBookCards(pageItems);
  renderPagination(list.length, page, pageSize);
}

function searchBooks() {
  const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  const category = document.getElementById('categoryFilter')?.value?.toLowerCase() || '';
  currentBookList = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm);
    const matchesCategory = !category || book.category.toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });
  renderBookPage(1, currentBookList);
}

function showBookDetails(book) {
  currentBookForAction = book;
  document.getElementById('bookTitle').textContent = book.title;
  const cover = book.cover ? `<img src="${book.cover}" alt="${book.title}" class="w-full h-64 md:h-72 object-cover rounded-lg mb-4">` : '';
  document.getElementById('bookDetails').innerHTML = `
    ${cover}
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <p><strong>Tác giả:</strong> ${book.author}</p>
        <p><strong>Thể loại:</strong> ${book.category}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>Nhà xuất bản:</strong> ${book.publisher}</p>
      </div>
      <div>
        <p><strong>Năm xuất bản:</strong> ${book.year}</p>
        <p><strong>Số trang:</strong> ${book.pages}</p>
        <p><strong>Vị trí:</strong> ${book.location}</p>
        <p><strong>Trạng thái:</strong> <span class="px-2 py-1 rounded-full text-sm ${book.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${book.available ? 'Có sẵn' : 'Đã mượn'}</span></p>
      </div>
    </div>
    <div class="mt-4">
      <p><strong>Mô tả:</strong></p>
      <p class="text-gray-600 mt-2">${book.description}</p>
    </div>
    <div class="flex flex-wrap gap-3 mt-6">
      <button onclick="openBorrowModal()" class="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700">Mượn sách</button>
      <button onclick="openReserveModal()" class="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300">Đặt trước</button>
      <button onclick="openExtendModal()" class="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">Gia hạn</button>
    </div>`;
  const modal = document.getElementById('bookModal');
  modal?.classList.remove('hidden');
  modal?.classList.add('flex');
}

function closeBookModal() {
  const modal = document.getElementById('bookModal');
  modal?.classList.add('hidden');
  modal?.classList.remove('flex');
}

// Member
function showLoginForm() {
  document.getElementById('loginForm')?.classList.remove('hidden');
  document.getElementById('registerForm')?.classList.add('hidden');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  if (loginTab) loginTab.className = 'flex-1 py-4 px-6 text-center font-semibold bg-purple-600 text-white';
  if (registerTab) registerTab.className = 'flex-1 py-4 px-6 text-center font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200';
}

function showRegisterForm() {
  document.getElementById('loginForm')?.classList.add('hidden');
  document.getElementById('registerForm')?.classList.remove('hidden');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  if (loginTab) loginTab.className = 'flex-1 py-4 px-6 text-center font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200';
  if (registerTab) registerTab.className = 'flex-1 py-4 px-6 text-center font-semibold bg-purple-600 text-white';
}

function handleLogin(event) {
  event.preventDefault();
  isLoggedIn = true;
  showMemberDashboard();
}

function handleRegister(event) {
  event.preventDefault();
  alert('Đăng ký thành công! Vui lòng đến thư viện để nhận thẻ thành viên.');
}

function showMemberDashboard() {
  document.querySelector('#memberPage .bg-white.rounded-lg.shadow-lg.overflow-hidden')?.classList.add('hidden');
  document.getElementById('memberDashboard')?.classList.remove('hidden');
}

function logout() {
  isLoggedIn = false;
  document.querySelector('#memberPage .bg-white.rounded-lg.shadow-lg.overflow-hidden')?.classList.remove('hidden');
  document.getElementById('memberDashboard')?.classList.add('hidden');
  showLoginForm();
}

// Admin
function showAdminTab(tabName) {
  document.querySelectorAll('.admin-content').forEach(c => c.classList.add('hidden'));
  document.getElementById(tabName + 'Admin')?.classList.remove('hidden');
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.className = 'admin-tab px-6 py-4 font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 whitespace-nowrap';
  });
  document.getElementById(tabName + 'Tab').className = 'admin-tab px-6 py-4 font-semibold bg-purple-600 text-white whitespace-nowrap';
}

function showAddBookForm() { alert('Chức năng thêm sách mới sẽ được triển khai trong phiên bản tiếp theo.'); }

// Booking
function showBookingForm() {
  const modal = document.getElementById('bookingModal');
  modal?.classList.remove('hidden');
  modal?.classList.add('flex');
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  modal?.classList.add('hidden');
  modal?.classList.remove('flex');
}

function handleBooking(event) { event.preventDefault(); alert('Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn để xác nhận.'); closeBookingModal(); }

// Articles
function showArticle(articleId) {
  const article = articles[articleId];
  if (!article) return;
  document.getElementById('articleTitle').textContent = article.title;
  document.getElementById('articleSummary').textContent = article.summary;
  document.getElementById('articleDate').textContent = article.date;
  document.getElementById('articleAuthor').textContent = article.author;
  document.getElementById('articleViews').textContent = article.views;
  document.getElementById('articleCategory').textContent = article.category;
  document.getElementById('articleTag').textContent = article.tag;
  document.getElementById('articleIcon').textContent = article.icon;
  document.getElementById('articleImageTitle').textContent = article.imageTitle;
  const articleImage = document.getElementById('articleImage');
  articleImage.className = `h-64 md:h-80 bg-gradient-to-r ${article.gradient} flex items-center justify-center text-white`;
  updateArticleContent(articleId);
  showPage('article');
}

function updateArticleContent(articleId) {
  const el = document.getElementById('articleContent');
  if (!el) return;
  if (articleId === 'exhibition') {
    el.innerHTML = `
      <p><strong>Đà Nẵng</strong> - Nhân dịp kỷ niệm 25 năm thành lập thành phố trực thuộc Trung ương (1997-2022), Thư viện Khoa học Tổng hợp Đà Nẵng tổ chức triển lãm ảnh và tư liệu "Đà Nẵng - 25 năm phát triển".</p>
      <p>Triển lãm trưng bày hơn 200 tấm ảnh quý hiếm và tư liệu lịch sử, ghi lại những dấu mốc quan trọng trong quá trình phát triển của thành phố từ một thị xã nhỏ thành đô thị hiện đại, năng động.</p>
      <h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">Nội dung triển lãm</h2>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Giai đoạn 1997-2007:</strong> Những bước đi đầu tiên của thành phố trẻ</li>
        <li><strong>Giai đoạn 2008-2017:</strong> Bứt phá và phát triển toàn diện</li>
        <li><strong>Giai đoạn 2018-2022:</strong> Hướng tới thành phố thông minh, bền vững</li>
      </ul>
      <p>Đặc biệt, triển lãm còn có khu vực tương tác với công nghệ thực tế ảo (VR), cho phép khách tham quan "du hành" qua các địa danh nổi tiếng của Đà Nẵng.</p>`;
  } else if (articleId === 'app') {
    el.innerHTML = `
      <p><strong>Đà Nẵng</strong> - Thư viện Khoa học Tổng hợp Đà Nẵng chính thức ra mắt ứng dụng di động "Smart Library DN" với nhiều tính năng thông minh, ứng dụng công nghệ AI để nâng cao trải nghiệm người dùng.</p>
      <h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">Tính năng nổi bật</h2>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Tìm kiếm thông minh:</strong> Sử dụng AI để hiểu ý định tìm kiếm của người dùng</li>
        <li><strong>Đặt chỗ online:</strong> Đặt trước chỗ ngồi, phòng học nhóm</li>
        <li><strong>Thông báo thông minh:</strong> Nhắc nhở hạn trả sách, sự kiện mới</li>
        <li><strong>Đọc sách điện tử:</strong> Thư viện số với hàng nghìn đầu sách</li>
        <li><strong>Hỗ trợ giọng nói:</strong> Tương tác bằng tiếng Việt tự nhiên</li>
      </ul>
      <p>Ứng dụng được phát triển bởi đội ngũ kỹ sư trẻ của thành phố, tích hợp nhiều công nghệ tiên tiến như machine learning, natural language processing.</p>`;
  } else if (articleId === 'course') {
    el.innerHTML = `
      <p><strong>Đà Nẵng</strong> - Nhằm thu hẹp khoảng cách số và giúp người cao tuổi hòa nhập với thời đại công nghệ, Thư viện Khoa học Tổng hợp Đà Nẵng mở lớp đào tạo kỹ năng số miễn phí.</p>
      <h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">Nội dung khóa học</h2>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Tuần 1-2:</strong> Làm quen với máy tính, chuột, bàn phím</li>
        <li><strong>Tuần 3-4:</strong> Sử dụng internet cơ bản, tìm kiếm thông tin</li>
        <li><strong>Tuần 5-6:</strong> Email, mạng xã hội an toàn</li>
        <li><strong>Tuần 7-8:</strong> Thanh toán điện tử, dịch vụ công trực tuyến</li>
      </ul>
      <blockquote class="border-l-4 border-orange-500 pl-6 italic text-gray-600 bg-gray-50 p-4 rounded-r-lg">"Chúng tôi muốn mọi người dân, dù ở độ tuổi nào, đều có thể tận hưởng những tiện ích của công nghệ số."<footer class="mt-2 text-sm font-semibold">- Bà Nguyễn Thị Hoa, Trưởng phòng Đào tạo</footer></blockquote>
      <p>Khóa học được tổ chức 3 buổi/tuần, mỗi buổi 2 tiếng, với sĩ số tối đa 15 học viên để đảm bảo chất lượng giảng dạy.</p>`;
  } else {
    el.innerHTML = '';
  }
}

function printArticle() { window.print(); }
function handleComment(event) { event.preventDefault(); alert('Cảm ơn bạn đã bình luận! Bình luận sẽ được duyệt trước khi hiển thị.'); event.target.reset(); }

// Init
document.addEventListener('DOMContentLoaded', function () {
  showPage('home');
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') searchBooks(); });
  }
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('fade-in'); }); });
  document.querySelectorAll('.card-hover').forEach(el => observer.observe(el));

  // Weather: fetch live data for Đà Nẵng via Open-Meteo
  try { initWeatherWidget(); } catch(e) { /* no-op */ }
});

// Close modals when clicking outside
window.onclick = function (event) {
  const bookModal = document.getElementById('bookModal');
  const bookingModal = document.getElementById('bookingModal');
  const cardPreviewModal = document.getElementById('cardPreviewModal');
  const cropperModal = document.getElementById('cropperModal');
  const eventModal = document.getElementById('eventModal');
  const borrowModal = document.getElementById('borrowModal');
  const reserveModal = document.getElementById('reserveModal');
  const extendModal = document.getElementById('extendModal');
  if (event.target === bookModal) closeBookModal();
  if (event.target === bookingModal) closeBookingModal();
  if (event.target === cardPreviewModal) closeCardPreview();
  if (event.target === cropperModal) closeCropper();
  if (event.target === eventModal) closeEventModal();
  if (event.target === borrowModal) closeBorrowModal();
  if (event.target === reserveModal) closeReserveModal();
  if (event.target === extendModal) closeExtendModal();
};

// Borrow / Reserve / Extend flows
function openBorrowModal(){ const m=document.getElementById('borrowModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeBorrowModal(){ const m=document.getElementById('borrowModal'); m.classList.add('hidden'); m.classList.remove('flex'); }
function openReserveModal(){ const m=document.getElementById('reserveModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeReserveModal(){ const m=document.getElementById('reserveModal'); m.classList.add('hidden'); m.classList.remove('flex'); }
function openExtendModal(){ const m=document.getElementById('extendModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeExtendModal(){ const m=document.getElementById('extendModal'); m.classList.add('hidden'); m.classList.remove('flex'); }

function handleBorrow(e){
  e.preventDefault();
  if (!currentBookForAction){ alert('Chưa chọn sách.'); return; }
  const readerId = document.getElementById('borrowReaderId')?.value?.trim();
  const borrowDate = document.getElementById('borrowDate')?.value;
  const days = parseInt(document.getElementById('borrowDays')?.value||'14',10);
  if (!readerId || !borrowDate || !days){ alert('Vui lòng nhập đầy đủ thông tin.'); return; }
  const due = new Date(borrowDate); due.setDate(due.getDate()+days);
  const loans = JSON.parse(localStorage.getItem('loans')||'[]');
  loans.push({ bookId: currentBookForAction.id, title: currentBookForAction.title, readerId, borrowDate, days, due: due.toISOString().slice(0,10) });
  localStorage.setItem('loans', JSON.stringify(loans));
  alert(`Đã mượn: ${currentBookForAction.title}\nHạn trả: ${due.toLocaleDateString('vi-VN')}`);
  closeBorrowModal();
}

function handleReserve(e){
  e.preventDefault();
  if (!currentBookForAction){ alert('Chưa chọn sách.'); return; }
  const readerId = document.getElementById('reserveReaderId')?.value?.trim();
  const reserveDate = document.getElementById('reserveDate')?.value;
  if (!readerId || !reserveDate){ alert('Vui lòng nhập đầy đủ thông tin.'); return; }
  const reserves = JSON.parse(localStorage.getItem('reserves')||'[]');
  reserves.push({ bookId: currentBookForAction.id, title: currentBookForAction.title, readerId, reserveDate });
  localStorage.setItem('reserves', JSON.stringify(reserves));
  alert(`Đã đặt trước: ${currentBookForAction.title}\nNgày nhận dự kiến: ${new Date(reserveDate).toLocaleDateString('vi-VN')}`);
  closeReserveModal();
}

function handleExtend(e){
  e.preventDefault();
  if (!currentBookForAction){ alert('Chưa chọn sách.'); return; }
  const readerId = document.getElementById('extendReaderId')?.value?.trim();
  const extendDays = parseInt(document.getElementById('extendDays')?.value||'7',10);
  if (!readerId || !extendDays){ alert('Vui lòng nhập đầy đủ thông tin.'); return; }
  const loans = JSON.parse(localStorage.getItem('loans')||'[]');
  const idx = loans.findIndex(l => l.bookId===currentBookForAction.id && l.readerId===readerId);
  if (idx === -1){ alert('Không tìm thấy bản ghi mượn phù hợp để gia hạn.'); return; }
  const oldDue = new Date(loans[idx].due);
  oldDue.setDate(oldDue.getDate()+extendDays);
  loans[idx].due = oldDue.toISOString().slice(0,10);
  localStorage.setItem('loans', JSON.stringify(loans));
  alert(`Đã gia hạn: ${currentBookForAction.title}\nHạn mới: ${oldDue.toLocaleDateString('vi-VN')}`);
  closeExtendModal();
}

// Upcoming Events
const events = {
  ai: {
    title: 'Hội thảo "AI trong thư viện"',
    time: '15/12/2024 - 14:00',
    place: 'Hội trường A',
    desc: 'Chia sẻ về ứng dụng AI trong tìm kiếm, phân loại, phục vụ bạn đọc và quản trị thư viện.'
  },
  club: {
    title: 'Câu lạc bộ đọc sách',
    time: '18/12/2024 - 19:00',
    place: 'Phòng đọc 2',
    desc: 'Sinh hoạt định kỳ, thảo luận về chủ đề sách tháng 12 và chia sẻ cảm nhận.'
  },
  cv: {
    title: 'Workshop viết CV',
    time: '20/12/2024 - 15:30',
    place: 'Phòng máy tính',
    desc: 'Hướng dẫn viết CV chuyên nghiệp, tối ưu hồ sơ cho nhà tuyển dụng.'
  }
};

function showEvent(id){
  const ev = events[id];
  if (!ev) return;
  document.getElementById('eventTitle').textContent = ev.title;
  const content = document.getElementById('eventContent');
  content.innerHTML = `
    <p><strong>Thời gian:</strong> ${ev.time}</p>
    <p><strong>Địa điểm:</strong> ${ev.place}</p>
    <p class="text-gray-700">${ev.desc}</p>`;
  const modal = document.getElementById('eventModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
function closeEventModal(){
  const modal = document.getElementById('eventModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Weather widget (Đà Nẵng live)
async function initWeatherWidget(){
  // Da Nang coordinates
  const lat = 16.0544, lon = 108.2022;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FHo_Chi_Minh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  const cur = data.current;
  if (!cur) return;
  const code = cur.weather_code;
  const mapping = weatherCodeMapping(code);
  // Update UI if widget exists
  const container = document.querySelector('[data-weather-widget]');
  if (!container) return;
  const tempEl = container.querySelector('[data-temp]');
  const descEl = container.querySelector('[data-desc]');
  const humidEl = container.querySelector('[data-humid]');
  const windEl = container.querySelector('[data-wind]');
  const iconEl = container.querySelector('[data-icon]');
  if (tempEl) tempEl.textContent = `${Math.round(cur.temperature_2m)}°C`;
  if (descEl) descEl.textContent = mapping.text;
  if (humidEl) humidEl.textContent = `💧 Độ ẩm: ${cur.relative_humidity_2m}%`;
  if (windEl) windEl.textContent = `💨 Gió: ${Math.round(cur.wind_speed_10m)} km/h`;
  if (iconEl) iconEl.textContent = mapping.emoji;
}

function weatherCodeMapping(code){
  // Based on WMO weather interpretation codes
  if ([0].includes(code)) return { text: 'Trời quang mây', emoji: '☀️' };
  if ([1,2].includes(code)) return { text: 'Ít mây', emoji: '🌤️' };
  if ([3].includes(code)) return { text: 'Nhiều mây', emoji: '⛅' };
  if ([45,48].includes(code)) return { text: 'Sương mù', emoji: '🌫️' };
  if ([51,53,55,56,57].includes(code)) return { text: 'Mưa phùn', emoji: '🌦️' };
  if ([61,63,65].includes(code)) return { text: 'Mưa rào', emoji: '🌧️' };
  if ([66,67].includes(code)) return { text: 'Mưa lạnh', emoji: '🌧️' };
  if ([71,73,75,77].includes(code)) return { text: 'Tuyết', emoji: '❄️' };
  if ([80,81,82].includes(code)) return { text: 'Mưa to', emoji: '🌧️' };
  if ([85,86].includes(code)) return { text: 'Mưa tuyết', emoji: '❄️' };
  if ([95].includes(code)) return { text: 'Dông', emoji: '⛈️' };
  if ([96,99].includes(code)) return { text: 'Dông kèm mưa đá', emoji: '⛈️' };
  return { text: 'Thời tiết không xác định', emoji: '❔' };
}

// Close cropper on Esc
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') {
    const modal = document.getElementById('cropperModal');
    if (modal && !modal.classList.contains('hidden')) closeCropper();
  }
});
