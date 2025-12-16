// src/app/tai_khoan/page.js
import { getUserProfileAction, getCurrentHoldingsAction } from './actions';
import Link from 'next/link';
import CardStatusSection from '@/components/CardStatusSection';
import { BookOpen, Clock, AlertTriangle, ChevronRight, Calendar, Bell } from 'lucide-react';

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('vi-VN');
}

export default async function DashboardPage() {
    // 1. Fetch dữ liệu song song
    const [profile, currentLoans] = await Promise.all([
        getUserProfileAction(),
        getCurrentHoldingsAction()
    ]);

    // Xử lý khi token hết hạn
    if (!profile) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Phiên đăng nhập đã hết hạn</h2>
                <Link href="/dang_nhap" className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors">
                    Đăng nhập lại ngay
                </Link>
            </div>
        );
    }

    const isStaff = profile.vaitro === 'nhanVien';
    const overdueList = currentLoans.filter(l => l.trangthai === 'quaHan');
    const overdueCount = overdueList.length;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">

            {/* 1. HERO CONTENT (Không có background, chỉ có nội dung text trắng) */}
            {/* Phần này sẽ nằm đè lên nền xanh của Layout */}
            <div className="mb-10 text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4">

                {/* Greeting Text */}
                <div>
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-50 mb-3 border border-white/20 shadow-sm">
                        <Calendar size={12} />
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight drop-shadow-md">
                        Xin chào, {profile.hoten || 'Bạn đọc'}! 👋
                    </h1>
                    <p className="text-blue-100 text-lg font-light max-w-xl leading-relaxed">
                        {isStaff
                            ? `Bảng điều khiển dành cho ${profile.chucvu || 'cán bộ nhân viên'}.`
                            : 'Hôm nay là một ngày tuyệt vời để khám phá những cuốn sách mới.'}
                    </p>
                </div>

                {/* Avatar & Notification */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center text-white border border-white/20 cursor-pointer transition-colors relative shadow-lg">
                        <Bell size={20} />
                        {overdueCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-indigo-900 animate-pulse"></span>}
                    </div>
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-white to-blue-50 p-1 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl font-extrabold text-blue-700 select-none">
                            {(profile.hoten || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STATS GRID (Các thẻ nổi) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* CARD 1: Thông tin Thẻ */}
                <div className="h-full">
                    <CardStatusSection profile={profile} isStaff={isStaff} />
                </div>

                {/* CARD 2: Đang mượn */}
                <div className="bg-white p-6 rounded-3xl shadow-lg shadow-blue-900/5 border border-white/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col justify-between h-full">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><BookOpen size={24}/></div>
                            <h3 className="font-bold text-gray-700 text-lg">Đang mượn</h3>
                        </div>
                        {isStaff ? (
                            <div className="relative z-10 mt-2">
                                <p className="text-gray-500 text-sm">Truy cập hệ thống quản trị để xem báo cáo.</p>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900">{currentLoans.length}</span>
                                    <span className="text-gray-400 font-medium text-lg">/ {profile.tailieumuontoida}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 font-medium">cuốn sách</p>
                            </div>
                        )}
                    </div>
                    {!isStaff && (
                        <Link href="/tai_khoan/muon_tra" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors relative z-10">
                            Xem chi tiết <ChevronRight size={16}/>
                        </Link>
                    )}
                </div>

                {/* CARD 3: Trạng thái / Cảnh báo */}
                <div className={`p-6 rounded-3xl shadow-lg shadow-blue-900/5 border flex flex-col justify-between h-full relative overflow-hidden ${overdueCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-white/50'}`}>
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-2xl ${overdueCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {overdueCount > 0 ? <AlertTriangle size={24}/> : <Clock size={24}/>}
                            </div>
                            <h3 className={`font-bold text-lg ${overdueCount > 0 ? 'text-red-800' : 'text-gray-700'}`}>
                                {overdueCount > 0 ? 'Cần chú ý!' : 'Trạng thái'}
                            </h3>
                        </div>
                        {overdueCount > 0 ? (
                            <div>
                                <p className="text-3xl font-extrabold text-red-600">{overdueCount}</p>
                                <p className="text-sm text-red-700 font-bold mt-1">Sách quá hạn trả</p>
                                <p className="text-xs text-red-500 mt-2 leading-relaxed">Vui lòng trả sách sớm để tránh phí phạt.</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xl font-bold text-green-700">Rất tốt!</p>
                                <p className="text-sm text-gray-500 mt-1">Tài khoản hoạt động bình thường.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. DANH SÁCH MƯỢN (Bảng lớn dưới cùng) */}
            {!isStaff && (
                <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-white/50 overflow-hidden mb-12">
                    <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                                <BookOpen size={24} className="text-blue-600"/> Sách đang giữ
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Danh sách các tài liệu bạn đang mượn hoặc giữ chỗ.</p>
                        </div>
                        <Link href="/tai_khoan/muon_tra" className="px-5 py-2 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-sm font-bold transition-all border border-gray-200 hover:border-blue-200">
                            Xem tất cả
                        </Link>
                    </div>

                    {currentLoans.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 md:pl-8">Tên tác phẩm</th>
                                        <th className="px-6 py-4">Ngày mượn</th>
                                        <th className="px-6 py-4">Hạn trả</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                    {currentLoans.slice(0, 5).map((loan) => (
                                        <tr key={loan.mamuontra} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 md:pl-8 font-medium text-gray-900">{loan.tentacpham}</td>
                                            <td className="px-6 py-4 text-gray-500">{formatDate(loan.ngaymuon)}</td>
                                            <td className="px-6 py-4">{formatDate(loan.ngaytradukien)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                    loan.trangthai === 'quaHan'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-green-50 text-green-600 border-green-100'
                                                }`}>
                                                    {loan.trangthai === 'quaHan' ? 'Quá hạn' : 'Đang đọc'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 mb-4">Bạn chưa mượn cuốn sách nào.</p>
                            <Link href="/tim_kiem" className="text-blue-600 font-bold hover:underline">Tìm sách ngay &rarr;</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}