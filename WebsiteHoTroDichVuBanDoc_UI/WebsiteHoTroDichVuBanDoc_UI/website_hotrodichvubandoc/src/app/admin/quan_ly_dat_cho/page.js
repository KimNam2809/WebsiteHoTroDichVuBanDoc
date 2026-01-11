'use client';

import { useState, useEffect } from 'react';
import {
    getAllSeatBookingsAction,
    getAllRoomBookingsAction,
    cancelSeatBookingAction,
    checkInSeatBookingAction,
    approveRoomBookingAction,
    cancelRoomBookingAction,
    getCurrentStaffProfileAction
} from './actions';
import {
    LayoutGrid, Users, CheckCircle, XCircle, Clock,
    Search, Filter, MoreHorizontal, Calendar
} from 'lucide-react';

export default function BookingManagementPage() {
    const [activeTab, setActiveTab] = useState('seats'); // 'seats' | 'rooms'
    const [seatBookings, setSeatBookings] = useState([]);
    const [roomBookings, setRoomBookings] = useState([]);
    const [staffId, setStaffId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load Data
    useEffect(() => {
        async function load() {
            try {
                const [seats, rooms, profile] = await Promise.all([
                    getAllSeatBookingsAction(),
                    getAllRoomBookingsAction(),
                    getCurrentStaffProfileAction()
                ]);
                setSeatBookings(seats || []);
                setRoomBookings(rooms || []);
                if (profile) setStaffId(profile.maNhanVien || profile.manhanvien);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    // Helper: Refresh Data
    const refreshData = async () => {
        if (activeTab === 'seats') {
            const data = await getAllSeatBookingsAction();
            setSeatBookings(data || []);
        } else {
            const data = await getAllRoomBookingsAction();
            setRoomBookings(data || []);
        }
    };

    // Actions
    const handleSeatAction = async (action, id) => {
        if (!confirm(`Bạn chắc chắn muốn ${action}?`)) return;
        let res;
        if (action === 'cancel') res = await cancelSeatBookingAction(id);
        if (action === 'checkin') res = await checkInSeatBookingAction(id, staffId);

        if (res?.success) {
            alert('Thành công!');
            refreshData();
        } else {
            alert('Lỗi: ' + (res?.error || 'Không xác định'));
        }
    };

    const handleRoomAction = async (action, id) => {
        if (!confirm(`Bạn chắc chắn muốn ${action}?`)) return;
        let res;
        if (action === 'cancel') res = await cancelRoomBookingAction(id);
        if (action === 'approve') res = await approveRoomBookingAction(id, staffId);

        if (res?.success) {
            alert('Thành công!');
            refreshData();
        } else {
            alert('Lỗi: ' + (res?.error || 'Không xác định'));
        }
    };

    // Render Badge
    const StatusBadge = ({ status }) => {
        const styles = {
            'kichHoat': 'bg-green-100 text-green-700',
            'daHuy': 'bg-red-100 text-red-700',
            'dangChoDuyet': 'bg-yellow-100 text-yellow-700',
            'daDuyet': 'bg-blue-100 text-blue-700',
            'hoanThanh': 'bg-gray-100 text-gray-700',
        };
        const label = {
            'kichHoat': 'Đã đặt',
            'daHuy': 'Đã hủy',
            'dangChoDuyet': 'Chờ duyệt',
            'daDuyet': 'Đã duyệt',
            'hoanThanh': 'Hoàn thành'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-50 text-gray-500'}`}>
                {label[status] || status}
            </span>
        );
    };

    if (isLoading) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt Chỗ & Phòng</h1>
                    <p className="text-gray-500">Theo dõi, duyệt yêu cầu và check-in cho bạn đọc</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('seats')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'seats' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid size={18} /> Đặt Chỗ Ngồi
                    </button>
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'rooms' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={18} /> Đặt Phòng Họp
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* TOOLBAR */}
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Tìm theo tên hoặc mã..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <Filter size={18} /> Lọc trạng thái
                    </button>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Mã Đặt</th>
                                <th className="p-4 font-semibold">Bạn đọc / Người đặt</th>
                                <th className="p-4 font-semibold">{activeTab === 'seats' ? 'Mã Chỗ' : 'Mã Phòng'}</th>
                                <th className="p-4 font-semibold">Thời gian</th>
                                {activeTab === 'rooms' && <th className="p-4 font-semibold">Mục đích</th>}
                                <th className="p-4 font-semibold">Trạng thái</th>
                                <th className="p-4 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {(activeTab === 'seats' ? seatBookings : roomBookings).map((item) => (
                                <tr key={item.madatcho || item.madatphong} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4 font-medium text-blue-600">#{item.madatcho || item.madatphong}</td>

                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{item.mabandoc || item.nguoitochuc || 'Khách vãng lai'}</div>
                                        {item.sodienthoai && <div className="text-xs text-gray-400">{item.sodienthoai}</div>}
                                    </td>

                                    <td className="p-4 font-mono text-xs">
                                        <span className="bg-gray-100 px-2 py-1 rounded">
                                            {item.machongoi ? `SEAT-${item.machongoi}` : `ROOM-${item.maphong}`}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Calendar size={14} /> {new Date(item.thoigianbatdau).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                            <Clock size={12} />
                                            {new Date(item.thoigianbatdau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(item.thoigianketthuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>

                                    {activeTab === 'rooms' && <td className="p-4 text-gray-600 truncate max-w-[200px]">{item.mucdichsudung}</td>}

                                    <td className="p-4"><StatusBadge status={item.trangthaidatcho || item.trangthai} /></td>

                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {activeTab === 'seats' ? (
                                                <>
                                                    {item.trangthaidatcho === 'kichHoat' && (
                                                        <button
                                                            onClick={() => handleSeatAction('checkin', item.madatcho)}
                                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Check-in">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {item.trangthaidatcho === 'kichHoat' && (
                                                        <button
                                                            onClick={() => handleSeatAction('cancel', item.madatcho)}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Hủy">
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {item.trangthai === 'dangChoDuyet' && (
                                                        <button
                                                            onClick={() => handleRoomAction('approve', item.madatphong)}
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Duyệt">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {(item.trangthai === 'dangChoDuyet' || item.trangthai === 'daDuyet' || item.trangthai === 'kichHoat') && (
                                                        <button
                                                            onClick={() => handleRoomAction('cancel', item.madatphong)}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Hủy / Từ chối">
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(activeTab === 'seats' ? seatBookings : roomBookings).length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-10 text-center text-gray-400">Chưa có dữ liệu đặt chỗ nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}