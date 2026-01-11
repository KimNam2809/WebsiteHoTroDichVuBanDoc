'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Calendar as CalendarIcon, Clock, MapPin, Users,
    CheckCircle, AlertCircle, Armchair, ChevronLeft,
    Monitor, Wifi, Zap, LayoutGrid
} from 'lucide-react';
import { getAllRoomsAction, getAllSeatsAction, createSeatBookingAction, createRoomBookingAction } from './actions';

export default function BookingPage() {
    const router = useRouter();

    // Data State
    const [rooms, setRooms] = useState([]);
    const [seats, setSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selection State
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        bookingDate: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '10:00',
        reason: '',
        attendees: 1
    });

    const [status, setStatus] = useState({ type: '', message: '' });

    // 1. Fetch Data
    useEffect(() => {
        async function loadData() {
            try {
                const [roomsRes, seatsRes] = await Promise.all([
                    getAllRoomsAction(),
                    getAllSeatsAction()
                ]);

                if (roomsRes.data) {
                    setRooms(roomsRes.data);
                    // Default select first room
                    if (roomsRes.data.length > 0) setSelectedRoom(roomsRes.data[0]);
                }
                if (seatsRes.data) setSeats(seatsRes.data);
            } catch (error) {
                console.error("Load Error:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Helper: Filter seats for current room
    const currentSeats = seats.filter(s => s.maphong === selectedRoom?.maphong);
    // Sort seats by name for better grid
    currentSeats.sort((a, b) => a.tenchongoi.localeCompare(b.tenchongoi));

    // Handler: Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Đang xử lý...' });

        try {
            // Validate Time
            const start = new Date(`${formData.bookingDate}T${formData.startTime}:00`);
            const end = new Date(`${formData.bookingDate}T${formData.endTime}:00`);
            const now = new Date();

            if (start < now) {
                setStatus({ type: 'error', message: 'Thời gian bắt đầu phải ở tương lai.' });
                return;
            }
            if (end <= start) {
                setStatus({ type: 'error', message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
                return;
            }

            let res;
            if (selectedSeat) {
                // BOOK SEAT
                res = await createSeatBookingAction({
                    maChoNgoi: selectedSeat.machongoi,
                    thoiGianBatDau: start.toISOString(),
                    thoiGianKetThuc: end.toISOString()
                });
            } else {
                // BOOK ROOM
                res = await createRoomBookingAction({
                    maPhong: selectedRoom?.maphong,
                    nguoiToChuc: "Người dùng Web", // Should be from profile
                    soDienThoai: "0123456789", // Should be from profile/input
                    thoiGianBatDau: start.toISOString(),
                    thoiGianKetThuc: end.toISOString(),
                    mucDichSuDung: formData.reason || "Họp nhóm",
                    soNguoiThamDuDuKien: formData.attendees
                });
            }

            if (res.success) {
                setStatus({ type: 'success', message: 'Đặt thành công! Vui lòng kiểm tra email.' });
                setTimeout(() => router.push('/tai_khoan/lich_su'), 2000);
            } else {
                const msg = res.error || 'Có lỗi xảy ra.';
                setStatus({ type: 'error', message: msg.includes('403') ? 'Vui lòng đăng nhập để đặt chỗ.' : msg });
            }

        } catch (err) {
            setStatus({ type: 'error', message: 'Lỗi kết nối: ' + err.message });
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* 1. HERO HEADER */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 h-[300px] flex items-center justify-center overflow-hidden pb-10">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                        Đặt chỗ ngồi & phòng tại Thư viện
                    </h1>
                    <p className="text-blue-100 text-lg font-light max-w-2xl mx-auto">
                        Nơi lưu giữ tri thức và không gian học tập lý tưởng. Đặt chỗ ngay để trải nghiệm!
                    </p>
                </div>
            </div>

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dich_vu" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                            <ChevronLeft size={20} /> Quay lại
                        </Link>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <h1 className="text-xl font-bold text-gray-800">Đặt Chỗ & Phòng</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8 grid lg:grid-cols-3 gap-8">

                {/* LEFT: SELECTION AREA */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Room Tabs */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <MapPin size={16} /> Chọn khu vực
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {rooms.map(room => (
                                <button
                                    key={room.maphong}
                                    onClick={() => { setSelectedRoom(room); setSelectedSeat(null); }}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all font-medium ${selectedRoom?.maphong === room.maphong
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {room.loaiphong === 'phongHocNhom' ? <Users size={18} /> : <LayoutGrid size={18} />}
                                    {room.tenphong}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Visualization Area */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
                        {selectedRoom ? (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedRoom.tenphong}</h2>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Users size={14} /> Sức chứa: {selectedRoom.succhua || 'N/A'}</span>
                                            <span className="flex items-center gap-1"><Wifi size={14} /> Wifi 6</span>
                                            <span className="flex items-center gap-1"><Zap size={14} /> Ổ cắm điện</span>
                                        </div>
                                    </div>
                                    {selectedRoom.loaiphong !== 'phongHocNhom' && (
                                        <div className="hidden md:flex gap-4 text-xs font-medium">
                                            <span className="text-gray-400 italic">Chọn ghế bên dưới</span>
                                        </div>
                                    )}
                                </div>

                                {/* CONTENT: LIST OR GRID */}
                                {selectedRoom.loaiphong === 'phongHocNhom' ? (
                                    <div className="bg-blue-50/50 rounded-2xl p-8 text-center border border-blue-100">
                                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-blue-900 mb-2">Đặt nguyên phòng</h3>
                                        <p className="text-blue-700/80 max-w-md mx-auto">
                                            Phòng này hỗ trợ đặt lịch theo khung giờ cho nhóm. Vui lòng điền thông tin bên phải để gửi yêu cầu.
                                        </p>
                                    </div>
                                ) : (
                                    // SEAT GRID CONTAINER (Cinema Style)
                                    <div className="relative">
                                        {/* DECORATIVE SCREEN */}
                                        <div className="flex flex-col items-center mb-10 w-full px-10">
                                            <div className="w-2/3 h-1 bg-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.6)] rounded-full mb-2"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-300">Màn hình / Bảng</span>
                                        </div>

                                        <div className="flex flex-col gap-3 pb-8 px-2 overflow-x-auto">
                                            {/* GROUP SEATS BY ROW */}
                                            {Object.entries(
                                                currentSeats.reduce((acc, seat) => {
                                                    // Parse Row from Name (e.g. "A01" -> "A", "MT1-01" -> "MT1")
                                                    const match = seat.tenchongoi.match(/^([A-Z]+|MT\d+|G\d+|PC\d+|Y)/);
                                                    const row = match ? match[1] : 'Others';
                                                    if (!acc[row]) acc[row] = [];
                                                    acc[row].push(seat);
                                                    return acc;
                                                }, {})
                                            ).sort().map(([row, rowSeats]) => (
                                                <div key={row} className="flex flex-nowrap items-center justify-center gap-2">
                                                    {/* Row Label */}
                                                    <div className="w-8 shrink-0 text-center text-xs font-bold text-gray-400">
                                                        {row.startsWith('MT') ? '' : row}
                                                    </div>

                                                    {/* Seats in Row */}
                                                    {rowSeats.sort((a, b) => a.tenchongoi.localeCompare(b.tenchongoi)).map(seat => {
                                                        // 4 TYPES LOGIC
                                                        const isWalkIn = seat.chongoitructiep === true || seat.chongoitructiep === 1; // 1. Trực tiếp
                                                        const isBooked = seat.trangthai === 'daDuocDat'; // 3. Đã đặt
                                                        const isInUse = seat.trangthai === 'dangSuDung'; // 4. Đang sử dụng
                                                        // 2. Trống = !isWalkIn && !isBooked && !isInUse

                                                        const isSelected = selectedSeat?.machongoi === seat.machongoi;
                                                        const isDisabled = isWalkIn || isBooked || isInUse;

                                                        // Dynamic Styles based on Status & Type
                                                        let btnBase = "relative w-10 h-9 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all duration-200 border shadow-sm";

                                                        // Default: Trống (White/Gray)
                                                        let colorClass = "bg-white border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500";

                                                        if (isWalkIn) {
                                                            colorClass = "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border-dashed";
                                                        } else if (isBooked) {
                                                            colorClass = "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed";
                                                        } else if (isInUse) {
                                                            colorClass = "bg-red-100 border-red-200 text-red-400 cursor-not-allowed";
                                                        }

                                                        // Override if Selected
                                                        if (isSelected) {
                                                            colorClass = "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 ring-offset-1 z-10 transform scale-110";
                                                        }

                                                        let title = seat.tenchongoi;
                                                        if (isWalkIn) title += " (Chỉ đặt trực tiếp)";
                                                        if (isBooked) title += " (Đã đặt)";
                                                        if (isInUse) title += " (Đang sử dụng)";

                                                        return (
                                                            <button
                                                                key={seat.machongoi}
                                                                disabled={isDisabled}
                                                                onClick={() => setSelectedSeat(seat)}
                                                                className={`${btnBase} ${colorClass}`}
                                                                title={title}
                                                            >
                                                                {seat.tenchongoi.slice(-2)}
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Mirror Row Label */}
                                                    <div className="w-8 shrink-0 text-center text-xs font-bold text-gray-400">
                                                        {row.startsWith('MT') ? '' : row}
                                                    </div>
                                                </div>
                                            ))}

                                            {currentSeats.length === 0 && (
                                                <div className="py-20 text-center text-gray-400 italic">
                                                    Chưa có cấu hình chỗ ngồi cho phòng này.
                                                </div>
                                            )}
                                        </div>

                                        {/* STRICT LEGEND (4 TYPES) */}
                                        <div className="flex justify-center flex-wrap gap-4 mt-8 pb-4 border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-white border border-gray-300"></div>
                                                <span className="text-xs text-gray-500">Ghế trống</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-purple-600 border border-purple-600"></div>
                                                <span className="text-xs text-bold text-purple-600">Đang chọn</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-slate-100 border border-dashed border-slate-300"></div>
                                                <span className="text-xs text-gray-500">Trực tiếp (Tại quầy)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-gray-300 border border-gray-300"></div>
                                                <span className="text-xs text-gray-500">Đã chốt</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                                                <span className="text-xs text-gray-500">Đang sử dụng</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 text-gray-400">Vui lòng chọn một khu vực để xem chi tiết.</div>
                        )}
                    </div>
                </div>

                {/* RIGHT: BOOKING FORM */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Thông tin đặt chỗ</h3>
                            <p className="text-sm text-gray-500">
                                {selectedRoom
                                    ? (selectedRoom.loaiphong === 'phongHocNhom' ? `Phòng: ${selectedRoom.tenphong}` : `Chỗ: ${selectedSeat ? selectedSeat.tenchongoi : '(Chưa chọn ghế)'}`)
                                    : 'Vui lòng chọn khu vực'
                                }
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Ngày đặt</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.bookingDate}
                                        onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Bắt đầu</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Kết thúc</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Additional Fields for Room */}
                            {selectedRoom?.loaiphong === 'phongHocNhom' && (
                                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Số người dự kiến</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={selectedRoom.succhua}
                                            value={formData.attendees}
                                            onChange={e => setFormData({ ...formData, attendees: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Mục đích</label>
                                        <input
                                            type="text"
                                            placeholder="VD: Họp nhóm đồ án"
                                            value={formData.reason}
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Status Message */}
                            {status.message && (
                                <div className={`p-3 rounded-xl text-sm flex items-start gap-2 ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {status.type === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle size={16} className="mt-0.5 shrink-0" />}
                                    {status.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={(!selectedSeat && selectedRoom?.loaiphong !== 'phongHocNhom') || status.type === 'loading'}
                                className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {status.type === 'loading' ? 'Đang xử lý...' : 'Xác nhận Đặt chỗ'}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
