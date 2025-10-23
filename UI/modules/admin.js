export function showAdminTab(tab){
	const tabs=['books','members','loans','approvals','reservations','violations','notify','reports','monitor','config'];
	tabs.forEach(t=>{
		const panel=document.getElementById(`${t}Admin`);
		const btn=document.getElementById(`${t}Tab`);
		if(panel) panel.classList.add('hidden');
		if(btn){ btn.classList.remove('bg-purple-600','text-white'); btn.classList.add('bg-gray-100','text-gray-600'); }
	});
	document.getElementById(`${tab}Admin`)?.classList.remove('hidden');
	const active=document.getElementById(`${tab}Tab`);
	active?.classList.add('bg-purple-600','text-white');
	active?.classList.remove('bg-gray-100','text-gray-600');
}

export function applyAdminRoleVisibility(){
	const role=localStorage.getItem('userRole')||'guest';
	const staffOnly=['loansTab','approvalsTab','reservationsTab','violationsTab','notifyTab','reportsTab'];
	const adminOnly=['membersTab','monitorTab','configTab','reportsTab'];
	// Hide all extended by default for guests
	if(role==='guest' || role==='member'){
		[...staffOnly, ...adminOnly].forEach(id=> document.getElementById(id)?.classList.add('hidden'));
	}
	if(role==='staff'){
		// Hide admin-only
		adminOnly.forEach(id=> document.getElementById(id)?.classList.add('hidden'));
	}
	if(role==='admin'){
		// Admin can see everything; no action
	}
}
import { notifyInfo } from './notify.js';
export function showAddBookForm(){ notifyInfo('Form thêm sách (demo).'); }
