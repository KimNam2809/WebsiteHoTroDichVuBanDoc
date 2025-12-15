// src/app/layout.js
import './globals.css';
import { Inter } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import Header from '@/components/Header';
import Chatbot from '@/components/Chatbot';
// import Footer from '@/components/Footer';

config.autoAddCss = false;
const inter = Inter({ subsets: ['latin', 'vietnamese'], weight: ['300', '400', '500', '600', '700', '800'] });

export const metadata = {
  title: 'Thư viện KHTH Đà Nẵng | Smart Library',
  description: 'Thư viện số thông minh, hỗ trợ tra cứu AI và mượn trả tự động.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${inter.className} scroll-smooth`}>
      <body className="bg-white text-gray-900 antialiased flex flex-col min-h-screen">
        <Header />
        <main className="grow">
          {children}
        </main>
        {/* Nếu bạn chưa có Footer, có thể tạm comment dòng dưới */}
        {/* <Footer /> */}
        <Chatbot />
      </body>
    </html>
  );
}