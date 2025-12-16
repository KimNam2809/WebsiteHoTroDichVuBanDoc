// src/components/Footer.js
'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Youtube, Instagram, Clock, ExternalLink, BookOpen } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans">
            {/* Phần chính */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                    {/* Cột 1: Thông tin chung */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                                <BookOpen size={20} strokeWidth={3} />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">
                                SMART LIB <span className="text-cyan-400">DN</span>
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-400">
                            Thư viện Khoa học Tổng hợp Đà Nẵng là trung tâm tri thức, văn hóa và công nghệ, cung cấp nguồn tài liệu phong phú và không gian học tập hiện đại cho cộng đồng.
                        </p>
                        <div className="pt-4 flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                                <Youtube size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Cột 2: Liên kết nhanh */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Khám phá
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Tra cứu tài liệu', href: '/tim_kiem' },
                                { name: 'Đăng ký thẻ thành viên', href: '/dang_ky_the' },
                                { name: 'Gia hạn sách online', href: '/tai_khoan' },
                                { name: 'Đề xuất mua sách', href: '#' },
                                { name: 'Quy định thư viện', href: '#' },
                                { name: 'Câu hỏi thường gặp', href: '#' },
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <Link href={link.href} className="hover:text-cyan-400 transition-colors flex items-center gap-2 text-sm">
                                        <ExternalLink size={14} className="opacity-50"/> {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Cột 3: Liên hệ */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-cyan-500 rounded-full"></span> Liên hệ
                        </h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="shrink-0 text-cyan-400 mt-0.5" size={18} />
                                <span>46 Bạch Đằng, Quận Hải Châu,<br/>Thành phố Đà Nẵng</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="shrink-0 text-cyan-400" size={18} />
                                <span>(0236) 3.123.456 - Hotline 24/7</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="shrink-0 text-cyan-400" size={18} />
                                <a href="mailto:contact@thuvien.danang.gov.vn" className="hover:text-white">contact@thuvien.danang.gov.vn</a>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 4: Giờ mở cửa */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-500 rounded-full"></span> Giờ mở cửa
                        </h3>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3 text-sm">
                            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                                <span className="text-slate-400">Thứ 2 - Thứ 6</span>
                                <span className="font-bold text-white">7:30 - 20:00</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                                <span className="text-slate-400">Thứ 7 - CN</span>
                                <span className="font-bold text-white">8:00 - 17:00</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-yellow-500 pt-1">
                                <Clock size={14} className="mt-0.5"/>
                                <span>Phòng đọc số 24/7 mở cửa xuyên suốt tất cả các ngày (Dành cho thẻ VIP).</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bản quyền */}
            <div className="bg-slate-950 py-6 border-t border-slate-800">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© 2024 Thư viện KHTH Đà Nẵng. Bản quyền thuộc về sinh viên thực hiện đồ án.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-white">Điều khoản sử dụng</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}