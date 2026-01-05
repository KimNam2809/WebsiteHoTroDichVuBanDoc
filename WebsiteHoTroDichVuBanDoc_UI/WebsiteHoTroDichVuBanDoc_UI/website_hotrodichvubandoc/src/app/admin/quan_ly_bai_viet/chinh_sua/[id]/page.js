'use client';

import { useState, useRef, useEffect, use } from 'react';
import Image from 'next/image';
import {
    Upload, X, Image as ImageIcon, Save, Loader2, Plus, ArrowLeft,
    CheckCircle, AlertTriangle, Info, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getPostDetailAction, updatePostAction, uploadImagesAction } from './actions';

export default function EditPostPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    // --- STATE QUẢN LÝ ---
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [title, setTitle] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    // State riêng cho Editor
    const [initialContent, setInitialContent] = useState(''); // Lưu nội dung thô khi mới load
    const [selectedImageNode, setSelectedImageNode] = useState(null); // Quản lý ảnh đang được chọn

    const editorRef = useRef(null);

    // --- HELPER: TOAST NOTIFICATION ---
    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // --- 1. LOAD DỮ LIỆU TỪ SERVER ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingData(true);
            const post = await getPostDetailAction(id);

            if (!post) {
                showToast("Không tìm thấy bài viết hoặc bài viết đã bị xóa!", "error");
                setTimeout(() => router.push('/admin/quan_ly_bai_viet'), 2000);
                return;
            }

            setTitle(post.tieude);

            // Lưu nội dung vào state tạm, chờ Editor render xong mới điền
            setInitialContent(post.noidung || '');

            // Tái tạo danh sách ảnh từ DB (JSONB)
            if (post.anhdaidien) {
                const imagesFromDB = Object.values(post.anhdaidien).map((url) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    file: null,
                    preview: url,
                    url: url,
                    caption: '',
                    status: 'done' // Đánh dấu đã có trên server
                }));
                setUploadedImages(imagesFromDB);
            }
            setIsLoadingData(false);
        };

        loadData();
    }, [id, router]);

    // --- EFFECT: ĐIỀN DỮ LIỆU VÀO EDITOR (Fix lỗi F5 mất nội dung) ---
    useEffect(() => {
        // Chỉ chạy khi Loading tắt và Editor đã xuất hiện trong DOM
        if (!isLoadingData && editorRef.current && initialContent) {
            // Chỉ điền nếu editor đang rỗng
            if (editorRef.current.innerHTML.trim() === "") {
                editorRef.current.innerHTML = initialContent;
            }
        }
    }, [isLoadingData, initialContent]);


    // --- 2. LOGIC EDITOR & THAO TÁC ẢNH (Fix Ctrl+Z và Xóa ảnh) ---

    // Kéo thả ảnh vào Editor
    const handleDrop = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;

        try {
            // Kiểm tra format JSON trước khi parse để tránh lỗi SyntaxError
            if (data.trim().startsWith('{')) {
                const p = JSON.parse(data);
                if (p?.url) insertImageLogic(p.url, p.caption);
            }
        } catch (err) {
            console.error("Lỗi parse dữ liệu kéo thả:", err);
        }
    };

    // Chèn ảnh vào vị trí con trỏ
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
            // Đảm bảo range nằm trong editor
            if (!editorRef.current.contains(range.commonAncestorContainer)) {
                range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            range.deleteContents();
            // Dùng execCommand để trình duyệt lưu vào History (Hỗ trợ Undo/Ctrl+Z)
            document.execCommand('insertHTML', false, htmlToInsert);
        } else {
             // Fallback chèn cuối
            editorRef.current.innerHTML += htmlToInsert;
        }
    };

    // Click vào ảnh để chọn (Select)
    const handleEditorClick = (e) => {
        if (e.target.tagName === 'IMG') {
            // Bỏ chọn ảnh cũ
            if (selectedImageNode) selectedImageNode.style.outline = 'none';
            // Chọn ảnh mới (Viền xanh)
            e.target.style.outline = '3px solid #3b82f6';
            setSelectedImageNode(e.target);
        } else {
            // Click ra ngoài thì bỏ chọn
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

            // Tìm thẻ cha <figure> để xóa cả cụm (ảnh + chú thích)
            const targetNode = selectedImageNode.closest('figure') || selectedImageNode;

            // Tạo vùng chọn bao trùm đối tượng cần xóa
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNode(targetNode);
            selection.removeAllRanges();
            selection.addRange(range);

            // Dùng lệnh delete của trình duyệt để hỗ trợ Undo
            document.execCommand('delete');

            setSelectedImageNode(null);
        }
    };

    // --- 3. QUẢN LÝ KHO ẢNH BÊN PHẢI ---
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: URL.createObjectURL(file), // Blob URL
            caption: '',
            status: 'pending', // Chờ upload
            url: null
        }));
        setUploadedImages(prev => [...prev, ...newImages]);
    };

    const handleCaptionChange = (id, text) => {
        setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, caption: text } : img));
    };

    const handleDragStart = (e, img) => {
        // Gửi dữ liệu ảnh qua drag event (Ưu tiên URL thật nếu có, không thì Blob)
        const data = JSON.stringify({ url: img.url || img.preview, caption: img.caption });
        e.dataTransfer.setData("text/plain", data);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

    // --- 4. XỬ LÝ LƯU CẬP NHẬT (SUBMIT) ---
    const handleUpdate = async () => {
        if (!title.trim()) return showToast("Vui lòng nhập tiêu đề!", "warning");
        let finalContentHTML = editorRef.current.innerHTML;
        if (!finalContentHTML.trim()) return showToast("Nội dung trống!", "warning");

        setIsSubmitting(true);
        setStatusMessage('Kiểm tra và upload ảnh mới...');

        try {
            // Lọc các ảnh mới chưa upload (status != done)
            const imagesToUpload = uploadedImages.filter(img => img.status !== 'done');
            const urlMapping = {};
            // Danh sách cuối cùng gồm cả ảnh cũ và ảnh mới sau khi upload
            const finalImageList = [...uploadedImages.filter(img => img.status === 'done')];

            // A. Upload Batch (Nếu có ảnh mới)
            if (imagesToUpload.length > 0) {
                const formData = new FormData();
                imagesToUpload.forEach(img => formData.append('files', img.file));

                const response = await uploadImagesAction(formData);
                if (!response.success) throw new Error(response.error);

                const results = response.data;

                // Map kết quả trả về từ server
                imagesToUpload.forEach(img => {
                    const result = results.find(r => r.original_name === img.file.name);
                    if (result?.success) {
                        urlMapping[img.preview] = result.url; // Map Blob -> Real URL
                        finalImageList.push({ ...img, url: result.url, status: 'done' });
                    } else {
                        console.error(`Lỗi upload ảnh ${img.file.name}`);
                    }
                });
            }

            // B. Tráo đổi link (Blob -> Real URL) trong nội dung HTML
            Object.keys(urlMapping).forEach(blobUrl => {
                const realUrl = urlMapping[blobUrl];
                finalContentHTML = finalContentHTML.split(blobUrl).join(realUrl);
            });

            setStatusMessage('Đang lưu cập nhật...');

            // C. Gửi dữ liệu Update
            const payload = {
                tieude: title,
                noidung: finalContentHTML,
                trangthai: true, // Hoặc lấy từ UI switch
                danh_sach_anh: finalImageList.map(img => ({
                    url: img.url,
                    chu_thich: img.caption
                })),
                ghichu: `Cập nhật lúc ${new Date().toLocaleString()}`
            };

            const res = await updatePostAction(id, payload);
            if (!res.success) throw new Error(res.error);

            showToast("Cập nhật bài viết thành công!", "success");

            // Đồng bộ lại state ảnh
            setUploadedImages(finalImageList);

        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
            setStatusMessage('');
        }
    };

    // --- RENDER LOADING ---
    if (isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3 text-blue-600">
                    <Loader2 size={40} className="animate-spin" />
                    <p className="font-medium">Đang tải dữ liệu bài viết...</p>
                </div>
            </div>
        );
    }

    // --- RENDER GIAO DIỆN CHÍNH ---
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
                        <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa bài viết</h1>
                        <p className="text-sm text-gray-500">Mã bài viết: #{id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {statusMessage && <span className="text-sm text-blue-600 font-medium animate-pulse">{statusMessage}</span>}
                    <button onClick={handleUpdate} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-70 transition-all">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {isSubmitting ? 'Lưu thay đổi' : 'Cập nhật'}
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- CỘT TRÁI: EDITOR --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-xl font-bold px-4 py-3 border-b-2 border-gray-200 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Tiêu đề bài viết..."
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[600px] overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-3 border-b border-gray-100 flex gap-2 items-center bg-gray-50/50 rounded-t-2xl">
                            <button onClick={() => document.execCommand('bold')} className="p-2 font-bold hover:bg-gray-200 rounded text-gray-700" title="In đậm">B</button>
                            <button onClick={() => document.execCommand('italic')} className="p-2 italic hover:bg-gray-200 rounded text-gray-700" title="In nghiêng">I</button>
                            <button onClick={() => document.execCommand('underline')} className="p-2 underline hover:bg-gray-200 rounded text-gray-700" title="Gạch chân">U</button>
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                            <span className="text-xs text-gray-400 ml-auto">Click ảnh để chọn, nhấn Delete để xóa (Có thể sử dụng tổ hợp &quot;CTRL + Z&quot; để hoàn tác)</span>
                        </div>

                        {/* Vùng soạn thảo */}
                        <div
                            ref={editorRef}
                            contentEditable
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={handleEditorClick}
                            onKeyDown={handleKeyDown}
                            className="flex-1 p-8 outline-none prose prose-lg max-w-none text-gray-700 cursor-text"
                            style={{ minHeight: '400px' }}
                            placeholder="Nội dung bài viết..."
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
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="text-blue-600" size={20}/> Kho ảnh
                        </h3>

                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-sm text-blue-600 font-medium">Click chọn ảnh mới</p>
                            </div>
                            <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
                        </label>

                        <div className="mt-6 space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {uploadedImages.map((img) => (
                                <div key={img.id} draggable={true} onDragStart={(e) => handleDragStart(e, img)} className="bg-gray-50 p-3 rounded-xl border border-gray-200 group hover:shadow-md cursor-grab active:cursor-grabbing transition-all">
                                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-white border border-gray-100">
                                        <Image src={img.preview} alt="preview" fill className="object-cover pointer-events-none" />
                                        <div className="absolute top-2 right-2">
                                            {img.status === 'done'
                                                ? <CheckCircle size={16} className="text-green-600 bg-white rounded-full"/>
                                                : <AlertTriangle size={16} className="text-yellow-500 bg-white rounded-full"/>
                                            }
                                        </div>
                                    </div>
                                    <input type="text" value={img.caption} onChange={(e) => handleCaptionChange(img.id, e.target.value)} placeholder="Chú thích..." className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none bg-white" />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => insertImageLogic(img.preview, img.caption)} className="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 shadow-sm">
                                            <Plus size={14}/> Chèn
                                        </button>
                                        <button onClick={() => setUploadedImages(prev => prev.filter(i => i.id !== img.id))} className="p-1.5 bg-white border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors">
                                            <X size={16}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}