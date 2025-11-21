import Link from 'next/link';
import { CheckCircle, BookOpen, User, CreditCard, Gift, Users, Shield } from 'lucide-react'; // Cài thêm: npm install lucide-react

export default function DangKyTheLandingPage() {
    const cardTypes = [
        { title: 'Thẻ Đọc (Cá nhân > 16 tuổi)', description: 'Đọc tài liệu tại chỗ', price: '20,000 VNĐ/năm', icon: BookOpen },
        { title: 'Thẻ Mượn (Cá nhân > 16 tuổi)', description: 'Mượn tài liệu về nhà', price: '40,000 VNĐ/năm', icon: User },
        { title: 'Thẻ Đọc (Thiếu nhi 7-15 tuổi)', description: 'Đọc tài liệu tại chỗ', price: '10,000 VNĐ/năm', icon: Gift },
        { title: 'Thẻ Mượn (Thiếu nhi 7-15 tuổi)', description: 'Mượn tài liệu về nhà', price: '20,000 VNĐ/năm', icon: Users },
    ];

    const steps = [
        { number: 1, title: 'Điền thông tin', description: 'Hoàn thành form đăng ký với đầy đủ thông tin cá nhân' },
        { number: 2, title: 'Upload ảnh', description: 'Tải lên ảnh chân dung theo đúng quy cách' },
        { number: 3, title: 'Thanh toán', description: 'Thanh toán phí làm thẻ qua QR code hoặc khi nhận thẻ' },
        { number: 4, title: 'Nhận thẻ', description: 'Nhận thẻ tại thư viện hoặc giao hàng tận nơi' },
    ];

    return (
        <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
            {/* 1. Header */}
            <div className="text-center p-10 bg-linear-to-r from-blue-600 to-indigo-700 rounded-lg shadow-inner mb-12">
                <h1 className="text-4xl font-bold text-white">Đăng ký thẻ bạn đọc</h1>
                <p className="text-lg text-blue-100 mt-2">Thư viện Thành phố Đà Nẵng</p>
            </div>

            {/* 2. Quy trình */}
            <h2 className="text-2xl font-semibold text-center mb-8">Quy trình đăng ký thẻ bạn đọc</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {steps.map((step) => (
                    <div key={step.number} className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-xl mb-3">
                            {step.number}
                        </div>
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                ))}
            </div>

            {/* 3. Các loại thẻ */}
            <h2 className="text-2xl font-semibold text-center mb-8">Các loại thẻ bạn đọc</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {cardTypes.map((card) => (
                    <div key={card.title} className="p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm flex items-start space-x-4">
                        <card.icon className="w-8 h-8 text-blue-600 mt-1" />
                        <div>
                            <h3 className="text-xl font-bold">{card.title}</h3>
                            <p className="text-gray-600 mb-2">{card.description}</p>
                            <span className={`font-semibold ${card.price === 'Miễn phí' ? 'text-green-600' : 'text-red-600'}`}>
                                {card.price}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. Nút hành động */}
            <div className="text-center">
                <Link
                    href="/dang_ky_the/form"
                    className="w-full max-w-xs inline-block py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-md"
                >
                    Bắt đầu đăng ký
                </Link>
                <div className="mt-6 space-x-6">
                    <Link href="/dang_ky_the/tra_cuu" className="text-blue-600 hover:underline">
                        Tra cứu thông tin thẻ
                    </Link>
                    <Link href="/dang_ky_the/noi_quy" className="text-blue-600 hover:underline">
                        Xem nội quy làm thẻ
                    </Link>
                </div>
            </div>
        </div>
    );
}