// src/app/dang_ky_the/form/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerCardAction, getCardTypesAction, getProvincesAction, getWardsByProvinceAction } from '../actions';
import { ArrowLeft, Upload, Loader2, CheckCircle, CreditCard, User, Calendar, Phone, Mail, MapPin, Truck } from 'lucide-react';

// Bảng giá định nghĩa tạm thời (vì API chưa trả về giá)
// Key là 'maloaithe' từ API
const PRICE_MAP = {
    '1': 50000, // Thẻ Sinh viên
    '2': 100000, // Thẻ Phổ thông
    '3': 50000, // Thẻ Nghiên cứu
    '4': 0, // Thẻ Thiếu nhi
    '5': 0, // Thẻ Đọc
    '6': 100000, // Thẻ mượn
};

// Giá ship mẫu vì chưa triển khai kết nối API
const SHIPPING_FEE = 30000;

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full py-4 px-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
            {pending ? <><Loader2 className="animate-spin" /> Đang xử lý...</> : 'Gửi hồ sơ đăng ký'}
        </button>
    );
}

export default function FormDangKyPage() {
    const [state, formAction] = useActionState(registerCardAction, null);

    // Data Lists
    const [cardTypesList, setCardTypesList] = useState([]);
    const [provinces, setProvinces] = useState([]); // Danh sách Tỉnh
    const [wards, setWards] = useState([]); // Danh sách Phường

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [loaiThe, setLoaiThe] = useState('');
    const [selectedProvince, setSelectedProvince] = useState(''); // ID Tỉnh đã chọn
    const [ship, setShip] = useState(false);
    const [totalCost, setTotalCost] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);

    // State lưu lỗi validation phía Client
    const [clientError, setClientError] = useState('');

    useEffect(() => {
        async function initData() {
            try {
                const [cards, provinceList] = await Promise.all([
                    getCardTypesAction(),
                    getProvincesAction()
                ]);

                if (cards && cards.length > 0) {
                    setCardTypesList(cards);
                    setLoaiThe(String(cards[0].maloaithe));
                }
                if (provinceList) {
                    setProvinces(provinceList);
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                // Đảm bảo setIsLoading luôn được gọi dù có lỗi hay không
                setIsLoading(false);
            }
        }
        initData();
    }, []);

    useEffect(() => {
        async function loadCards() {
            const data = await getCardTypesAction();
            if (data && data.length > 0) {
                setCardTypesList(data);
                setLoaiThe(String(data[0].maloaithe));
            }
            setIsLoading(false);
        }
        loadCards();
    }, []);

    useEffect(() => {
        if (!loaiThe) return;
        const baseFee = PRICE_MAP[loaiThe] || 0;
        const shipping = ship ? SHIPPING_FEE : 0;
        setTotalCost(baseFee + shipping);
    }, [loaiThe, ship]);

    // Hàm xử lý khi chọn Tỉnh -> Load Phường
    const handleProvinceChange = async (e) => {
        const provinceId = e.target.value;
        setSelectedProvince(provinceId);
        setWards([]);

        if (provinceId) {
            const wardList = await getWardsByProvinceAction(provinceId);
            setWards(wardList || []);
        }
    };

    // Hàm xử lý ảnh: Kiểm tra định dạng và kích thước ngay khi chọn
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setClientError(''); // Reset lỗi

        if (file) {
            // Kiểm tra loại file (chỉ jpg, png)
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                setClientError('Chỉ chấp nhận ảnh định dạng .jpg hoặc .png');
                e.target.value = ''; // Reset input
                setPreviewUrl(null);
                return;
            }

            // Kiểm tra kích thước (< 50 MB)
            if (file.size > 50 * 1024 * 1024) { // 50MB = 50 * 1024 * 1024 bytes
                setClientError('Dung lượng ảnh quá lớn. Vui lòng chọn ảnh dưới 50MB.');
                e.target.value = '';
                setPreviewUrl(null);
                return;
            }

            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Hàm kiểm tra dữ liệu trước khi submit
    const validateForm = (formData) => {
        const sdt = formData.get('sdt');
        const cccd = formData.get('cccd');
        const email = formData.get('email');
        const ngaySinh = formData.get('ngay_sinh');

        // 1. Kiểm tra SĐT (10 hoặc 11 số, bắt đầu bằng 0)
        const phoneRegex = /^0\d{9,10}$/;
        if (!phoneRegex.test(sdt)) {
            return 'Số điện thoại không hợp lệ. Phải có 10 hoặc 11 chữ số và bắt đầu bằng số 0.';
        }

        // 2. Kiểm tra CCCD (12 số hoặc 9 số CMND cũ)
        // Regex này bắt buộc đúng 12 chữ số
        const cccdRegex = /^\d{9,12}$/;
        if (!cccdRegex.test(cccd)) {
            return 'Số CCCD không hợp lệ. Phải bao gồm đúng 9 hoặc 12 chữ số.';
        }

        // 3. Kiểm tra Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Địa chỉ Email không hợp lệ.';
        }

        // 4. Kiểm tra ngày sinh (YYYY-MM-DD là định dạng chuẩn của input date, ta check logic tuổi)
        const birthDate = new Date(ngaySinh);
        const today = new Date();
        if (birthDate >= today) {
            return 'Ngày sinh không hợp lệ (phải nhỏ hơn ngày hiện tại).';
        }

        return null; // Không có lỗi
    };

    // Xử lý sự kiện Submit
    const handleSubmit = (e) => {
        setClientError('');
        // Lấy dữ liệu từ form để kiểm tra
        const formData = new FormData(e.currentTarget);
        const error = validateForm(formData);

        if (error) {
            e.preventDefault(); // Chặn việc gửi form nếu có lỗi
            setClientError(error);
            // Cuộn lên đầu để người dùng thấy lỗi
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Nếu không có lỗi, formAction sẽ tự động chạy tiếp
    };

    if (state?.success) {
        const data = state.data;
        const qrContent = `PAYMENT|${data.mayeucauthe}|${totalCost}`;

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-green-400 to-blue-500"></div>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={3} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Đăng ký thành công!</h1>
                    <p className="text-gray-500 mb-6">Hồ sơ của bạn đã được ghi nhận. Vui lòng thanh toán để hoàn tất.</p>
=
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6 inline-block">
                        <QRCode value={qrContent} size={180} className="mx-auto" />
                        <p className="text-xs text-gray-400 mt-3 font-mono">MDH: {data.mayeucauthe}</p>
                    </div>

                    <div className="space-y-2 mb-8">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Phí làm thẻ</span>
                            <span className="font-medium text-gray-900">{(totalCost - (ship ? SHIPPING_FEE : 0)).toLocaleString()} đ</span>
                        </div>
                        {ship && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phí giao hàng</span>
                                <span className="font-medium text-gray-900">{SHIPPING_FEE.toLocaleString()} đ</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2 text-blue-600">
                            <span>Tổng cộng</span>
                            <span>{totalCost.toLocaleString()} đ</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link href="/" className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                            Trang chủ
                        </Link>
                        <Link href="/dang_ky_the/tra_cuu" className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                            Theo dõi hồ sơ
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">

            {/* 1. HERO HEADER */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 h-[300px] flex items-center justify-center overflow-hidden pb-10">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                        From đăng ký thẻ bạn đọc
                    </h1>
                    <p className="text-blue-100 text-lg font-light max-w-2xl mx-auto">
                        Nơi bạn có thể điền thông tin để đăng ký thẻ bạn đọc tại thư viện của chúng tôi.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">

                {/* Header Form */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">Điền thông tin hồ sơ</h1>
                        <p className="text-white mt-1">Vui lòng nhập chính xác thông tin để in thẻ.</p>
                    </div>
                    <Link href="/dang_ky_the" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Error Box */}
                    {(state?.error || clientError) && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3">
                            <span className="text-xl">⚠️</span>
                            <span className="font-medium">{state?.error || clientError}</span>
                        </div>
                    )}

                    <form action={formAction} onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">

                        {/* Section 1: Loại thẻ */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                                Chọn loại thẻ
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                {isLoading ? (
                                    <div className="animate-pulse h-12 bg-gray-200 rounded-lg"></div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            id="ma_loai_the"
                                            name="ma_loai_the"
                                            onChange={(e) => setLoaiThe(e.target.value)}
                                            value={loaiThe}
                                            className="block w-full pl-12 pr-10 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none outline-none font-medium"
                                        >
                                            {cardTypesList.map((card) => (
                                                <option key={card.maloaithe} value={card.maloaithe}>
                                                    {card.tenthe} — {PRICE_MAP[card.maloaithe]?.toLocaleString('vi-VN') || 0} đ
                                                </option>
                                            ))}
                                        </select>
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                    </div>
                                )}
                                {!isLoading && loaiThe && (
                                    <p className="text-sm text-blue-600 mt-2 pl-1 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                        {cardTypesList.find(c => String(c.maloaithe) === loaiThe)?.mota}
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Section 2: Thông tin cá nhân */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                                Thông tin cá nhân
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Họ và tên <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="text" name="ho_ten" placeholder="Nguyễn Văn A" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                                        <User className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Ngày sinh <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="date" name="ngay_sinh" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                                        <Calendar className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="tel" name="sdt" maxLength={11} placeholder="0905..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                                        <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">CCCD / CMND <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="text" name="cccd" maxLength={12} placeholder="12 chữ số" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                                        <CreditCard className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Email <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type="email" name="email" placeholder="example@email.com" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                                        <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Địa chỉ & Ảnh */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
                                Địa chỉ & Ảnh thẻ
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <select onChange={handleProvinceChange} value={selectedProvince} className="p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                            <option value="">Chọn Tỉnh/Thành</option>
                                            {provinces.map(p => <option key={p.matinhthanhpho} value={p.matinhthanhpho}>{p.tentinhthanhpho}</option>)}
                                        </select>
                                        <select name="ma_phuong_xa" disabled={!selectedProvince} className="p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" required>
                                            <option value="">Chọn Phường/Xã</option>
                                            {wards.map(w => <option key={w.maphuongxa} value={w.maphuongxa}>{w.tenphuongxa}</option>)}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <input type="text" name="dia_chi" placeholder="Số nhà, tên đường..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                                        <MapPin className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Ảnh thẻ (3x4) <span className="text-red-500">*</span></label>
                                    <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${previewUrl ? 'border-blue-500 bg-blue-50/30' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Preview" width={100} height={130} className="object-cover rounded-lg shadow-sm border border-gray-200" unoptimized />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                                                <Upload className="w-10 h-10 mb-3" strokeWidth={1.5} />
                                                <p className="text-sm"><span className="font-bold text-blue-600">Nhấn để tải lên</span> hoặc kéo thả</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max 50MB)</p>
                                            </div>
                                        )}
                                        <input type="file" name="anh_the" accept="image/png, image/jpeg" onChange={handleImageChange} className="hidden" required />
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Thanh toán */}
                        <div className="bg-linear-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${ship ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                        {ship && <CheckCircle size={14} className="text-white"/>}
                                    </div>
                                    <input type="checkbox" name="giao_hang" checked={ship} onChange={(e) => setShip(e.target.checked)} className="hidden" />
                                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                                        <Truck size={18} className="text-blue-500"/> Giao thẻ tận nhà (+30k)
                                    </div>
                                </div>
                            </label>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                <span className="text-gray-500 font-medium">Tổng thanh toán</span>
                                <span className="text-2xl font-extrabold text-blue-700">{totalCost.toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        <SubmitButton />
                    </form>
                </div>
            </div>
        </div>
    );
}