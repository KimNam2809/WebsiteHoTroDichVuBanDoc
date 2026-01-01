// src/components/ChatWidget.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Để xử lý điều hướng
import Image from 'next/image';
import { MessageCircle, X, Send, Sparkles, User, Book, Calendar, HelpCircle, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessageAction } from '@/app/actions/chat';

const getGreeting = (userName) => {
    const hour = new Date().getHours();
    let timeGreeting = "Chào buổi sáng";
    if (hour >= 12 && hour < 18) timeGreeting = "Chào buổi chiều";
    if (hour >= 18) timeGreeting = "Chào buổi tối";
    return `${timeGreeting}, ${userName || 'bạn'}!`;
};

const getSuggestions = (role) => {
    const common = [
        { label: "Tìm sách kinh tế", action: "Tìm sách kinh tế", icon: Book },
        { label: "Giờ mở cửa", action: "Thư viện mở cửa lúc nào?", icon: HelpCircle },
    ];

    if (!role || role === 'guest') return [
        { label: "Hướng dẫn làm thẻ", action: "Làm thẻ thư viện cần những gì?", icon: User },
        ...common
    ];

    if (role === 'ban_doc' || role === 'nguoiDung') return [
        { label: "Sách đang mượn", action: "Tôi đang mượn sách gì?", icon: Book },
        { label: "Gia hạn sách", action: "Tôi muốn gia hạn sách", icon: Calendar },
        ...common
    ];

    // Nhân viên
    return [
        { label: "Tra cứu hồ sơ", action: "Tra cứu hồ sơ bạn đọc", icon: User },
        { label: "Thống kê hôm nay", action: "Thống kê hoạt động hôm nay", icon: Sparkles },
    ];
};

export default function ChatWidget({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // State lưu Session ID của phiên chat
    const [sessionId, setSessionId] = useState(null);

    const scrollRef = useRef(null);
    const router = useRouter(); // Dùng để điều hướng

    // Tự động cuộn
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Khởi tạo tin nhắn chào mừng
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = getGreeting(user?.hoten);
            setMessages([
                {
                    id: 1,
                    type: 'bot',
                    text: `${greeting} Tôi là trợ lý AI của thư viện. Bạn cần tôi giúp gì hôm nay?`,
                    isGreeting: true
                }
            ]);
        }
    }, [isOpen, user, messages.length]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        // 1. UI: Thêm tin nhắn người dùng ngay lập tức
        const userMsg = { id: Date.now(), type: 'user', text: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // 2. GỌI API THỰC TẾ
        const result = await sendChatMessageAction({
            userId: user?.id || user?.manguoidung || null,
            sessionId: sessionId,
            message: text
        });

        setIsLoading(false);

        // 3. Xử lý phản hồi từ AI
        if (result.success) {
            const { reply, session_id, action } = result.data;

            // Cập nhật Session ID cho lần chat sau
            if (session_id) setSessionId(session_id);

            // Thêm tin nhắn của Bot
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: reply,
                action: action // Lưu kèm action nếu có
            };
            setMessages(prev => [...prev, botMsg]);

        } else {
            // Xử lý lỗi
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                text: result.error || "Xin lỗi, tôi gặp sự cố kết nối."
            }]);
        }
    };

    const handleSuggestionClick = (actionText) => {
        handleSend(actionText);
    };

    // Hàm xử lý khi click vào nút hành động (Navigation)
    const handleActionClick = (action) => {
        if (action.type === 'navigate' && action.payload?.url) {
            setIsOpen(false); // Đóng chat
            router.push(action.payload.url); // Chuyển trang
        }
    };

    // Hàm render nội dung tin nhắn (Hỗ trợ xuống dòng cơ bản)
    const renderMessageText = (text) => {
        return text.split('\n').map((line, i) => (
            <span key={i}>
                {line}
                <br />
            </span>
        ));
    };

    // --- COMPONENT CON: THẺ SÁCH MINI ---
    const BookCard = ({ book }) => (
        <div
            onClick={() => {
                setIsOpen(false); // Đóng chat nếu muốn
                router.push(`/tai_lieu/${book.id}`);
            }}
            className="flex items-start gap-3 p-3 mt-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group max-w-[280px]"
        >
            {/* Ảnh bìa */}
            <div className="relative w-12 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                {book.cover ? (
                    <Image
                        src={book.cover}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Book size={20} />
                    </div>
                )}
            </div>

            {/* Thông tin */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {book.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1 truncate">{book.author}</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
                    Xem chi tiết <ChevronRight size={10} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end gap-4 font-sans">

            {/* Tooltip */}
            <AnimatePresence>
                {isHovered && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.9 }}
                        className="bg-white px-4 py-3 rounded-xl shadow-xl border border-gray-100 text-sm text-gray-700 font-medium mb-2 mr-2 max-w-[220px] text-right relative"
                    >
                        Bạn có thể hỏi đáp nhanh chóng với Chatbot AI 🤖
                        <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cửa sổ Chat */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="w-[350px] sm:w-[380px] h-[550px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col origin-bottom-right"
                    >
                        {/* Header */}
                        <div className="bg-linear-to-r from-blue-600 to-cyan-500 p-4 flex items-center justify-between shrink-0 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white relative shadow-inner border border-white/10">
                                    <Sparkles size={20} />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg leading-tight">Smart Assistant</h3>
                                    <p className="text-blue-100 text-xs font-medium">Trợ lý ảo thông minh</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body Chat */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex w-full flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex max-w-[85%] ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.type === 'bot' && (
                                            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shrink-0 mr-2 mt-1 shadow-sm">
                                                <Sparkles size={14} />
                                            </div>
                                        )}
                                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                            msg.type === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                        }`}>
                                            {renderMessageText(msg.text)}
                                        </div>
                                    </div>

                                    {/* --- XỬ LÝ ACTION HIỂN THỊ SÁCH --- */}
                                    {msg.type === 'bot' && msg.action && msg.action.type === 'show_books' && (
                                        <div className="ml-10 mt-2 flex flex-col gap-2 w-full pr-4 animate-in fade-in slide-in-from-bottom-2">
                                            {msg.action.payload.map((book) => (
                                                <BookCard key={book.id} book={book} />
                                            ))}
                                        </div>
                                    )}

                                    {/* RENDER ACTION BUTTON (Nếu có) */}
                                    {msg.type === 'bot' && msg.action && msg.action.type === 'navigate' && (
                                        <div className="mt-2 ml-10 animate-in fade-in slide-in-from-bottom-2">
                                            <button
                                                onClick={() => handleActionClick(msg.action)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm group"
                                            >
                                                {msg.action.payload.label || "Xem chi tiết"}
                                                <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex justify-start w-full">
                                    <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shrink-0 mr-2 shadow-sm">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                        <Loader2 className="animate-spin text-blue-600" size={16} />
                                        <span className="text-xs text-gray-500 font-medium">Đang xử lý...</span>
                                    </div>
                                </div>
                            )}

                            {/* Gợi ý chức năng */}
                            {messages.length === 1 && !isLoading && (
                                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Gợi ý cho bạn</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {getSuggestions(user?.vaitro).map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSuggestionClick(item.action)}
                                                className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all gap-2 shadow-sm group active:scale-95"
                                            >
                                                <div className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    <item.icon size={18} />
                                                </div>
                                                <span className="text-xs font-medium text-center line-clamp-1">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-inner"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Nhập câu hỏi của bạn..."
                                    className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-700 placeholder-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                                >
                                    <Send size={16} className={input.trim() ? 'ml-0.5' : ''} />
                                </button>
                            </form>
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                Powered by Gemini AI. Thông tin chỉ mang tính tham khảo.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 ${
                    isOpen
                    ? 'bg-gray-100 text-gray-600 rotate-90 border border-gray-200'
                    : 'bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/50'
                }`}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={32} fill="currentColor" className="opacity-90" />}
            </motion.button>
        </div>
    );
}