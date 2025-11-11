import { api } from './api.js';
import { storage } from './storage.js';

function formatNumber(n){ return (n||0).toLocaleString('vi-VN'); }

export async function updateGlobalCounts(){
  try{
    const [books, members] = await Promise.all([api.getBooks(), api.getMembers()]);
  const loans = storage.getLoans();
    const visits = bumpVisits();
    const setText=(id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
    setText('totalBooksCount', formatNumber(books.length));
    setText('totalMembersCount', formatNumber(members.length));
    setText('loansActiveCount', formatNumber(loans.length));
    setText('visitsTodayCount', formatNumber(visits));
  }catch(e){ /* noop */ }
}

function bumpVisits(){
  const today=(new Date()).toISOString().slice(0,10);
  const data=storage.getVisitsToday();
  if(data.date!==today){ data.date=today; data.count=0; }
  data.count=(data.count||0)+1;
  storage.setVisitsToday(data);
  return data.count;
}

export function notifyChange(){
  // Small debounce to allow DOM updates in flows before refreshing counters
  setTimeout(updateGlobalCounts, 0);
}
