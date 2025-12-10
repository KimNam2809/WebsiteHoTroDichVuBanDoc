// src/app/dang_ky_the/form/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerCardAction, getCardTypesAction, getProvincesAction, getWardsByProvinceAction } from '../actions';

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
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
            {pending ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ đăng ký'}
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
            <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg text-center animate-fade-in">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-green-600 mb-4">Đăng ký thành công!</h1>
                <p className="text-gray-700 mb-6">Mã hồ sơ: <strong className="text-blue-600">{data.mayeucauthe}</strong></p>
                <div className="p-4 bg-white inline-block rounded-lg border shadow-sm">
                    <QRCode value={qrContent} size={200} />
                </div>
                <p className="font-bold text-xl mt-4 text-blue-800">Tổng tiền: {totalCost.toLocaleString('vi-VN')} VNĐ</p>
                <p className="text-sm text-gray-500 mt-2">Quét mã để thanh toán phí làm thẻ</p>
                <div className="mt-8 space-x-4">
                    <Link href="/" className="text-gray-600 hover:underline">Trang chủ</Link>
                    <Link href="/tai_khoan" className="text-purple-600 hover:underline font-medium">Về Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Đăng ký thẻ bạn đọc</h1>
                <Link href="/dang_ky_the" className="text-blue-600 hover:underline flex items-center">
                    <span className="mr-1">&larr;</span> Quay lại
                </Link>
            </div>

            {/* Hiển thị lỗi từ Server hoặc Client */}
            {(state?.error || clientError) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span>{state?.error || clientError}</span>
                </div>
            )}

            {/* Form với sự kiện onSubmit để validate */}
            <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
                {/* Hàng 1: Loại thẻ */}
                <div>
                    <label htmlFor="ma_loai_the" className="block text-sm font-medium mb-1 text-gray-700">Loại thẻ <span className="text-red-500">*</span></label>
                    {isLoading ? (
                        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                    ) : (
                        <select
                            id="ma_loai_the"
                            name="ma_loai_the"
                            onChange={(e) => setLoaiThe(e.target.value)}
                            value={loaiThe}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            {cardTypesList.map((card) => (
                                <option key={card.maloaithe} value={card.maloaithe}>
                                    {card.tenthe} ({PRICE_MAP[card.maloaithe]?.toLocaleString('vi-VN') || 0} đ)
                                </option>
                            ))}
                        </select>
                    )}
                    {!isLoading && loaiThe && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                            {cardTypesList.find(c => String(c.maloaithe) === loaiThe)?.mota}
                        </p>
                    )}
                </div>

                {/* Hàng 2: Thông tin cá nhân */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="ho_ten"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày sinh <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="ngay_sinh"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Định dạng: YYYY-MM-DD</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Giới tính <span className="text-red-500">*</span></label>
                        <select name="gioi_tinh" className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500" required>
                            <option value="">-- Chọn giới tính --</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nghề nghiệp</label>
                        <input type="text" name="nghe_nghiep" className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500" placeholder="Sinh viên/Học sinh..." />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Số CCCD <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="cccd"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="048203001234"
                            maxLength={12}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Bắt buộc 9 (CMND) hoặc 12 chữ số (CCCD)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            name="sdt"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0905123456"
                            maxLength={11}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">10 hoặc 11 số, bắt đầu bằng số 0</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        name="email"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="nguyenvana@example.com"
                        required
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ (Số nhà, tên đường) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="dia_chi"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
                            placeholder="123 Tôn Đức Thắng"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Combobox Tỉnh/Thành */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                            <select
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                required
                            >
                                <option value="">-- Chọn Tỉnh/Thành --</option>
                                {provinces.map((p) => (
                                    <option key={p.matinhthanhpho} value={p.matinhthanhpho}>
                                        {p.tentinhthanhpho}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Combobox Phường/Xã */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phường / Xã <span className="text-red-500">*</span></label>
                            <select
                                name="ma_phuong_xa" // Quan trọng: Tên này sẽ được gửi lên API
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
                                required
                                disabled={!selectedProvince} // Khóa nếu chưa chọn tỉnh
                            >
                                <option value="">-- Chọn Phường/Xã --</option>
                                {wards.map((w) => (
                                    <option key={w.maphuongxa} value={w.maphuongxa}>
                                        {w.tenphuongxa}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tải ảnh */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh thẻ (3x4) <span className="text-red-500">*</span></label>
                    <div className={`mt-1 p-6 border-2 border-dashed rounded-lg text-center transition-colors ${previewUrl ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        {previewUrl ? (
                            <div className="relative inline-block">
                                <Image src={previewUrl} alt="Preview" width={120} height={160} className="mx-auto mb-4 rounded border object-cover shadow-sm" unoptimized />
                                <p className="text-sm text-green-600 font-medium">✓ Ảnh hợp lệ</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>Nhấn để chọn ảnh hoặc kéo thả vào đây</p>
                                <p className="text-xs mt-1">(Định dạng .jpg/.png, dung lượng &lt; tối đa 50MB)</p>
                            </div>
                        )}
                        <input
                            type="file"
                            name="anh_the"
                            accept="image/png, image/jpeg"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 mt-4 cursor-pointer"
                            required
                        />
                    </div>
                </div>

                {/* Thanh toán */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Thanh toán</h3>
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="giao_hang"
                                checked={ship}
                                onChange={(e) => setShip(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Giao hàng tận nơi (+30.000 VNĐ)</span>
                        </label>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-3 mt-2">
                        <span>Tổng tiền:</span>
                        <span className="text-blue-700">{totalCost.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                </div>

                <SubmitButton />
            </form>
        </div>
    );
}