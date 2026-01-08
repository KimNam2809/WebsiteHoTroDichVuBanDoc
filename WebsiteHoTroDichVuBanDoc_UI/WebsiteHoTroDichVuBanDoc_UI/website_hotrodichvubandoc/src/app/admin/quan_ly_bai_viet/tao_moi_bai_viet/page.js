'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
    Upload, X, Check, Image as ImageIcon, Save, Loader2, Plus, ArrowLeft,
    CheckCircle, AlertTriangle, Info, AlertCircle, Tag
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { uploadImagesAction, createPostAction } from './actions';

const POST_CATEGORIES = [
    { id: 'tin-tuc', label: '📰 Tin tức chung', color: 'text-blue-600' },
    { id: 'su-kien', label: '📅 Sự kiện sắp tới', color: 'text-orange-600' },
    { id: 'hoat-dong', label: '🏃 Hoạt động thư viện', color: 'text-green-600' },
    { id: 'thong-bao', label: '📢 Thông báo', color: 'text-red-600' },
    { id: 'noi-bat', label: '⭐ Nổi bật (Slideshow)', color: 'text-yellow-500 font-bold' },
];

export default function CreatePostPage() {
    const router = useRouter();

    // --- STATE QUẢN LÝ ---
    const [title, setTitle] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // State UI
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [selectedImageNode, setSelectedImageNode] = useState(null); // Node ảnh đang chọn trong editor

    // State lưu danh sách từ khóa đã chọn
    const [selectedTags, setSelectedTags] = useState(['tin-tuc']);

    const editorRef = useRef(null);

    // --- LOGIC CHỌN DANH MỤC ---
    const toggleTag = (tagId) => {
        setSelectedTags(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(t => t !== tagId); // Bỏ chọn
            } else {
                return [...prev, tagId]; // Chọn thêm
            }
        });
    };

    // --- HELPER: TOAST NOTIFICATION ---
    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // --- 1. LOGIC EDITOR & TƯƠNG TÁC ẢNH (Nâng cao) ---

    // Kéo thả từ cột phải sang trái
    const handleDrop = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;

        try {
            // Kiểm tra format JSON để tránh lỗi cú pháp
            if (data.trim().startsWith('{')) {
                const p = JSON.parse(data);
                if (p?.url) insertImageLogic(p.url, p.caption);
            }
        } catch (err) {
            console.error("Lỗi parse dữ liệu kéo thả:", err);
        }
    };

    // Chèn ảnh vào vị trí con trỏ (Hỗ trợ History Undo)
    const insertImageLogic = (imageUrl, caption) => {
        if (!editorRef.current) return;

        const htmlToInsert = `
            <figure class="my-6 text-center">
                <img src="${imageUrl}" alt="${caption}" class="rounded-lg shadow-md max-w-full h-auto mx-auto border border-gray-200" />
                <figcaption class="mt-2 text-sm text-gray-500 italic text-center">${caption || ''}</figcaption>
            </figure>
            <p><br/></p>
        `;

        editorRef.current.focus();
        const selection = window.getSelection();

        if (selection.rangeCount > 0) {
            let range = selection.getRangeAt(0);
            if (!editorRef.current.contains(range.commonAncestorContainer)) {
                range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            range.deleteContents();
            // Dùng execCommand để trình duyệt lưu vào History (Hỗ trợ Ctrl+Z)
            document.execCommand('insertHTML', false, htmlToInsert);
        } else {
            editorRef.current.innerHTML += htmlToInsert;
        }
    };

    // Click vào ảnh để chọn (Hiển thị viền xanh)
    const handleEditorClick = (e) => {
        if (e.target.tagName === 'IMG') {
            if (selectedImageNode) selectedImageNode.style.outline = 'none';

            e.target.style.outline = '3px solid #3b82f6'; // Viền xanh
            setSelectedImageNode(e.target);
        } else {
            if (selectedImageNode) {
                selectedImageNode.style.outline = 'none';
                setSelectedImageNode(null);
            }
        }
    };

    // Nhấn Delete/Backspace để xóa ảnh đang chọn
    const handleKeyDown = (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImageNode) {
            e.preventDefault();

            const targetNode = selectedImageNode.closest('figure') || selectedImageNode;

            // Tạo vùng chọn bao trùm đối tượng
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNode(targetNode);
            selection.removeAllRanges();
            selection.addRange(range);

            // Dùng lệnh delete chuẩn của trình duyệt (Undo được)
            document.execCommand('delete');

            setSelectedImageNode(null);
        }
    };

    // --- 2. QUẢN LÝ KHO ẢNH (CỘT PHẢI) ---
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: URL.createObjectURL(file), // Blob URL xem trước
            caption: '',
            status: 'pending', // Mặc định là chưa upload
            url: null
        }));
        setUploadedImages(prev => [...prev, ...newImages]);
    };

    const handleCaptionChange = (id, text) => {
        setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, caption: text } : img));
    };

    const handleDragStart = (e, img) => {
        // Gửi JSON data qua event drag
        const data = JSON.stringify({ url: img.url || img.preview, caption: img.caption });
        e.dataTransfer.setData("text/plain", data);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

    // --- 3. XỬ LÝ ĐĂNG BÀI (BATCH UPLOAD) ---
    const handleSubmit = async () => {
        if (!title.trim()) return showToast("Vui lòng nhập tiêu đề bài viết!", "warning");
        let finalContentHTML = editorRef.current.innerHTML;
        if (!finalContentHTML.trim()) return showToast("Nội dung bài viết đang trống!", "warning");

        setIsSubmitting(true);
        setStatusMessage('Đang xử lý hình ảnh...');

        try {
            // Lọc các ảnh chưa upload (status != done)
            // Với trang Tạo mới, thường là toàn bộ ảnh đều là pending
            const imagesToUpload = uploadedImages.filter(img => img.status !== 'done');
            const urlMapping = {};
            const finalImageList = [...uploadedImages.filter(img => img.status === 'done')];

            // A. Upload Batch (Gửi 1 request duy nhất chứa nhiều ảnh)
            if (imagesToUpload.length > 0) {
                const formData = new FormData();
                imagesToUpload.forEach(img => {
                    formData.append('files', img.file);
                });

                // Gọi Server Action
                const response = await uploadImagesAction(formData);

                if (!response.success) {
                    throw new Error(response.error || "Lỗi upload ảnh.");
                }

                const results = response.data; // Mảng kết quả từ server

                // Map kết quả: Khớp tên file gốc -> Lấy URL thật
                imagesToUpload.forEach(img => {
                    const result = results.find(r => r.original_name === img.file.name);

                    if (result && result.success) {
                        urlMapping[img.preview] = result.url; // Lưu cặp Blob -> URL thật
                        finalImageList.push({
                            ...img,
                            url: result.url,
                            status: 'done'
                        });
                    } else {
                        console.error(`Lỗi upload ảnh ${img.file.name}:`, result?.error);
                        showToast(`Không thể upload ảnh: ${img.file.name}`, "warning");
                    }
                });
            }

            // B. Tráo đổi link: Tìm Blob URL trong HTML -> Thay bằng URL thật
            Object.keys(urlMapping).forEach(blobUrl => {
                const realUrl = urlMapping[blobUrl];
                finalContentHTML = finalContentHTML.split(blobUrl).join(realUrl);
            });

            setStatusMessage('Đang lưu bài viết...');

            // C. Gửi dữ liệu tạo bài viết
            const payload = {
                tieude: title,
                noidung: finalContentHTML,
                trangthai: true,
                danh_sach_anh: finalImageList.map(img => ({
                    url: img.url,
                    chu_thich: img.caption
                })),
                tukhoa: selectedTags,
                ghichu: ""
            };

            const resultPost = await createPostAction(payload);

            if (!resultPost.success) {
                throw new Error(resultPost.error);
            }

            showToast("Đăng bài viết thành công!", "success");

            // Reset form sau khi thành công
            setUploadedImages([]);
            setTitle('');
            if(editorRef.current) editorRef.current.innerHTML = '';
            setTimeout(() => router.push('/admin/quan_ly_bai_viet'), 1500);

        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
            setStatusMessage('');
        }
    };

    // --- RENDER GIAO DIỆN ---
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans relative">

            {/* TOAST POPUP */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 bg-white border-l-4 
                    ${toast.type === 'success' ? 'border-green-500 text-green-700' :
                    toast.type === 'error' ? 'border-red-500 text-red-700' :
                    toast.type === 'warning' ? 'border-yellow-500 text-yellow-700' : 'border-blue-500 text-blue-700'}`}>

                    {toast.type === 'success' && <CheckCircle size={24} />}
                    {toast.type === 'error' && <AlertCircle size={24} />}
                    {toast.type === 'warning' && <AlertTriangle size={24} />}
                    {toast.type === 'info' && <Info size={24} />}

                    <p className="font-medium text-sm">{toast.message}</p>
                </div>
            )}

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/quan_ly_bai_viet" className="p-2 bg-white rounded-full border hover:bg-gray-100 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Tạo bài viết mới</h1>
                        <p className="text-sm text-gray-500">Soạn thảo và quản lý hình ảnh</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {statusMessage && <span className="text-sm text-blue-600 font-medium animate-pulse">{statusMessage}</span>}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-70 transition-all"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng bài viết'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- CỘT TRÁI: EDITOR --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề bài viết</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nhập tiêu đề bài viết..."
                            className="w-full text-xl font-bold px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition-colors placeholder:font-normal"
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[600px] overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-3 border-b border-gray-100 flex gap-2 items-center bg-gray-50/50 rounded-t-2xl">
                            <button onClick={() => document.execCommand('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold" title="In đậm">B</button>
                            <button onClick={() => document.execCommand('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700 italic" title="In nghiêng">I</button>
                            <button onClick={() => document.execCommand('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700 underline" title="Gạch chân">U</button>
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                            <span className="text-xs text-gray-400 ml-auto">Click ảnh + Delete để xóa (Hỗ trợ Ctrl+Z)</span>
                        </div>

                        {/* VÙNG SOẠN THẢO */}
                        <div
                            ref={editorRef}
                            contentEditable
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={handleEditorClick}
                            onKeyDown={handleKeyDown}
                            className="flex-1 p-8 outline-none prose prose-lg max-w-none text-gray-700 cursor-text"
                            style={{ minHeight: '400px' }}
                            placeholder="Viết nội dung ở đây..."
                        ></div>

                        <style jsx>{`
                            [contenteditable] img {
                                max-width: 100%; height: auto; display: block; margin: 0 auto;
                                cursor: pointer; transition: all 0.2s;
                            }
                            [contenteditable] img:hover { opacity: 0.9; }
                            [contenteditable] figure { margin: 1.5rem 0; }
                        `}</style>
                    </div>
                </div>

                {/* --- CỘT PHẢI: KHO ẢNH --- */}
                <div className="space-y-6">
                    {/* 1. CARD PHÂN LOẠI BÀI VIẾT */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Tag className="text-blue-600" size={20}/> Phân loại bài viết
                        </h3>
                        <div className="space-y-3">
                            {POST_CATEGORIES.map(cat => {
                                const isSelected = selectedTags.includes(cat.id);
                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => toggleTag(cat.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all select-none
                                            ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                            ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {cat.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 2. CARD KHO ẢNH */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="text-blue-600" size={20}/> Kho ảnh bài viết
                        </h3>

                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-sm text-blue-600 font-medium">Click chọn ảnh</p>
                            </div>
                            <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
                        </label>

                        <div className="mt-6 space-y-6 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                            {uploadedImages.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">Chưa có ảnh nào được chọn.</p>
                            )}

                            {uploadedImages.map((img) => (
                                <div
                                    key={img.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, img)}
                                    className="bg-gray-50 p-3 rounded-xl border border-gray-200 group transition-all cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md"
                                >
                                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-white border border-gray-100">
                                        <Image src={img.preview} alt="preview" fill className="object-cover pointer-events-none" />
                                        <div className="absolute top-2 right-2">
                                            {img.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10}/> Chờ lưu</span>}
                                            {img.status === 'done' && <CheckCircle size={16} className="text-green-600 bg-white rounded-full"/>}
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={img.caption}
                                        onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                                        placeholder="Nhập chú thích..."
                                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none bg-white"
                                    />

                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => insertImageLogic(img.preview, img.caption)}
                                            className="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <Plus size={14}/> Chèn
                                        </button>

                                        <button
                                            onClick={() => setUploadedImages(prev => prev.filter(i => i.id !== img.id))}
                                            className="p-1.5 bg-white border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                                        >
                                            <X size={16}/>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center mt-2">Kéo thả vào bài để xem trước</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}