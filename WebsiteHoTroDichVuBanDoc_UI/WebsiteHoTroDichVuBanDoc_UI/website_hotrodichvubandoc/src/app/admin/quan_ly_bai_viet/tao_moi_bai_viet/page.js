'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
    Upload, X, Image as ImageIcon, Type, Save,
    Loader2, Plus, ArrowLeft, Send, CheckCircle, AlertTriangle, Info, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { uploadImagesAction, createPostAction } from './actions';

export default function CreatePostPage() {
    // --- STATE QUẢN LÝ ---
    const [title, setTitle] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // State cho Toast Notification (Thay thế alert)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' }); // type: success | error | warning | info

    // Editor Ref
    const editorRef = useRef(null);

    // --- HÀM HIỂN THỊ THÔNG BÁO ---
    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        // Tự động tắt sau 3 giây
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // --- 1. XỬ LÝ CHỌN VÀ UPLOAD ẢNH ---
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: URL.createObjectURL(file), // Dùng link blob tạm
            caption: '',
            status: 'pending', // Mặc định là chờ
            url: null
        }));

        setUploadedImages(prev => [...prev, ...newImages]);
    };

    const handleUploadImage = async (imgId) => {
        // 1. Chuyển trạng thái sang uploading
        setUploadedImages(prev => prev.map(img =>
            img.id === imgId ? { ...img, status: 'uploading' } : img
        ));

        try {
            const imgData = uploadedImages.find(img => img.id === imgId);
            if (!imgData) return;

            // 2. Upload lên server
            const res = await uploadImageAPI(imgData.file);

            // 3. Cập nhật State với link thật
            setUploadedImages(prev => prev.map(img =>
                img.id === imgId ? { ...img, status: 'done', url: res.url } : img
            ));

            // 4. [QUAN TRỌNG] HOT-SWAP: Tự động thay thế link Blob bằng link thật trong Editor
            if (editorRef.current) {
                // Tìm tất cả thẻ img trong editor
                const imgs = editorRef.current.getElementsByTagName('img');
                for (let img of imgs) {
                    // Nếu thẻ img này đang dùng link preview cũ
                    if (img.src === imgData.preview) {
                        img.src = res.url; // Thay thế bằng link thật ngay lập tức
                        // Hiệu ứng nháy nhẹ để báo hiệu đã sync thành công
                        img.style.transition = "box-shadow 0.5s";
                        img.style.boxShadow = "0 0 0 4px #4ade80"; // Viền xanh lá
                        setTimeout(() => img.style.boxShadow = "none", 1000);
                    }
                }
            }

        } catch (error) {
            alert("Lỗi upload ảnh");
            setUploadedImages(prev => prev.map(img =>
                img.id === imgId ? { ...img, status: 'pending' } : img
            ));
        }
    };

    const handleCaptionChange = (id, text) => {
        setUploadedImages(prev => prev.map(img =>
            img.id === id ? { ...img, caption: text } : img
        ));
    };

    // --- 2. LOGIC CHÈN ẢNH (Dùng Range API) ---
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
            const div = document.createElement('div');
            div.innerHTML = htmlToInsert;
            const fragment = document.createDocumentFragment();
            while (div.firstChild) fragment.appendChild(div.firstChild);
            range.insertNode(fragment);
            range.collapse(false);
        } else {
            editorRef.current.innerHTML += htmlToInsert;
        }
    };

    // --- 3. XỬ LÝ KÉO THẢ (DRAG & DROP) ---
    const handleDragStart = (e, img) => {
        // CHO PHÉP KÉO KHI CHƯA UPLOAD: Dùng img.url nếu có, nếu không thì dùng img.preview
        const urlToUse = img.url || img.preview;

        // Dùng text/plain để tránh lỗi JSON parse
        const dragData = JSON.stringify({ url: urlToUse, caption: img.caption });
        e.dataTransfer.setData("text/plain", dragData);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleDrop = (e) => {
        e.preventDefault();

        // Lấy dữ liệu dạng text/plain
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;

        try {
            const parsedData = JSON.parse(data);
            if (parsedData && parsedData.url) {
                insertImageLogic(parsedData.url, parsedData.caption);
            }
        } catch (err) {
            console.error("Lỗi parse JSON khi thả ảnh:", err);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    // --- 4. SUBMIT ---
    const handleSubmit = async () => {
        if (!title.trim()) { showToast("Vui lòng nhập tiêu đề!", "warning"); return; }
        let finalContentHTML = editorRef.current.innerHTML;
        if (!finalContentHTML.trim()) { showToast("Nội dung trống!", "warning"); return; }

        setIsSubmitting(true);
        setStatusMessage('Đang tải ảnh lên...');

        try {
            const imagesToUpload = uploadedImages.filter(img => img.status !== 'done');
            const urlMapping = {};
            const finalImageList = [...uploadedImages.filter(img => img.status === 'done')];

            // 1. UPLOAD ẢNH (Batch)
            if (imagesToUpload.length > 0) {
                const formData = new FormData();
                imagesToUpload.forEach(img => {
                    // Chắc chắn rằng key 'files' khớp với FastAPI: files: List[UploadFile]
                    formData.append('files', img.file);
                });

                // Gọi Server Action
                const response = await uploadImagesAction(formData);

                // 👇 KIỂM TRA LỖI KỸ CÀNG ĐỂ TRÁNH CRASH
                if (!response.success || !response.data) {
                    throw new Error(response.error || "Lỗi không xác định khi upload ảnh.");
                }

                const results = response.data; // Mảng kết quả từ server

                // Map kết quả trả về
                imagesToUpload.forEach(img => {
                    // Tìm kết quả tương ứng với tên file
                    const result = results.find(r => r.original_name === img.file.name);

                    if (result && result.success) {
                        urlMapping[img.preview] = result.url;
                        finalImageList.push({
                            ...img,
                            url: result.url,
                            status: 'done'
                        });
                    } else {
                        // Nếu 1 ảnh lỗi, ta chỉ log và báo warning, không chặn toàn bộ
                        console.error(`Lỗi ảnh ${img.file.name}:`, result?.error);
                        showToast(`Không thể upload ảnh: ${img.file.name}`, "warning");
                    }
                });
            }

            // 2. REPLACE URL
            Object.keys(urlMapping).forEach(blobUrl => {
                const realUrl = urlMapping[blobUrl];
                finalContentHTML = finalContentHTML.split(blobUrl).join(realUrl);
            });

            setStatusMessage('Đang lưu bài viết...');

            // 3. TẠO BÀI VIẾT
            const payload = {
                tieude: title,
                noidung: finalContentHTML,
                trangthai: true,
                danh_sach_anh: finalImageList.map(img => ({
                    url: img.url,
                    chu_thich: img.caption
                })),
                tukhoa: [], // Demo
                ghichu: ""
            };

            const postRes = await createPostAction(payload);

            if (!postRes.success) {
                throw new Error(postRes.error);
            }

            showToast("Đăng bài viết thành công!", "success");

            // Reset
            setUploadedImages([]);
            setTitle('');
            if(editorRef.current) editorRef.current.innerHTML = '';

        } catch (error) {
            console.error(error);
            // Hiển thị lỗi ra Toast thay vì alert
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">

            {/* === TOAST NOTIFICATION COMPONENT === */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 max-w-sm
                    ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                    ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                    ${toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
                    ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
                `}>
                    {toast.type === 'success' && <CheckCircle size={24} />}
                    {toast.type === 'error' && <AlertCircle size={24} />}
                    {toast.type === 'warning' && <AlertTriangle size={24} />}
                    {toast.type === 'info' && <Info size={24} />}

                    <div className="flex-1">
                        <p className="font-medium text-sm">{toast.message}</p>
                    </div>

                    <button onClick={() => setToast({ ...toast, show: false })} className="p-1 hover:bg-black/5 rounded-full transition">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/bai_viet" className="p-2 bg-white rounded-full border hover:bg-gray-100 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Tạo bài viết mới</h1>
                        <p className="text-sm text-gray-500">Soạn thảo và quản lý hình ảnh</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng bài viết'}
                </button>
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
                            <button onClick={() => document.execCommand('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-600 font-bold" title="In đậm">B</button>
                            <button onClick={() => document.execCommand('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-600 italic" title="In nghiêng">I</button>
                            <button onClick={() => document.execCommand('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-600 underline" title="Gạch chân">U</button>
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                            <span className="text-xs text-gray-400">Kéo ảnh từ cột phải để chèn</span>
                        </div>

                        {/* VÙNG SOẠN THẢO */}
                        <div
                            ref={editorRef}
                            contentEditable
                            onDrop={handleDrop}       // Xử lý thả ảnh
                            onDragOver={handleDragOver} // Cho phép kéo qua
                            className="flex-1 p-8 outline-none prose prose-lg max-w-none text-gray-700 cursor-text"
                            style={{
                                minHeight: '400px',
                                // CSS quan trọng để ảnh không bị vỡ layout
                                '& img': { maxWidth: '100% !important', height: 'auto' }
                            }}
                            placeholder="Viết nội dung ở đây..."
                        >
                        </div>

                        {/* Style ép buộc ảnh trong contentEditable */}
                        <style jsx>{`
                            [contenteditable] img {
                                max-width: 100%;
                                height: auto;
                                display: block;
                                margin: 0 auto;
                            }
                        `}</style>
                    </div>
                </div>

                {/* --- CỘT PHẢI: KHO ẢNH --- */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="text-blue-600" size={20}/> Kho ảnh bài viết
                        </h3>

                        {/* Upload Button */}
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-sm text-blue-600 font-medium">Click để chọn nhiều ảnh</p>
                            </div>
                            <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
                        </label>

                        {/* List Images */}
                        <div className="mt-6 space-y-6 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                            {uploadedImages.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">Chưa có ảnh nào được chọn.</p>
                            )}

                            {uploadedImages.map((img) => (
                                <div
                                    key={img.id}
                                    // Bật tính năng kéo luôn cho mọi trạng thái
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, img)}
                                    className={`bg-gray-50 p-3 rounded-xl border border-gray-200 group transition-all cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md`}
                                >
                                    {/* Preview */}
                                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-gray-200 bg-white">
                                        <Image src={img.preview} alt="preview" fill className="object-cover pointer-events-none" />
                                        <div className="absolute top-2 right-2">
                                            {img.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={10}/> Chưa up</span>}
                                            {img.status === 'uploading' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Uploading</span>}
                                            {img.status === 'done' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10}/> Đã up</span>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Chú thích ảnh</label>
                                        <input
                                            type="text"
                                            value={img.caption}
                                            onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                                            placeholder="Nhập chú thích..."
                                            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none bg-white"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Nút Upload */}
                                        {img.status !== 'done' ? (
                                            <button
                                                onClick={() => handleUploadImage(img.id)}
                                                disabled={img.status === 'uploading'}
                                                className="flex-1 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors flex justify-center items-center gap-1"
                                            >
                                                {img.status === 'uploading' ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>} 
                                                Upload
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => insertImageLogic(img.url, img.caption)}
                                                className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-1 shadow-md shadow-green-200"
                                            >
                                                <Plus size={14}/> Chèn lại
                                            </button>
                                        )}

                                        {/* Nút Xóa */}
                                        <button
                                            onClick={() => setUploadedImages(prev => prev.filter(i => i.id !== img.id))}
                                            className="p-2 bg-white border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
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