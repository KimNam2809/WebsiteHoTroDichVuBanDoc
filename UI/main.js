import * as nav from './modules/navigation.js';
import * as articles from './modules/articles.js';
import * as catalog from './modules/catalog.js';
import * as card from './modules/card.js';
import * as member from './modules/member.js';
import * as admin from './modules/admin.js';
import * as booking from './modules/booking.js';
import { initWeatherWidget } from './modules/weather.js';
import { initGlobalEscClose, initOutsideClickClose } from './modules/utils.js';
import { initAPI } from './modules/api.js';
import { updateGlobalCounts } from './modules/stats.js';
import { initAI, openChat as openAIChat, closeChat as closeAIChat, autofillCard as aiAutofillCard } from './modules/ai.js';

// Attach functions to window for HTML inline handlers
Object.assign(window, {
  // navigation
  showPage: nav.showPage,
  toggleMobileMenu: nav.toggleMobileMenu,
  // articles
  showArticle: articles.showArticle,
  printArticle: articles.printArticle,
  handleComment: articles.handleComment,
  // events
  showEvent: articles.showEvent,
  closeEventModal: articles.closeEventModal,
  // catalog
  searchBooks: catalog.searchBooks,
  showBookDetails: catalog.showBookDetails,
  openBorrowModal: catalog.openBorrowModal,
  closeBorrowModal: catalog.closeBorrowModal,
  handleBorrow: catalog.handleBorrow,
  openReserveModal: catalog.openReserveModal,
  closeReserveModal: catalog.closeReserveModal,
  handleReserve: catalog.handleReserve,
  openExtendModal: catalog.openExtendModal,
  closeExtendModal: catalog.closeExtendModal,
  handleExtend: catalog.handleExtend,
  // card registration
  showCardSection: card.showCardSection,
  calculateTotal: card.calculateTotal,
  validateAge: card.validateAge,
  validateIdNumber: card.validateIdNumber,
  validateEmail: card.validateEmail,
  validatePhone: card.validatePhone,
  handlePhotoUpload: card.handlePhotoUpload,
  showPhotoError: card.showPhotoError,
  clearPhotoError: card.clearPhotoError,
  openCropper: card.openCropper,
  closeCropper: card.closeCropper,
  applyCrop: card.applyCrop,
  removePhoto: card.removePhoto,
  generateCaptcha: card.generateCaptcha,
  handleCardRegistration: card.handleCardRegistration,
  downloadQR: card.downloadQR,
  previewCard: card.previewCard,
  closeCardPreview: card.closeCardPreview,
  handleCardLookup: card.handleCardLookup,
  // member
  showLoginForm: member.showLoginForm,
  showRegisterForm: member.showRegisterForm,
  handleLogin: member.handleLogin,
  handleRegister: member.handleRegister,
  logout: member.logout,
  // admin
  showAdminTab: admin.showAdminTab,
  showAddBookForm: admin.showAddBookForm,
  // booking
  showBookingForm: booking.showBookingForm,
  closeBookingModal: booking.closeBookingModal,
  handleBooking: booking.handleBooking,
  // AI helpers
  openAIChat: openAIChat,
  closeAIChat: closeAIChat,
  aiAutofillCard: aiAutofillCard,
});

// Bootstrap
(async function init() {
  initAPI();
  nav.restoreLastPage();
  initWeatherWidget();
  // AI Assistant
  initAI();
  nav.initSearchEnter();
  nav.initAnimations();
  initGlobalEscClose(['bookModal','borrowModal','reserveModal','extendModal','bookingModal','cardPreviewModal','eventModal','cropperModal','aiChatModal']);
  initOutsideClickClose(['bookModal','borrowModal','reserveModal','extendModal','bookingModal','cardPreviewModal','eventModal','cropperModal','aiChatModal']);
  member.autoDashboard();
  member.bindMemberInteractions?.();
  // Update global quick stats
  updateGlobalCounts();

  // Delegated navigation
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-nav]');
    if (t) { e.preventDefault(); nav.showPage(t.dataset.nav); }
  });
  // Mobile menu toggle
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action="toggle-mobile"]');
    if (t) { e.preventDefault(); nav.toggleMobileMenu(); }
  });
  // Article open
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-article]');
    if (t) { e.preventDefault(); articles.showArticle(t.dataset.article); }
  });
  // Article actions (print)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-article-action="print"]');
    if (t) { e.preventDefault(); articles.printArticle?.(); }
  });
  // Event details
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-event]');
    if (t) { e.preventDefault(); articles.showEvent(t.dataset.event); }
  });
  // Card section navigation
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-card-section]');
    if (t) { e.preventDefault(); card.showCardSection(t.dataset.cardSection); if (t.dataset.cardSection==='form') card.generateCaptcha(); }
  });
  // Captcha refresh
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-captcha="refresh"]');
    if (t) { e.preventDefault(); card.generateCaptcha(); }
  });
  // Photo actions
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-photo]');
    if (!p) return;
    e.preventDefault();
    const act = p.dataset.photo;
    if (act==='pick') document.getElementById('photoUpload')?.click();
    else if (act==='crop') card.openCropper();
    else if (act==='remove') card.removePhoto();
    else if (act==='apply') card.applyCrop();
    else if (act==='cancel') card.closeCropper();
  });
  // Inputs: dynamic calculates and validations
  document.getElementById('cardType')?.addEventListener('change', card.calculateTotal);
  document.getElementById('readerType')?.addEventListener('change', card.calculateTotal);
  document.querySelectorAll('input[name="delivery"]').forEach(el=> el.addEventListener('change', card.calculateTotal));
  document.getElementById('birthDate')?.addEventListener('change', card.validateAge);
  document.getElementById('idNumber')?.addEventListener('blur', card.validateIdNumber);
  document.getElementById('email')?.addEventListener('blur', card.validateEmail);
  document.getElementById('phone')?.addEventListener('blur', card.validatePhone);
  document.getElementById('photoUpload')?.addEventListener('change', card.handlePhotoUpload);

  // Forms
  document.getElementById('registrationForm')?.addEventListener('submit', card.handleCardRegistration);
  document.getElementById('cardLookupForm')?.addEventListener('submit', card.handleCardLookup);
  document.getElementById('borrowForm')?.addEventListener('submit', catalog.handleBorrow);
  document.getElementById('reserveForm')?.addEventListener('submit', catalog.handleReserve);
  document.getElementById('extendForm')?.addEventListener('submit', catalog.handleExtend);
  document.getElementById('bookingForm')?.addEventListener('submit', booking.handleBooking);

  // Member
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('#loginTab, #registerTab');
    if (!t) return;
    e.preventDefault();
    if (t.id==='loginTab') member.showLoginForm(); else member.showRegisterForm();
  });
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-member="logout"]');
    if (t) { e.preventDefault(); member.logout(); }
  });
  // Admin (extended tabs)
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('#booksTab,#membersTab,#loansTab,#reportsTab,#approvalsTab,#reservationsTab,#violationsTab,#notifyTab,#monitorTab,#configTab');
    if (btn) { e.preventDefault(); const id = btn.id.replace('Tab',''); admin.showAdminTab(id); }
  });
    admin.applyAdminRoleVisibility?.();
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-admin="add-book"]');
    if (t) { e.preventDefault(); admin.showAddBookForm(); }
  });
  // Booking open
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-action="open-booking"]');
    if (t) { e.preventDefault(); booking.showBookingForm(); }
  });
  // Search books CTA
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-action="search-books"]');
    if (t) { e.preventDefault(); catalog.searchBooks(); }
  });
  // Card extras: download QR and preview
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-card="download-qr"]');
    if (t) { e.preventDefault(); card.downloadQR?.(); }
  });
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-card="preview"]');
    if (t) { e.preventDefault(); card.previewCard?.(); }
  });
  // Member dashboard panel switching
  document.addEventListener('click', (e)=>{
    const sw = e.target.closest('[data-member-panel]');
    if(!sw) return; e.preventDefault();
    const target = sw.getAttribute('data-member-panel');
    document.querySelectorAll('[data-member-panel]').forEach(b=>{
      if(b===sw) b.classList.add('bg-purple-600','text-white'); else b.classList.remove('bg-purple-600','text-white');
    });
    document.querySelectorAll('#memberPanelBody [data-member-section]').forEach(sec=>{
      if(sec.getAttribute('data-member-section')===target) sec.classList.remove('hidden'); else sec.classList.add('hidden');
    });
    const titleMap={loans:'Sách đang mượn',history:'Lịch sử mượn trả',notifications:'Thông báo',profile:'Cập nhật hồ sơ'};
    const titleEl=document.getElementById('memberPanelTitle');
    if(titleEl) titleEl.textContent=titleMap[target]||'';
  });

  // Role-based tab visibility (simple)
  const role = localStorage.getItem('userRole'); // guest/member/staff/admin
    if(role && role!=='admin'){ // hide admin-only tabs if not admin
      const adminOnly=['monitorTab','configTab'];
      adminOnly.forEach(id=> document.getElementById(id)?.classList.add('hidden'));
    }
    if(role && !['staff','admin'].includes(role)){
      ['approvalsTab','reservationsTab','violationsTab','notifyTab'].forEach(id=> document.getElementById(id)?.classList.add('hidden'));
  }
  // Generic modal close buttons
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-modal="close"]');
    if (t) {
      e.preventDefault();
      const id = t.dataset.target;
      if (id) {
        const el = document.getElementById(id);
        el?.classList.add('hidden');
        el?.classList.remove('flex');
      }
    }
  });
})();
