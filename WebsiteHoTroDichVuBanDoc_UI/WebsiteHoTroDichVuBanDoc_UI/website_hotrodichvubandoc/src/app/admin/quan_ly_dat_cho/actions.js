// src/app/admin/quan_ly_dat_cho/actions.js
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

// Helper for Admin API calls
async function fetchAdmin(endpoint, options = {}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        cache: 'no-store',
    });
    return res;
}

// 1. Get All Seat Bookings
export async function getAllSeatBookingsAction() {
    try {
        const res = await fetchAdmin('/api/v1/dat-cho-ngoi/');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

// 2. Get All Room Bookings
export async function getAllRoomBookingsAction() {
    try {
        const res = await fetchAdmin('/api/v1/dat-phong/');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

// 3. Cancel Seat Booking
export async function cancelSeatBookingAction(maDatCho) {
    try {
        const res = await fetchAdmin(`/api/v1/dat-cho-ngoi/${maDatCho}`, {
            method: 'PUT',
            body: JSON.stringify({ trangThaiDatCho: 'daHuy' })
        });
        if (res.ok) {
            revalidatePath('/admin/quan_ly_dat_cho');
            return { success: true };
        }
        const err = await res.json();
        return { error: err.detail || 'Lỗi hủy đặt chỗ' };
    } catch (e) {
        return { error: e.message };
    }
}

// 4. Check-in Seat Booking
export async function checkInSeatBookingAction(maDatCho, staffId) {
    try {
        const res = await fetchAdmin(`/api/v1/dat-cho-ngoi/${maDatCho}/check-in`, {
            method: 'POST',
            body: JSON.stringify({ maNhanVien: staffId })
        });
        if (res.ok) {
            revalidatePath('/admin/quan_ly_dat_cho');
            return { success: true };
        }
        const err = await res.json();
        return { error: err.detail || 'Lỗi check-in' };
    } catch (e) {
        return { error: e.message };
    }
}

// 5. Approve Room Booking
export async function approveRoomBookingAction(maDatPhong, staffId) {
    try {
        const res = await fetchAdmin(`/api/v1/dat-phong/${maDatPhong}/duyet`, {
            method: 'POST',
            body: JSON.stringify({ maNhanVien: staffId })
        });
        if (res.ok) {
            revalidatePath('/admin/quan_ly_dat_cho');
            return { success: true };
        }
        const err = await res.json();
        return { error: err.detail || 'Lỗi duyệt phòng' };
    } catch (e) {
        return { error: e.message };
    }
}

// 6. Cancel Room Booking
export async function cancelRoomBookingAction(maDatPhong) {
    try {
        // For Room, we use PUT to update status
        // Check dat_phong_api.py: update_dat_phong accepts DatPhongUpdate
        const res = await fetchAdmin(`/api/v1/dat-phong/${maDatPhong}`, {
            method: 'PUT',
            body: JSON.stringify({ trangThai: 'daHuy' }) // Be careful with exact field name 'trangThai' from Update model
        });
        if (res.ok) {
            revalidatePath('/admin/quan_ly_dat_cho');
            return { success: true };
        }
        const err = await res.json();
        return { error: err.detail || 'Lỗi hủy đặt phòng' };
    } catch (e) {
        return { error: e.message };
    }
}

// 7. Get Current Staff Profile (To get ID for actions)
export async function getCurrentStaffProfileAction() {
    try {
        const res = await fetchAdmin('/api/v1/nhan-vien/profile'); // Assuming endpoint exists or we use auth/profile
        // Wait, 'nhan_vien_api.py' doesn't normally have /profile. 
        // We usually use `auth_api.py` /api/v1/auth/me or similar, checking `current_user`
        // But let's try generic /api/v1/nguoi-dung/profile which returns mixed info
        // and extract staff ID.
        const res2 = await fetchAdmin('/api/v1/nguoi-dung/profile');
        if (res2.ok) return await res2.json();
        return null;
    } catch (e) {
        return null;
    }
}
