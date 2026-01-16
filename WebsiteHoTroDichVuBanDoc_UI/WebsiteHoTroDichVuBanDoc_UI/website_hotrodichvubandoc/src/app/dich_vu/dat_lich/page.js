'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Calendar as CalendarIcon, Clock, MapPin, Users,
    CheckCircle, AlertCircle, ChevronLeft,
    Monitor, Wifi, Zap, LayoutGrid, Armchair, Coffee, BookOpen, Sun, Info
} from 'lucide-react';
import { getAllRoomsAction, getAllSeatsAction, createSeatBookingAction, createRoomBookingAction } from './actions';

// --- CẤU HÌNH LOẠI GHẾ & MÔ TẢ TRỰC QUAN ---
const SEAT_TYPES_CONFIG = {
    'S': { label: 'Sofa Thư Giãn', desc: 'Ghế đệm êm ái, không gian thoải mái phù hợp đọc sách giải trí.', icon: Armchair, color: 'text-orange-600', bg: 'bg-orange-100', features: ['Đệm êm', 'Đèn vàng'] },
    'L': { label: 'Lounge Sofa', desc: 'Ghế bành sang trọng khu vực sảnh, thích hợp nghỉ ngơi ngắn.', icon: Armchair, color: 'text-orange-600', bg: 'bg-orange-100', features: ['Cao cấp', 'Thư giãn'] },
    'MT': { label: 'Máy Tính Tra Cứu', desc: 'Trang bị PC cấu hình cao, màn hình rộng phục vụ học tập & tra cứu.', icon: Monitor, color: 'text-cyan-600', bg: 'bg-cyan-100', features: ['PC i5/i7', 'Mạng LAN'] },
    'PC': { label: 'Workstation', desc: 'Cụm máy tính làm việc nhóm hoặc đồ họa.', icon: Monitor, color: 'text-cyan-600', bg: 'bg-cyan-100', features: ['Đồ họa', 'Màn hình lớn'] },
    'V': { label: 'Ghế View Cửa Sổ', desc: 'Bàn dài hướng ra cửa sổ, ánh sáng tự nhiên, khơi nguồn sáng tạo.', icon: Sun, color: 'text-emerald-600', bg: 'bg-emerald-100', features: ['View đẹp', 'Ánh sáng'] },
    'K': { label: 'Bàn Nhóm Nhỏ', desc: 'Bàn thấp thiết kế an toàn, phù hợp cho trẻ em hoặc nhóm nhỏ.', icon: Users, color: 'text-pink-600', bg: 'bg-pink-100', features: ['Nhóm 2-4', 'Thân thiện'] },
    'B': { label: 'Ghế Lười (Beanbag)', desc: 'Ngồi bệt thoải mái trên sàn gỗ, tự do sáng tạo.', icon: Coffee, color: 'text-purple-600', bg: 'bg-purple-100', features: ['Tự do', 'Sàn gỗ'] },
    'R': { label: 'Bàn Tròn Cafe', desc: 'Không gian mở kiểu Cafe, thích hợp thảo luận nhẹ.', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-100', features: ['Thảo luận', 'Thoáng'] },
    'Q': { label: 'Tra Cứu Nhanh', desc: 'Bàn đứng hoặc ghế cao, dành cho việc sử dụng nhanh < 30p.', icon: Zap, color: 'text-slate-600', bg: 'bg-slate-100', features: ['Nhanh chóng', 'Tiện lợi'] },
    'DEFAULT': { label: 'Bàn Học Tiêu Chuẩn', desc: 'Bàn gỗ cá nhân, có vách ngăn thấp đảm bảo sự riêng tư.', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', features: ['Ổ cắm', 'Đèn riêng'] }
};

// Hàm lấy thông tin ghế dựa trên Mã ghế (Ví dụ: MT1-01 -> Lấy config của MT)
const getSeatInfo = (seatName) => {
    if (!seatName) return null;
    const prefix = seatName.match(/^([A-Z]+)/)?.[0] || 'DEFAULT';
    // Nếu prefix không có trong config (như A, B, C...) thì fallback về DEFAULT
    return SEAT_TYPES_CONFIG[prefix] || SEAT_TYPES_CONFIG['DEFAULT'];
};

const getSeatIcon = (name, type) => {
    const config = getSeatInfo(name);
    const Icon = config.icon;
    return <Icon size={14} />;
};

const getSeatColor = (status, isSelected, name) => {
    if (status.isWalkIn) return "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border-dashed";
    if (status.isBooked) return "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed";
    if (status.isInUse) return "bg-red-50 border-red-200 text-red-300 cursor-not-allowed";

    if (isSelected) return "bg-blue-600 border-blue-600 text-white shadow-md transform scale-110 z-10";

    // Màu theo loại ghế để sơ đồ sinh động hơn
    if (name.startsWith('S') || name.startsWith('L')) return "bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400";
    if (name.startsWith('MT') || name.startsWith('PC')) return "bg-cyan-50 border-cyan-200 text-cyan-600 hover:border-cyan-400";
    if (name.startsWith('V')) return "bg-emerald-50 border-emerald-200 text-emerald-600 hover:border-emerald-400";

    return "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-500";
};

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

    // Filter Seats
    const currentSeats = seats.filter(s => s.maphong === selectedRoom?.maphong);

    // Grouping Logic
    const groupedSeats = currentSeats.reduce((acc, seat) => {
        const match = seat.tenchongoi.match(/^([A-Z]+(\d)?)/);
        const groupKey = match ? match[1] : 'Khác';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(seat);
        return acc;
    }, {});
    const sortedGroups = Object.keys(groupedSeats).sort();

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Đang xử lý...' });

        try {
            const start = new Date(`${formData.bookingDate}T${formData.startTime}:00`);
            const end = new Date(`${formData.bookingDate}T${formData.endTime}:00`);
            const now = new Date();

            if (start < now) {
                setStatus({ type: 'error', message: 'Thời gian bắt đầu phải ở bắt đầu từ thời gian hiện tại hoặc sau.' });
                return;
            }
            if (end <= start) {
                setStatus({ type: 'error', message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
                return;
            }

            let res;
            if (selectedSeat) {
                res = await createSeatBookingAction({
                    maChoNgoi: selectedSeat.machongoi,
                    thoiGianBatDau: start.toISOString(),
                    thoiGianKetThuc: end.toISOString()
                });
            } else {
                res = await createRoomBookingAction({
                    maPhong: selectedRoom?.maphong,
                    nguoiToChuc: "Người dùng Web",
                    soDienThoai: "0123456789",
                    thoiGianBatDau: start.toISOString(),
                    thoiGianKetThuc: end.toISOString(),
                    mucDichSuDung: formData.reason || "Họp nhóm",
                    soNguoiThamDuDuKien: formData.attendees
                });
            }

            if (res.success) {
                setStatus({ type: 'success', message: 'Đặt thành công! Đang chuyển hướng...' });
                setTimeout(() => router.push('/thong_bao'), 1500);
            } else {
                const msg = res.error || 'Có lỗi xảy ra.';
                setStatus({ type: 'error', message: msg.includes('403') ? 'Vui lòng đăng nhập để đặt chỗ.' : msg });
            }

        } catch (err) {
            setStatus({ type: 'error', message: 'Lỗi kết nối: ' + err.message });
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    // Helper Variable cho Seat Info
    const seatInfo = selectedSeat ? getSeatInfo(selectedSeat.tenchongoi) : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* HEADER */}
            <div className="bg-white/80 border-b sticky top-0 z-30 shadow-sm/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dich_vu" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition group">
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Quay lại
                        </Link>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <LayoutGrid className="text-blue-600" size={20}/>
                            Đặt Chỗ Trực Tuyến
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8 grid lg:grid-cols-12 gap-8">

                {/* LEFT: SELECTION AREA (8 Cột) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* 1. ROOM TABS */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 p-2">
                            {rooms.map(room => (
                                <button
                                    key={room.maphong}
                                    onClick={() => { setSelectedRoom(room); setSelectedSeat(null); }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all font-medium text-sm border ${
                                        selectedRoom?.maphong === room.maphong
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                        : 'bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                                >
                                    {room.loaiphong === 'phongHocNhom' ? <Users size={16} /> :
                                        room.loaiphong === 'MayTinh' ? <Monitor size={16}/> : <BookOpen size={16} />}
                                    {room.tenphong}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. MAP VISUALIZATION */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
                        {selectedRoom ? (
                            <>
                                {/* Room Info Header */}
                                <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-50">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedRoom.tenphong}</h2>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 mt-2 uppercase tracking-wide">
                                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><Users size={12} /> {selectedRoom.succhua} Chỗ</span>
                                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><Wifi size={12} /> Wifi 6E</span>
                                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><Zap size={12} /> Có ổ điện</span>
                                        </div>
                                    </div>
                                    {selectedRoom.loaiphong !== 'phongHocNhom' && (
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 mb-1">Trạng thái ghế</div>
                                            <div className="flex gap-2 text-[10px]">
                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white border border-gray-300"></div>Trống</div>
                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-600"></div>Đang chọn</div>
                                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-200"></div>Đã đặt</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* MAP CONTENT */}
                                {selectedRoom.loaiphong === 'phongHocNhom' ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-blue-50/30 rounded-2xl border-2 border-dashed border-blue-100">
                                        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                            <Users size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">Đặt nguyên phòng</h3>
                                        <p className="text-gray-500 max-w-sm mb-6">Không gian riêng tư, cách âm tốt, phù hợp cho thảo luận nhóm từ 3-{selectedRoom.succhua} người.</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
                                        {/* Sơ đồ ghế */}
                                        <div className="min-w-[600px] flex flex-col gap-6 items-center">

                                            <div className="w-1/2 h-1.5 bg-gray-200 rounded-full mb-8 relative">
                                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">Màn hình / Bảng</span>
                                            </div>

                                            {sortedGroups.map(groupKey => {
                                                const groupSeats = groupedSeats[groupKey];
                                                groupSeats.sort((a, b) => a.tenchongoi.localeCompare(b.tenchongoi));

                                                return (
                                                    <div key={groupKey} className="flex items-center gap-4 w-full justify-center group">
                                                        <div className="w-8 text-right font-bold text-gray-300 text-sm group-hover:text-blue-500 transition-colors">
                                                            {groupKey}
                                                        </div>
                                                        <div className="flex gap-3">
                                                            {groupSeats.map(seat => {
                                                                const isWalkIn = seat.chongoitructiep;
                                                                const isBooked = seat.trangthai === 'daDuocDat';
                                                                const isInUse = seat.trangthai === 'dangSuDung';
                                                                const isSelected = selectedSeat?.machongoi === seat.machongoi;
                                                                const isDisabled = isWalkIn || isBooked || isInUse;

                                                                const colorClass = getSeatColor(
                                                                    { isWalkIn, isBooked, isInUse },
                                                                    isSelected,
                                                                    seat.tenchongoi
                                                                );

                                                                return (
                                                                    <button
                                                                        key={seat.machongoi}
                                                                        disabled={isDisabled}
                                                                        onClick={() => setSelectedSeat(seat)}
                                                                        className={`
                                                                            relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border
                                                                            ${colorClass}
                                                                            ${!isDisabled ? 'hover:-translate-y-1 hover:shadow-md active:scale-95' : ''}
                                                                        `}
                                                                        title={`${seat.tenchongoi}`}
                                                                    >
                                                                        {getSeatIcon(seat.tenchongoi, seat.loaichongoi)}
                                                                        {isDisabled && (
                                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gray-400 rounded-full border-2 border-white"></span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="w-8 text-left font-bold text-gray-300 text-sm group-hover:text-blue-500 transition-colors">
                                                            {groupKey}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {currentSeats.length === 0 && (
                                                <div className="text-gray-400 italic py-10">Chưa có dữ liệu ghế cho phòng này.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                <MapPin size={48} className="mb-2 opacity-50" />
                                <p>Chọn khu vực để xem sơ đồ</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: BOOKING FORM (4 Cột - Sticky) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-6">

                        {/* ========================================================= */}
                        {/* 1. MÔ TẢ TRỰC QUAN (VISUAL DESCRIPTION CARD) [NEW FEATURE] */}
                        {/* ========================================================= */}
                        {selectedRoom && (
                            <div className={`p-5 rounded-3xl border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${
                                selectedSeat && seatInfo
                                    ? 'bg-white border-blue-100 ring-2 ring-blue-50'
                                    : 'bg-white border-gray-100'
                            }`}>
                                {selectedRoom.loaiphong === 'phongHocNhom' ? (
                                    // Thông tin cho Phòng Họp Nhóm
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Phòng Họp Nhóm</h3>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                Không gian riêng tư, cách âm. Thích hợp cho việc thảo luận, thuyết trình.
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">Màn chiếu</span>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">Bảng trắng</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : selectedSeat && seatInfo ? (
                                    // Thông tin chi tiết Ghế đã chọn
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl shrink-0 ${seatInfo.bg} ${seatInfo.color}`}>
                                            <seatInfo.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                {seatInfo.label}
                                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                                    {selectedSeat.tenchongoi}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                {seatInfo.desc}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {seatInfo.features.map((f, i) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Trạng thái chờ chọn
                                    <div className="flex flex-col items-center text-center py-2 text-gray-400">
                                        <Info size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm font-medium">Vui lòng chọn một ghế trên sơ đồ</p>
                                        <p className="text-xs mt-1">Thông tin tiện ích ghế sẽ hiển thị tại đây</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. BOOKING FORM */}
                        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
                            <div className="mb-6 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Xác nhận đặt</h3>
                                <p className="text-xs text-gray-400">Vui lòng kiểm tra kỹ thời gian</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Date Picker */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Ngày đặt</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={formData.bookingDate}
                                            onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                                            className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Time Picker */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Bắt đầu</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                required
                                                value={formData.startTime}
                                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-center transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Kết thúc</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                required
                                                value={formData.endTime}
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-center transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Room Specific Fields */}
                                {selectedRoom?.loaiphong === 'phongHocNhom' && (
                                    <div className="space-y-4 pt-2 border-t border-dashed border-gray-200 animate-in fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Số người</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={selectedRoom.succhua}
                                                value={formData.attendees}
                                                onChange={e => setFormData({ ...formData, attendees: parseInt(e.target.value) })}
                                                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Mục đích</label>
                                            <input
                                                type="text"
                                                placeholder="VD: Họp đồ án..."
                                                value={formData.reason}
                                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Status Alert */}
                                {status.message && (
                                    <div className={`p-3 rounded-xl text-sm flex items-start gap-2 ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                        {status.type === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle size={16} className="mt-0.5 shrink-0" />}
                                        <span className="font-medium">{status.message}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={(!selectedSeat && selectedRoom?.loaiphong !== 'phongHocNhom') || status.type === 'loading'}
                                    className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {status.type === 'loading' ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang xử lý...</>
                                    ) : (
                                        'Xác nhận Đặt chỗ'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}