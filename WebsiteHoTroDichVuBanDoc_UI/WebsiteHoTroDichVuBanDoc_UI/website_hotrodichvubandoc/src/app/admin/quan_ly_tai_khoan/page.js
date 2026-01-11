'use client';

import { useState, useEffect } from 'react';
import {
    Search, User, Shield, Lock, Unlock,
    MoreVertical, Mail, Calendar, Filter, Users
} from 'lucide-react';
import { getAllUsersAction, updateUserStatusAction } from '../actions';

export default function AccountManagementPage() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, search, roleFilter]);

    async function loadUsers() {
        setIsLoading(true);
        const data = await getAllUsersAction();
        setUsers(data || []);
        setIsLoading(false);
    }

    function filterUsers() {
        let result = [...users];

        // Search
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(u =>
                (u.hoten && u.hoten.toLowerCase().includes(s)) ||
                (u.email && u.email.toLowerCase().includes(s)) ||
                (u.tenDangNhap && u.tenDangNhap.toLowerCase().includes(s))
            );
        }

        // Role Filter
        if (roleFilter !== 'all') {
            result = result.filter(u => u.vaitro === roleFilter);
        }

        setFilteredUsers(result);
    }

    async function handleToggleStatus(userId, currentStatus) {
        if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;

        const res = await updateUserStatusAction(userId, !currentStatus);
        if (res.success) {
            // Update Local State Optimistically
            setUsers(prev => prev.map(u =>
                u.manguoidung === userId ? { ...u, trangthai: !currentStatus } : u
            ));
        } else {
            alert(res.error || "Lỗi cập nhật trạng thái");
        }
    }

    // Colors for Roles
    const roleColors = {
        'admin': 'bg-red-100 text-red-700 border-red-200',
        'nhanVien': 'bg-blue-100 text-blue-700 border-blue-200',
        'nguoiDung': 'bg-green-100 text-green-700 border-green-200'
    };

    const roleNames = {
        'admin': 'Quản Trị Viên',
        'nhanVien': 'Nhân Viên',
        'nguoiDung': 'Bạn Đọc'
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* HERADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Users className="text-blue-600" size={32} />
                        Quản lý tài khoản
                    </h1>
                    <p className="text-gray-500 mt-1">Danh sách và phân quyền người dùng hệ thống.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        + Thêm nhân viên
                    </button>
                </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    {['all', 'admin', 'nhanVien', 'nguoiDung'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${roleFilter === role
                                    ? 'bg-gray-800 text-white shadow-nav'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {role === 'all' ? 'Tất cả' : roleNames[role]}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wider">
                                <th className="px-6 py-4 font-bold">Người dùng</th>
                                <th className="px-6 py-4 font-bold">Liên hệ</th>
                                <th className="px-6 py-4 font-bold">Vai trò</th>
                                <th className="px-6 py-4 font-bold">Ngày tạo</th>
                                <th className="px-6 py-4 font-bold">Trạng thái</th>
                                <th className="px-6 py-4 font-bold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.manguoidung} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-white shadow-sm">
                                                    {user.hoten ? user.hoten.charAt(0).toUpperCase() : user.tenDangNhap.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{user.hoten || user.tenDangNhap}</p>
                                                    <p className="text-xs text-gray-500">@{user.tenDangNhap}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-400" />
                                                {user.email || 'Chưa cập nhật'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${roleColors[user.vaitro] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {user.vaitro === 'admin' && <Shield size={12} className="mr-1" />}
                                                {roleNames[user.vaitro] || user.vaitro}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                            {user.ngaytao ? new Date(user.ngaytao).toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.trangthai
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${user.trangthai ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                                {user.trangthai ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleToggleStatus(user.manguoidung, user.trangthai)}
                                                    className={`p-2 rounded-lg transition-all ${user.trangthai
                                                            ? 'text-red-500 hover:bg-red-50 hover:text-red-700'
                                                            : 'text-green-500 hover:bg-green-50 hover:text-green-700'
                                                        }`}
                                                    title={user.trangthai ? "Khóa tài khoản" : "Mở khóa"}
                                                >
                                                    {user.trangthai ? <Lock size={18} /> : <Unlock size={18} />}
                                                </button>
                                                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg hover:text-gray-700">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                        Không tìm thấy người dùng nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}