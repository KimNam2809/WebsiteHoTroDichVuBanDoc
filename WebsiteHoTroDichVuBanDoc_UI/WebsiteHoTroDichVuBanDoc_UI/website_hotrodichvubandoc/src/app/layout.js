// src/app/layout.js
// KHÔNG CÓ 'use client' Ở ĐÂY NỮA

import './globals.css';
import { Inter } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import ClientLayout from '@/components/ClientLayout'; // 👈 1. Import component client mới

config.autoAddCss = false;
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

// 2. metadata được GIỮ LẠI ở đây (Đây là Server Component)
export const metadata = {
  title: 'Thư viện KHTH Đà Nẵng',
  description: 'Website ứng dụng AI và Chatbot hỗ trợ bạn đọc',
};

export default function RootLayout({ children }) {
  // 3. XÓA 'useEffect' khỏi đây

  return (
    <html lang="vi" className={`${inter.className} h-full`}>
      <body className="bg-gray-50 flex flex-col min-h-screen">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}