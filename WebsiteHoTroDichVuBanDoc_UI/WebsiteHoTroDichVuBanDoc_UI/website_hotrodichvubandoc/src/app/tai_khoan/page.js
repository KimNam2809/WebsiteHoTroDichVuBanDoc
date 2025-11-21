// src/app/tai_khoan/page.js
import { getUserProfileAction, getCurrentHoldingsAction } from './actions';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faBookOpen, faClock, faUserTie } from '@fortawesome/free-solid-svg-icons';

// Hàm format ngày tháng (xử lý cả ISO string và date string)
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    // Kiểm tra nếu ngày không hợp lệ
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('vi-VN');
}

export default async function DashboardPage() {
    // 1. Gọi API song song
    const [profile, currentLoans] = await Promise.all([
        getUserProfileAction(),
        getCurrentHoldingsAction()
    ]);

    // Nếu không lấy được profile (token hết hạn)
    if (!profile) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 mb-4">Phiên đăng nhập đã hết hạn.</p>
                <Link href="/dang_nhap" className="text-blue-600 hover:underline">
                    Đăng nhập lại
                </Link>
            </div>
        );
    }

    // 2. Phân tích dữ liệu
    const isStaff = profile.vaitro === 'nhanVien';
    const hasCard = profile.sothe && profile.sothe !== 'Chưa cấp';

    // Lọc sách quá hạn từ danh sách tổng
    const overdueList = currentLoans.filter(l => l.trangthai === 'quaHan');
    const overdueCount = overdueList.length;

    return (
        <div>
            {/* Header chào mừng */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Xin chào, {profile.hoten}!</h1>
                    <p className="text-gray-600 mt-1">
                        {isStaff ? `Cán bộ thư viện - ${profile.chucvu || 'Nhân viên'}` : 'Chào mừng bạn quay trở lại thư viện.'}
                    </p>
                </div>
                <div className="text-sm text-gray-500">
                    Hôm nay: {new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>

            {/* Grid thông tin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* THẺ 1: THÔNG TIN THẺ / NHÂN VIÊN */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div className="z-10">
                            <h3 className="font-semibold text-gray-600">{isStaff ? 'Thông tin nhân viên' : 'Thẻ thư viện'}</h3>

                            {isStaff ? (
                                // Hiển thị cho Nhân viên
                                <div className="mt-2">
                                    <p className="text-2xl font-bold text-blue-700">{profile.manhanviennoibo}</p>
                                    <p className="text-sm text-gray-600 font-medium">{profile.phongban}</p>
                                    <p className="text-xs text-gray-500 mt-2">Tuyển dụng: {formatDate(profile.ngaytuyendung)}</p>
                                </div>
                            ) : (
                                // Hiển thị cho Bạn đọc
                                <div className="mt-2">
                                    {hasCard ? (
                                        <>
                                            <p className="text-2xl font-bold text-blue-700">{profile.sothe}</p>
                                            <p className="text-sm text-gray-600 font-medium">{profile.tenthe || 'Thẻ bạn đọc'}</p>
                                            <div className="mt-3 text-xs text-gray-500 space-y-1">
                                                <p>Trạng thái: <span className="text-green-600 font-semibold">{profile.trangthaithe}</span></p>
                                                <p>Hết hạn: {formatDate(profile.ngayhethan)}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mt-2">
                                            <p className="text-gray-500 italic mb-2">Chưa có thẻ thành viên</p>
                                            <Link href="/dang_ky_the" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                                Đăng ký ngay
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <FontAwesomeIcon icon={isStaff ? faUserTie : faIdCard} className="text-blue-100 text-6xl absolute -bottom-4 -right-4" />
                    </div>
                </div>

                {/* THẺ 2: TÌNH TRẠNG MƯỢN (Chỉ hiện cho bạn đọc hoặc thống kê cho NV) */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div className="z-10">
                            <h3 className="font-semibold text-gray-600">{isStaff ? 'Nhiệm vụ' : 'Đang mượn'}</h3>
                            {isStaff ? (
                                <div className="mt-2">
                                    <Link href="/admin" className="text-green-600 hover:underline font-medium">Truy cập trang quản lý &rarr;</Link>
                                    <p className="text-xs text-gray-500 mt-2">Phê duyệt thẻ, quản lý mượn trả...</p>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p className="text-4xl font-bold text-gray-800 mt-2">
                                        {currentLoans.length}
                                        <span className="text-lg text-gray-400 font-normal">/ {profile.tailieumuontoida}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">cuốn sách</p>
                                    <Link href="/tai_khoan/muon_tra" className="text-sm text-green-600 hover:underline mt-3 inline-block">
                                        Chi tiết &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                        <FontAwesomeIcon icon={faBookOpen} className="text-green-100 text-6xl absolute -bottom-4 -right-4" />
                    </div>
                </div>

                {/* THẺ 3: CẢNH BÁO / THÔNG BÁO */}
                <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 relative overflow-hidden ${overdueCount > 0 ? 'border-red-500' : 'border-purple-500'}`}>
                    <div className="flex justify-between items-start">
                        <div className="z-10">
                            <h3 className="font-semibold text-gray-600">{overdueCount > 0 ? 'Cần chú ý' : 'Trạng thái'}</h3>
                            {overdueCount > 0 ? (
                                <>
                                    <p className="text-2xl font-bold text-red-600 mt-2">{overdueCount} sách quá hạn</p>
                                    <p className="text-sm text-gray-500 mt-1">Vui lòng trả sách sớm!</p>
                                    <Link href="/tai_khoan/muon_tra" className="text-sm text-red-600 hover:underline mt-3 inline-block">Xem danh sách</Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-bold text-gray-800 mt-2">Tài khoản tốt</p>
                                    <p className="text-sm text-gray-500 mt-1">Không có vi phạm.</p>
                                </>
                            )}
                        </div>
                        <FontAwesomeIcon icon={faClock} className={`${overdueCount > 0 ? 'text-red-100' : 'text-purple-100'} text-6xl absolute -bottom-4 -right-4`} />
                    </div>
                </div>
            </div>

            {/* Danh sách mượn gần đây (Chỉ hiển thị cho Bạn đọc) */}
            {!isStaff && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Sách đang giữ</h2>
                        <Link href="/tai_khoan/muon_tra" className="text-sm text-blue-600 hover:text-blue-800">Xem tất cả</Link>
                    </div>

                    {currentLoans.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tác phẩm</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày mượn</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn trả</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentLoans.slice(0, 5).map((loan) => (
                                        <tr key={loan.mamuontra}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{loan.tentacpham}</div>
                                                <div className="text-xs text-gray-500">Mã BS: {loan.mabansaonoibo}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(loan.ngaymuon)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(loan.ngaytradukien)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    loan.trangthai === 'quaHan'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {loan.trangthai === 'quaHan' ? 'Quá hạn' : 'Đang mượn'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <p className="mb-4">Bạn hiện không mượn cuốn sách nào.</p>
                            <Link href="/tim_kiem" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                                Tìm sách ngay
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}