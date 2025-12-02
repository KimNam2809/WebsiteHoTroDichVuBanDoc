// src/app/dang_ky_the/noi_quy/page.js
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NoiQuyPage() {
    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg mb-10">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Nội quy & Thể lệ làm thẻ</h1>
                <Link href="/dang_ky_the" className="text-gray-500 hover:text-blue-600 flex items-center text-sm font-medium">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                </Link>
            </div>

            <article className="prose prose-blue max-w-none text-gray-700">
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-blue-700 mb-3">I. CÁC LOẠI THẺ VÀ BIỂU PHÍ</h2>
                    <p className="mb-3">Thư viện hiện cung cấp các loại thẻ sau cho bạn đọc:</p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Tên thẻ</th>
                                    <th className="px-4 py-2 text-left">Đối tượng</th>
                                    <th className="px-4 py-2 text-left">Lệ phí (VNĐ)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr>
                                    <td className="px-4 py-2 font-semibold">Thẻ Sinh viên</td>
                                    <td className="px-4 py-2">Sinh viên ĐH, Cao đẳng</td>
                                    <td className="px-4 py-2 text-blue-600 font-bold">50,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-semibold">Thẻ Phổ thông</td>
                                    <td className="px-4 py-2">Mọi đối tượng bạn đọc</td>
                                    <td className="px-4 py-2 text-blue-600 font-bold">100,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-semibold">Thẻ Nghiên cứu</td>
                                    <td className="px-4 py-2">Giảng viên, NCS</td>
                                    <td className="px-4 py-2 text-blue-600 font-bold">50,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-semibold">Thẻ Mượn</td>
                                    <td className="px-4 py-2">Dịch vụ thuê mượn đặc biệt</td>
                                    <td className="px-4 py-2 text-blue-600 font-bold">100,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-semibold">Thẻ Thiếu nhi</td>
                                    <td className="px-4 py-2">Trẻ em 1 - 15 tuổi</td>
                                    <td className="px-4 py-2 text-green-600 font-bold">Miễn phí</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 font-semibold">Thẻ Đọc</td>
                                    <td className="px-4 py-2">Chỉ đọc tại chỗ</td>
                                    <td className="px-4 py-2 text-green-600 font-bold">Miễn phí</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-blue-700 mb-3">II. THỜI GIAN LÀM VIỆC</h2>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="font-semibold">Thời gian cấp thẻ & trả cược:</p>
                        <p>Từ <strong>Thứ 3 đến Chủ nhật</strong> hàng tuần (Trừ chiều Thứ 6).</p>
                        <ul className="list-disc list-inside mt-2">
                            <li><strong>Sáng:</strong> 7h30 - 11h15</li>
                            <li><strong>Chiều:</strong> 13h30 - 16h50</li>
                        </ul>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-blue-700 mb-3">III. THỦ TỤC CẦN THIẾT</h2>

                    <h3 className="font-bold text-gray-800 mt-4">1. Hồ sơ đăng ký</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Tờ khai cấp thẻ (Điền trực tuyến hoặc tại quầy).</li>
                        <li>CCCD/CMND bản gốc hoặc ảnh chụp.</li>
                        <li>01 ảnh chân dung 3x4 hoặc 4x6 (chụp không quá 6 tháng).</li>
                    </ul>

                    <h3 className="font-bold text-gray-800 mt-4">2. Quy định bổ sung</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Đối với Sinh viên/Học sinh:</strong> Cần có thẻ HSSV hoặc giấy xác nhận của trường.</li>
                        <li><strong>Đối với người ngoại tỉnh:</strong> Cần có giấy xác nhận tạm trú.</li>
                        <li><strong>Đối với Thẻ Thiếu nhi:</strong> Cần có xác nhận của phụ huynh hoặc người giám hộ.</li>
                    </ul>

                    <h3 className="font-bold text-gray-800 mt-4">3. Lưu ý về tiền cược sách</h3>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm">
                        <p>Đối với <strong>Thẻ Mượn</strong> và <strong>Thẻ Thiếu nhi</strong>, ngoài lệ phí làm thẻ, bạn đọc cần đóng thêm tiền cược sách:</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Cược 70,000đ - 150,000đ tùy số lượng sách (với hộ khẩu Đà Nẵng).</li>
                            <li>Cược 100,000đ/cuốn (với ngoại tỉnh).</li>
                        </ul>
                        <p className="mt-2 italic">* Tiền cược sẽ được hoàn lại khi bạn đọc trả hết sách và không còn nhu cầu sử dụng thẻ.</p>
                    </div>
                </section>
            </article>
        </div>
    );
}