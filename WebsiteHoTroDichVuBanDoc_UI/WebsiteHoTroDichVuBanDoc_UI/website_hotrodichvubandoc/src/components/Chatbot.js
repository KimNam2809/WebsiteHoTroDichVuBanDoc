// src/components/Chatbot.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Chào bạn! Tôi là trợ lý AI của thư viện. Tôi có thể giúp bạn tìm sách hoặc giải đáp quy trình làm thẻ.' },
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() === '') return;
        const userMessage = { from: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Giả lập AI đang suy nghĩ
        setMessages(prev => [...prev, { from: 'bot', text: '...', isTyping: true }]);

        setTimeout(() => {
            setMessages(prev => {
                const newMsgs = prev.filter(m => !m.isTyping); // Xóa typing indicator
                return [...newMsgs, { from: 'bot', text: 'Cảm ơn câu hỏi của bạn. Hệ thống đang tìm kiếm câu trả lời chính xác nhất từ cơ sở dữ liệu...' }];
            });
        }, 1500);
    };

    return (
        <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end font-sans">
            {/* Cửa sổ Chat */}
            <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col mb-4 w-[350px] sm:w-[380px] h-[500px] transition-all duration-300 origin-bottom-right transform ${
                isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
            }`}>
                {/* Header Gradient */}
                <div className="bg-linear-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-t-2xl flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Smart Assistant</h3>
                            <p className="text-[10px] text-blue-100 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Khung chat */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
                            {msg.from === 'bot' && (
                                <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs mr-2 shadow-sm shrink-0">
                                    AI
                                </div>
                            )}
                            <div className={`max-w-[80%] px-4 py-2.5 text-sm shadow-sm ${
                                msg.from === 'bot'
                                    ? 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100'
                                    : 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                            }`}>
                                {msg.isTyping ? <span className="animate-pulse">...</span> : msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-white border-t rounded-b-2xl">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Hỏi về sách, thủ tục..."
                            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
                        />
                        <button onClick={handleSend} className={`text-blue-600 p-1.5 rounded-full hover:bg-blue-100 transition ${!input.trim() && 'opacity-50 cursor-not-allowed'}`}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Nút Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    isOpen ? 'bg-gray-200 text-gray-600 rotate-90' : 'bg-linear-to-r from-blue-600 to-cyan-500 text-white animate-bounce-slow'
                }`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
}