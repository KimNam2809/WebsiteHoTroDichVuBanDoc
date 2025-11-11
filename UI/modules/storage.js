// modules/storage.js
// Unified localStorage wrapper with namespacing, versioning and JSON safety.

const NS = 'tvdn';
const VERSION = 1;

function key(k){ return `${NS}:${k}`; }

function parse(raw, fallback){
  try { return raw==null ? fallback : JSON.parse(raw); } catch { return fallback; }
}

export function getJSON(k, fallback=null){ return parse(localStorage.getItem(key(k)), fallback); }
export function setJSON(k, val){ localStorage.setItem(key(k), JSON.stringify(val)); }
export function remove(k){ localStorage.removeItem(key(k)); }
export function exists(k){ return localStorage.getItem(key(k))!=null; }

// Migrate legacy plain keys to namespaced keys (one-time best-effort)
export function migrateLegacy(){
  const mappings = [
    ['loans','loans'],
    ['reservations','reservations'],
    ['registrations','registrations'],
    ['member','member'],
    ['visitsToday','visitsToday'],
    ['memberLoans','memberLoans'],
    ['memberRead','memberRead'],
    ['memberPoints','memberPoints']
  ];
  mappings.forEach(([legacy,newKey])=>{
    if(localStorage.getItem(legacy)!=null && !exists(newKey)){
      localStorage.setItem(key(newKey), localStorage.getItem(legacy));
    }
  });
  localStorage.setItem(key('version'), String(VERSION));
}

// Helper domain-specific shortcuts
export const storage = {
  getLoans: ()=> getJSON('loans', []),
  setLoans: (v)=> setJSON('loans', v),
  getReservations: ()=> getJSON('reservations', []),
  setReservations: (v)=> setJSON('reservations', v),
  getRegistrations: ()=> getJSON('registrations', []),
  setRegistrations: (v)=> setJSON('registrations', v),
  getVisitsToday: ()=> getJSON('visitsToday', {}),
  setVisitsToday: (v)=> setJSON('visitsToday', v),
  getMember: ()=> getJSON('member', null),
  setMember: (m)=> setJSON('member', m)
};

// Auto migrate on module load
migrateLegacy();
