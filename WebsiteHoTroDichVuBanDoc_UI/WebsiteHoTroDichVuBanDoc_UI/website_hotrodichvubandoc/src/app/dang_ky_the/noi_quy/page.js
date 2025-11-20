import Link from 'next/link';

export default function NoiQuyPage() {
    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Nội quy làm thẻ bạn đọc</h1>
                <Link href="/dang_ky_the" className="text-blue-600 hover:underline">&larr; Quay lại</Link>
            </div>

            <article className="prose prose-blue max-w-none">
                <section>
                    <h2>I. Đối tượng làm thẻ</h2>
                    <ul>
                        <li>Cán bộ, công chức, viên chức...</li>
                        <li>Sĩ quan, quân nhân...</li>
                        <li>Người dân có hộ khẩu thường trú tại TP Đà Nẵng, Quảng Nam.</li>
                        <li>Học sinh, sinh viên các trường Đại học, Cao đẳng, THCN, THPT tại Đà Nẵng.</li>
                        <li>Người nước ngoài đang sinh sống và làm việc tại Đà Nẵng.</li>
                    </ul>
                </section>

                <section>
                    <h2>II. Thủ tục</h2>
                    <ul>
                        <li><strong>Thẻ Mượn:</strong> 02 ảnh 3x4, 02 ảnh 2x3. Xuất trình CMND hoặc Thẻ HSSV.</li>
                        <li><strong>Thẻ Đọc:</strong> 01 ảnh 2x3. Xuất trình CMND hoặc Thẻ HSSV.</li>
                    </ul>
                </section>

                <section>
                    <h2>III. Lệ phí, thời hạn</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Loại thẻ</th>
                                <th>Lệ phí (VNĐ)</th>
                                <th>Thời hạn</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {/* Cá nhân lớn hơn 16 tuổi */}
                                <td>Thẻ Đọc (Cá nhân &gt; 16 tuổi)</td>
                                <td>20,000</td>
                                <td>1 năm</td>
                            </tr>
                            <tr>
                                {/* Cá nhân lớn hơn 16 tuổi */}
                                <td>Thẻ Mượn (Cá nhân &gt; 16 tuổi)</td>
                                <td>40,000</td>
                                <td>1 năm</td>
                            </tr>
                            <tr>
                                <td>Thẻ Đọc (Thiếu nhi 7-15 tuổi)</td>
                                <td>10,000</td>
                                <td>1 năm</td>
                            </tr>
                            <tr>
                                <td>Thẻ Mượn (Thiếu nhi 7-15 tuổi)</td>
                                <td>20,000</td>
                                <td>1 năm</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </article>
        </div>
    );
}