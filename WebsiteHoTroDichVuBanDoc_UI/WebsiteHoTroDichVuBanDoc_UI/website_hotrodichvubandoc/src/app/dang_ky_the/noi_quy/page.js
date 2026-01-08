// src/app/dang_ky_the/noi_quy/page.js
import Link from 'next/link';
import { ArrowLeft, Book, Clock, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { getCardTypesAction } from '../actions';

export default async function NoiQuyPage() {
    const cardTypes = await getCardTypesAction();

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">

            {/* 1. HERO HEADER */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 h-[300px] flex items-center justify-center overflow-hidden pb-10">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                        Nội Quy & Thể Lệ
                    </h1>
                    <p className="text-blue-100 text-lg font-light max-w-2xl mx-auto">
                        Thông tin chi tiết về các loại thẻ, biểu phí và quy định làm thẻ bạn đọc.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">

                {/* Nút Quay lại */}
                <div className="mb-4">
                    <Link href="/dang_ky_the" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors">
                        <ArrowLeft size={18}/> Quay lại đăng ký
                    </Link>
                </div>

                {/* 2. CARD NỘI DUNG CHÍNH */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 md:p-12 space-y-12">

                    {/* PHẦN I: CÁC LOẠI THẺ */}
                    <section>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3 border-b border-blue-100 pb-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">I</span>
                            Các Loại Thẻ & Biểu Phí
                        </h2>
                        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                            {cardTypes && cardTypes.length > 0 ? (
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Tên thẻ</th>
                                            <th className="px-6 py-4">Đối tượng áp dụng</th>
                                            <th className="px-6 py-4 text-right">Lệ phí (VNĐ/1 năm)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 text-gray-700">
                                        {cardTypes.map((card) => (
                                            <tr key={card.maloaithe} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-semibold text-gray-900">{card.tenthe}</td>
                                                <td className="px-6 py-4">{card.mota}</td>
                                                {card.lephi != 0 ? (
                                                    <td className="px-6 py-4 text-right font-bold text-blue-600">{card.lephi}</td>
                                                ) : (
                                                    <td className="px-6 py-4 text-right font-bold text-green-600 uppercase text-xs rounded-full">Miễn phí</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Tên thẻ</th>
                                            <th className="px-6 py-4">Đối tượng áp dụng</th>
                                            <th className="px-6 py-4 text-right">Lệ phí (1 năm)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 text-gray-700">
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">Danh sách thẻ đang cập nhật</td>
                                            <td className="px-6 py-4">Danh sách thẻ đang cập nhật</td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600">Danh sách thẻ đang cập nhật</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                            {/* <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Tên thẻ</th>
                                        <th className="px-6 py-4">Đối tượng áp dụng</th>
                                        <th className="px-6 py-4 text-right">Lệ phí (1 năm)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-gray-700">
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">Thẻ Sinh viên</td>
                                        <td className="px-6 py-4">Sinh viên ĐH, Cao đẳng (Cần thẻ SV)</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">50,000 đ</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">Thẻ Phổ thông</td>
                                        <td className="px-6 py-4">Mọi đối tượng bạn đọc</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">100,000 đ</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">Thẻ Nghiên cứu</td>
                                        <td className="px-6 py-4">Giảng viên, Nghiên cứu sinh</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">50,000 đ</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 bg-yellow-50/50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">Thẻ Mượn</td>
                                        <td className="px-6 py-4">Dịch vụ thuê mượn đặc biệt</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">100,000 đ</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 bg-green-50/50">
                                        <td className="px-6 py-4 font-semibold text-green-800">Thẻ Thiếu nhi</td>
                                        <td className="px-6 py-4">Trẻ em từ 6 - 15 tuổi</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600 uppercase text-xs rounded-full">Miễn phí</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 bg-green-50/50">
                                        <td className="px-6 py-4 font-semibold text-green-800">Thẻ Đọc</td>
                                        <td className="px-6 py-4">Chỉ đọc tại chỗ (Không mượn về)</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600 uppercase text-xs rounded-full">Miễn phí</td>
                                    </tr>
                                </tbody>
                            </table> */}
                        </div>
                    </section>

                    {/* PHẦN II: THỜI GIAN */}
                    <section>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3 border-b border-blue-100 pb-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">II</span>
                            Thời Gian Làm Việc
                        </h2>
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                            <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm shrink-0">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">Bộ phận Cấp thẻ & Trả cược</h3>
                                <p className="text-gray-700 mb-2">Làm việc từ <strong>Thứ 3 đến Chủ nhật</strong> hàng tuần (Nghỉ chiều Thứ 6 & ngày Lễ).</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                    <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 text-sm">
                                        <span className="block text-gray-500 text-xs uppercase font-bold">Sáng</span>
                                        <span className="font-bold text-gray-800">7:30 - 11:15</span>
                                    </div>
                                    <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 text-sm">
                                        <span className="block text-gray-500 text-xs uppercase font-bold">Chiều</span>
                                        <span className="font-bold text-gray-800">13:30 - 16:50</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* PHẦN III: THỦ TỤC */}
                    <section>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3 border-b border-blue-100 pb-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">III</span>
                            Thủ Tục Cần Thiết
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500"/> 1. Hồ sơ đăng ký
                                </h3>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0"/>
                                        <span>Tờ khai cấp thẻ (Điền form online hoặc tại quầy).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0"/>
                                        <span>CCCD/CMND bản gốc hoặc ảnh chụp 2 mặt.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0"/>
                                        <span>01 ảnh chân dung 3x4 (chụp không quá 6 tháng).</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-orange-500"/> 2. Quy định bổ sung
                                </h3>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></span>
                                        <span><strong>Sinh viên/Học sinh:</strong> Cần thẻ HSSV hoặc giấy xác nhận của trường.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></span>
                                        <span><strong>Ngoại tỉnh:</strong> Cần giấy xác nhận tạm trú/thường trú.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 shrink-0"></span>
                                        <span><strong>Thẻ Thiếu nhi:</strong> Cần chữ ký xác nhận của phụ huynh.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Lưu ý tiền cược */}
                        <div className="mt-8 bg-yellow-50 p-5 rounded-2xl border border-yellow-100 flex gap-4">
                            <div className="bg-yellow-100 p-2 rounded-full h-fit text-yellow-600 shrink-0">
                                <Book size={20} />
                            </div>
                            <div className="text-sm text-gray-700">
                                <h4 className="font-bold text-gray-900 mb-1">Lưu ý về tiền cược sách (Deposit)</h4>
                                <p className="mb-2">Đối với <strong>Thẻ Mượn</strong> và <strong>Thẻ Thiếu nhi</strong>, bạn đọc cần đóng thêm tiền cược để đảm bảo tài sản:</p>
                                <ul className="list-disc list-inside space-y-1 ml-1 text-gray-600">
                                    <li>Hộ khẩu Đà Nẵng: <strong>70,000đ - 150,000đ</strong> tùy số lượng sách.</li>
                                    <li>Ngoại tỉnh: <strong>100,000đ / cuốn</strong>.</li>
                                </ul>
                                <p className="mt-2 text-yellow-700 italic font-medium">* Tiền cược sẽ được hoàn lại 100% khi bạn trả hết sách và trả thẻ.</p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}