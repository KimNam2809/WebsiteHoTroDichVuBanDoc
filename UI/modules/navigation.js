import { openModal, closeModal } from './utils.js';
import * as catalog from './catalog.js';
import { generateCaptcha } from './card.js';
import { updateGlobalCounts } from './stats.js';

export function showPage(page){
  document.querySelectorAll('.page-content').forEach(el=>el.classList.add('hidden'));
  const map={ home:'#homePage', catalog:'#catalogPage', services:'#servicesPage', member:'#memberPage', admin:'#adminPage', cardRegistration:'#cardRegistrationPage', article:'#articlePage' };
  const id=map[page]||'#homePage';
  document.querySelector(id)?.classList.remove('hidden');
  localStorage.setItem('currentPage', page);
  // highlight nav
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll(`button[data-nav="${page}"]`).forEach(b=>b.classList.add('active'));
  // init per-page
  if(page==='catalog') catalog.ensureInit();
  if(page==='cardRegistration') generateCaptcha();
  // update global counters when navigating
  updateGlobalCounts();
  // close mobile
  document.getElementById('mobileMenu')?.classList.add('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
}

export function restoreLastPage(){ showPage(localStorage.getItem('currentPage')||'home'); }
export function toggleMobileMenu(){ document.getElementById('mobileMenu')?.classList.toggle('hidden'); }
export function initSearchEnter(){ document.getElementById('searchInput')?.addEventListener('keydown',e=>{ if(e.key==='Enter') window.searchBooks?.(); }); }
export function initAnimations(){ const els=document.querySelectorAll('.fade-in'); const io=new IntersectionObserver((ents)=>{ ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('fade-in--visible'); io.unobserve(en.target); } }); },{threshold:0.1}); els.forEach(el=>io.observe(el)); }
