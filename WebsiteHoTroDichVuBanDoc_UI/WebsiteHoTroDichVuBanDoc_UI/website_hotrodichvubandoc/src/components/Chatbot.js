// src/components/Chatbot.js
'use client'; // BẮT BUỘC: Vì chatbot cần tương tác (bật/tắt)

import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react'; // Import các icon

export default function Chatbot() {
  // State để quản lý việc bật/tắt cửa sổ chat
    const [isOpen, setIsOpen] = useState(false);

    // Dữ liệu chat giả lập (sau này sẽ thay bằng AI)
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Chào bạn! Tôi có thể giúp gì cho bạn?' },
    ]);
    const [input, setInput] = useState('');

    // Hàm xử lý khi gửi tin nhắn
    const handleSend = () => {
        if (input.trim() === '') return;

        // Thêm tin nhắn của người dùng vào
        const userMessage = { from: 'user', text: input };
        setMessages([...messages, userMessage]);
        setInput('');

        // Giả lập bot trả lời sau 1 giây
        setTimeout(() => {
            const botMessage = { from: 'bot', text: 'Tôi đang xử lý câu hỏi của bạn...' };
            setMessages(prev => [...prev, botMessage]);
        }, 1000);
    };

    return (
        // Container cố định ở góc dưới bên phải
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">

            {/* === Cửa sổ Chat (chỉ hiện khi isOpen) === */}
            {isOpen && (
                <div className="w-80 h-96 bg-white rounded-lg shadow-xl border flex flex-col mb-4">

                    {/* Header */}
                    <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-lg">
                        <h3 className="font-semibold">Chat Hỗ trợ AI 🤖</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-blue-700 p-1 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Khung chat */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}
                            >
                                <span
                                    className={`px-3 py-2 rounded-lg ${
                                        msg.from === 'bot'
                                            ? 'bg-gray-200 text-gray-800'
                                            : 'bg-blue-500 text-white'
                                    }`}
                                >
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Khung nhập liệu */}
                    <div className="p-3 border-t flex">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Nhập câu hỏi..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSend}
                            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* === Nút Bật/Tắt Chat === */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition-transform"
            >
                {/* Hiển thị icon X (đóng) nếu đang mở, ngược lại hiển thị icon chat */}
                {isOpen ? (
                    <X className="w-8 h-8" />
                ) : (
                    <MessageSquare className="w-8 h-8" />
                )}
            </button>
        </div>
    );
}