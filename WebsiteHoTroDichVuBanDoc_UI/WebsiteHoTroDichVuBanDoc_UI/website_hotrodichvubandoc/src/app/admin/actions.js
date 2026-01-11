'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'; // Để refresh trang sau khi duyệt

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

/**
 * Hàm Helper để gọi API Admin an toàn
 * Tự động lấy token từ cookie và thêm vào header
 */
async function fetchAdmin(endpoint, options = {}) {
    const cookieStore = await cookies(); // Next.js 15 yêu cầu await
    const token = cookieStore.get('auth_token')?.value;

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        cache: 'no-store', // Luôn lấy dữ liệu mới nhất
    });
    return res;
}

// 1. Lấy danh sách hồ sơ đang chờ duyệt
// Endpoint: GET /api/v1/yeu-cau-the/danh-sach-cho-duyet
export async function getPendingCardsAction() {
    try {
        const res = await fetchAdmin('/api/v1/yeu-cau-the/danh-sach-cho-duyet');
        if (!res.ok) {
            console.error("Lỗi lấy danh sách chờ duyệt:", res.status);
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        return [];
    }
}

// 2. Lấy chi tiết đầy đủ của một hồ sơ (bao gồm ảnh, địa chỉ, v.v.)
// Endpoint: GET /api/v1/yeu-cau-the/{id}
export async function getCardRequestDetailAction(id) {
    try {
        const res = await fetchAdmin(`/api/v1/yeu-cau-the/${id}`);
        if (!res.ok) {
            console.error(`Lỗi lấy chi tiết hồ sơ ${id}:`, res.status);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        return null;
    }
}

// 3. Duyệt hoặc Từ chối hồ sơ
// Endpoint: PUT /api/v1/yeu-cau-the/phe-duyet/{id}
export async function approveCardAction(id, status, reason = '') {
    try {
        const bodyData = {
            trang_thai: status, // 'daDuyet' hoặc 'tuChoi'
            ly_do: reason       // Lý do (bắt buộc nếu từ chối, tùy chọn nếu duyệt)
        };

        const res = await fetchAdmin(`/api/v1/yeu-cau-the/phe-duyet/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bodyData)
        });

        if (res.ok) {
            // Làm mới dữ liệu trang admin để danh sách cập nhật ngay lập tức
            revalidatePath('/admin/phe_duyet_the');
            return { success: true };
        }

        // Xử lý lỗi trả về từ backend (nếu có)
        const errText = await res.text();
        return { error: `Lỗi từ Server: ${errText}` };

    } catch (error) {
        console.error("Lỗi xử lý hồ sơ:", error);
        return { error: 'Lỗi kết nối đến máy chủ.' };
    }
}

// 4. Lấy danh sách đang mượn (để nhân viên tìm và trả)
// Endpoint: GET /api/v1/muon-tra/danh-sach-chi-tiet-muon-tra?phan_loai=dangMuon
export async function getActiveLoansAction() {
    try {
        const res = await fetchAdmin('/api/v1/muon-tra/danh-sach-chi-tiet-muon-tra?phan_loai=dangMuon');
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        return [];
    }
}

// 4.1 Lấy danh sách chờ xác nhận mượn (để nhân viên xác nhận)
// Endpoint: GET /api/v1/muon-tra/danh-sach-chi-tiet-muon-tra?phan_loai=choXacNhan
export async function getPendingBorrowAction() {
    try {
        const res = await fetchAdmin('/api/v1/muon-tra/danh-sach-chi-tiet-muon-tra?phan_loai=choXacNhan');
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Lỗi lấy danh sách chờ mượn", error);
        return [];
    }
}

// 5. Thực hiện Trả sách
// Endpoint: POST /api/v1/muon-tra/{id}/tra-sach
export async function returnBookAction(maMuonTra) {
    try {
        // B1: Lấy thông tin nhân viên hiện tại (để lấy ID nhân viên)
        // API yêu cầu body { maNhanVien: ... }
        const profileRes = await fetchAdmin('/api/v1/nguoi-dung/profile');
        if (!profileRes.ok) return { error: "Không xác định được nhân viên thực hiện." };

        const profile = await profileRes.json();

        const staffId = profile.manhanvien || 0;

        // B2: Gọi API Trả sách
        const res = await fetchAdmin(`/api/v1/muon-tra/${maMuonTra}/tra-sach`, {
            method: 'POST',
            body: JSON.stringify({
                maNhanVien: staffId,
                ghiChu: "Trả tại quầy (Admin)"
            })
        });

        if (res.ok) {
            revalidatePath('/admin/quan_ly_muon_tra');
            return { success: true };
        }

        const errText = await res.text();

        try {
            const jsonErr = JSON.parse(errText);
            return { error: jsonErr.detail || "Lỗi trả sách." };
        } catch {
            return { error: errText };
        }

    } catch (error) {
        return { error: "Lỗi kết nối hệ thống." };
    }
}

// 6. Xác nhận Mượn (Chuyển từ dangChoXacNhan -> daMuon)
// Endpoint: PUT /api/v1/muon-tra/{id}
export async function confirmBorrowAction(maMuonTra) {
    try {
        // B1: Lấy thông tin nhân viên hiện tại
        const profileRes = await fetchAdmin('/api/v1/nguoi-dung/profile');
        if (!profileRes.ok) return { error: "Không xác định được nhân viên thực hiện." };

        const profile = await profileRes.json();
        const staffId = profile.manhanvien;

        if (!staffId) return { error: "Tài khoản của bạn chưa liên kết hồ sơ nhân viên." };

        // B2: Gọi API Update
        const res = await fetchAdmin(`/api/v1/muon-tra/${maMuonTra}`, {
            method: 'PUT',
            body: JSON.stringify({
                trangThaiMuon: 'daMuon', // CamelCase để khớp với Pydantic Alias
                maNhanVien: staffId
            })
        });

        if (res.ok) {
            revalidatePath('/admin/quan_ly_muon_tra');
            return { success: true };
        }

        const errText = await res.text();
        try {
            const jsonErr = JSON.parse(errText);
            return { error: jsonErr.detail || "Lỗi xác nhận." };
        } catch {
            return { error: errText };
        }

    } catch (error) {
        return { error: "Lỗi hệ thống: " + error.message };
    }
}

// 7. DASHBOARD STATS (NEW)
export async function getDashboardStatsAction() {
    try {
        const res = await fetchAdmin('/api/v1/thong-ke/tong-quan');
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

export async function getChartDataAction(range) {
    try {
        const res = await fetchAdmin(`/api/v1/thong-ke/bieu-do?range=${range}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export async function getRecentActivityAction() {
    try {
        const res = await fetchAdmin('/api/v1/thong-ke/hoat-dong-moi?limit=5');
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}


export async function getDetailedReportAction(type = 'borrowing') {
    try {
        const res = await fetchAdmin(`/api/v1/thong-ke/bao-cao?type=${type}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

// 8. QUẢN LÝ TÀI KHOẢN
export async function getAllUsersAction() {
    try {
        const res = await fetchAdmin('/api/v1/nguoi-dung/');
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export async function updateUserStatusAction(userId, newStatus) {
    try {
        const res = await fetchAdmin(`/api/v1/nguoi-dung/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ trangThai: newStatus })
        });

        if (res.ok) {
            revalidatePath('/admin/quan_ly_tai_khoan');
            return { success: true };
        }
        return { error: "Không thể cập nhật trạng thái." };
    } catch (e) { return { error: e.message }; }
}

// 9. CẤU HÌNH HỆ THỐNG
export async function getConfigAction() {
    try {
        const res = await fetchAdmin('/api/v1/config/');
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

export async function saveConfigAction(newConfig) {
    try {
        const res = await fetchAdmin('/api/v1/config/', {
            method: 'PUT',
            body: JSON.stringify(newConfig)
        });
        if (res.ok) {
            revalidatePath('/admin/cau_hinh');
            return { success: true };
        }
        return { error: "Lỗi lưu cấu hình" };
    } catch (e) { return { error: e.message }; }
}