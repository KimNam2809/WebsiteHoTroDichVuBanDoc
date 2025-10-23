export const api = { getBooks, getArticles, getEvents, getMembers };
let useServer=false; let baseUrl='http://localhost:3000';
export function initAPI(){ useServer = !!localStorage.getItem('useApiServer'); const cfg=localStorage.getItem('apiBaseUrl'); if(cfg) baseUrl=cfg; }
async function getBooks(){
	if(!useServer){
		return [
			{ id:1, code:'BK001', title:'Đắc Nhân Tâm', author:'Dale Carnegie', category:'kỹ năng', year:2015, available:true, panorama:'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop' },
			{ id:2, code:'BK002', title:'Sapiens', author:'Yuval Noah Harari', category:'lịch sử', year:2018, available:false, panorama:'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1600&auto=format&fit=crop' },
			{ id:3, code:'BK003', title:'Atomic Habits', author:'James Clear', category:'kỹ năng', year:2019, available:true, panorama:'https://images.unsplash.com/photo-1457694587812-e8bf29a43845?q=80&w=1600&auto=format&fit=crop' },
			{ id:4, code:'BK004', title:'Dế Mèn Phiêu Lưu Ký', author:'Tô Hoài', category:'thiếu nhi', year:2010, available:true, panorama:'https://images.unsplash.com/photo-1524578471170-9f0f771bb0fc?q=80&w=1600&auto=format&fit=crop' },
			{ id:5, code:'BK005', title:'Clean Code', author:'Robert C. Martin', category:'công nghệ', year:2008, available:true },
			{ id:6, code:'BK006', title:'Deep Work', author:'Cal Newport', category:'kỹ năng', year:2016, available:true },
			{ id:7, code:'BK007', title:'Thinking, Fast and Slow', author:'Daniel Kahneman', category:'khoa học', year:2011, available:false },
			{ id:8, code:'BK008', title:'The Pragmatic Programmer', author:'Andrew Hunt', category:'công nghệ', year:1999, available:true },
			{ id:9, code:'BK009', title:'1984', author:'George Orwell', category:'văn học', year:1949, available:true },
			{ id:10, code:'BK010', title:'To Kill a Mockingbird', author:'Harper Lee', category:'văn học', year:1960, available:true },
			{ id:11, code:'BK011', title:'The Lean Startup', author:'Eric Ries', category:'kinh doanh', year:2011, available:true },
			{ id:12, code:'BK012', title:'Zero to One', author:'Peter Thiel', category:'kinh doanh', year:2014, available:true }
		];
	}
	const res=await fetch(`${baseUrl}/books`); return res.json();
}
async function getArticles(){ if(!useServer){ return []; } const res=await fetch(`${baseUrl}/articles`); return res.json(); }
async function getEvents(){ if(!useServer){ return []; } const res=await fetch(`${baseUrl}/events`); return res.json(); }
async function getMembers(){ if(!useServer){ return [
	{ id:1, code:'MB001', name:'Nguyễn Văn A', email:'a@example.com' },
	{ id:2, code:'MB002', name:'Trần Thị B', email:'b@example.com' },
	{ id:3, code:'MB003', name:'Lê Văn C', email:'c@example.com' },
	{ id:4, code:'MB004', name:'Phạm Thị D', email:'d@example.com' },
	{ id:5, code:'MB005', name:'Hoàng Văn E', email:'e@example.com' },
	{ id:6, code:'MB006', name:'Võ Thị F', email:'f@example.com' },
	{ id:7, code:'MB007', name:'Đặng Văn G', email:'g@example.com' },
	{ id:8, code:'MB008', name:'Phan Thị H', email:'h@example.com' },
	{ id:9, code:'MB009', name:'Bùi Văn I', email:'i@example.com' },
	{ id:10, code:'MB010', name:'Đỗ Thị K', email:'k@example.com' }
]; } const res=await fetch(`${baseUrl}/members`); return res.json(); }
