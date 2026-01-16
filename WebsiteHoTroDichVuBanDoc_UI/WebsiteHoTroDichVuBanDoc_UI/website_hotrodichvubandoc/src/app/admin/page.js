'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Activity, Users, BookOpen, AlertTriangle,
    TrendingUp, Calendar, ArrowRight, BarChart3,
    FileText, Download, X, PieChart, Filter
} from 'lucide-react';
import { getDashboardStatsAction, getChartDataAction, getRecentActivityAction, getDetailedReportAction } from './actions';

export default function AdminDashboardPage() {
    // Data State
    const [statsData, setStatsData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [activities, setActivities] = useState([]);
    const [reportData, setReportData] = useState([]); // Report Data
    const [isLoading, setIsLoading] = useState(true);
    const [isReportLoading, setIsReportLoading] = useState(false);

    // Filter State
    const [chartRange, setChartRange] = useState('7d');

    // Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('borrowing');

    // 1. Fetch Dashboard Data
    useEffect(() => {
        async function load() {
            try {
                const [stats, chart, acts] = await Promise.all([
                    getDashboardStatsAction(),
                    getChartDataAction(chartRange),
                    getRecentActivityAction()
                ]);

                setStatsData(stats);
                setChartData(chart || []);
                setActivities(acts || []);
            } catch (error) {
                console.error("Dashboard Load Error", error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [chartRange]);

    // 2. Fetch Report Data when Modal Opens or Type Changes
    useEffect(() => {
        async function loadReport() {
            if (!showReportModal) {
                setReportData([]); // Clear data when modal is closed
                return;
            }
            setIsReportLoading(true);
            try {
                const data = await getDetailedReportAction(selectedReportType);
                setReportData(data || []);
            } catch (error) {
                console.error("Report Load Error", error);
                setReportData([]);
            } finally {
                setIsReportLoading(false);
            }
        }
        loadReport();
    }, [showReportModal, selectedReportType]);

    // Calculate Chart Max for Scaling
    const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 10;

    // Helper: Map API data to UI Cards
    const statsConfig = [
        {
            title: 'Hồ sơ chờ duyệt',
            value: statsData?.hoSoCho || 0,
            label: 'Cần xử lý ngay',
            icon: Users,
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
            trend: 'Thời gian thực'
        },
        {
            title: 'Sách đang mượn',
            value: statsData?.sachDangMuon || 0,
            label: 'Tài liệu lưu thông',
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            trend: 'Cập nhật liên tục'
        },
        {
            title: 'Sách quá hạn',
            value: statsData?.sachQuaHan || 0,
            label: 'Cần thu hồi',
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-100',
            trend: 'Cảnh báo'
        },
        {
            title: 'Tổng bạn đọc',
            value: statsData?.tongBanDoc || 0,
            label: 'Thành viên hệ thống',
            icon: Activity,
            color: 'text-green-600',
            bg: 'bg-green-100',
            trend: 'Tích lũy'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">

            {/* 1. HERO BANNER */}
            <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-gray-900 to-blue-900 text-white shadow-xl">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200 mb-3 border border-white/10">
                            <Calendar size={12} />
                            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">
                            Tổng quan hệ thống
                        </h1>
                        <p className="text-gray-300 max-w-xl text-lg">
                            Chào mừng quản trị viên. Dưới đây là báo cáo nhanh về tình hình hoạt động của thư viện hôm nay.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                        <FileText size={20} />
                        Xem báo cáo chi tiết
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* 2. STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsConfig.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                {stat.trend}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
                                {isLoading ? '-' : stat.value}
                            </h3>
                            <p className="font-bold text-gray-700 text-sm">{stat.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. CHARTS & RECENT ACTIVITY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* CHART */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <BarChart3 className="text-blue-600" /> Biểu đồ mượn trả
                        </h2>
                        <select
                            value={chartRange}
                            onChange={(e) => setChartRange(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="7d">7 ngày qua</option>
                            <option value="30d">Tháng này</option>
                        </select>
                    </div>

                    <div className="flex-1 min-h-[300px] flex flex-col items-center justify-end bg-linear-to-b from-white to-gray-50 p-8">
                        <div className="w-full flex items-end justify-between gap-2 h-64">
                            {chartData.length > 0 ? (
                                chartData.map((item, index) => {
                                    const heightPercent = maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center group relative">
                                            {/* Tooltip */}
                                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                                                {item.fullDate}: {item.value} lượt
                                            </div>

                                            {/* Bar */}
                                            <div
                                                className="w-full max-w-40px bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600 relative overflow-hidden"
                                                style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min height 2% visibility
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                            </div>

                                            {/* Label */}
                                            <span className="text-[10px] text-gray-400 mt-2 font-medium">{item.date}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 italic">
                                    Chưa có dữ liệu biểu đồ.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="font-bold text-gray-800 text-lg">Hoạt động mới</h2>
                    </div>
                    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[400px]">
                        {activities.length > 0 ? (
                            activities.map((act, i) => (
                                <div key={i} className="flex gap-4 items-start animate-in slide-in-from-right-2" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${act.type === 'loan' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                    <div>
                                        <p className="text-sm text-gray-800 font-medium leading-snug">
                                            {act.content}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(act.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(act.time).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 text-sm italic">Chưa có hoạt động nào.</div>
                        )}

                        {activities.length > 0 && (
                            <div className="pt-4 border-t border-gray-50">
                                <Link href="/admin/gui_thong_bao" className="block text-center py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                    Xem tất cả thông báo
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === REPORT MODAL === */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <PieChart className="text-blue-600" /> Báo cáo chi tiết
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Controls */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Loại báo cáo</label>
                                    <select
                                        value={selectedReportType}
                                        onChange={(e) => setSelectedReportType(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="borrowing">Thống kê mượn trả theo ngày</option>
                                        <option value="readers">Tăng trưởng bạn đọc</option>
                                        <option value="overdue">Danh sách quá hạn</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian</label>
                                    <select className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option>Tháng này</option>
                                        <option>Quý này</option>
                                        <option>Năm nay</option>
                                    </select>
                                </div>
                            </div>

                            {/* Preview Table (Mock Data for Report Preview based on type) */}
                            <div className="border rounded-xl overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tiêu chí</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Số liệu</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Tỷ lệ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {isReportLoading ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                        Đang tải dữ liệu...
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : reportData.length > 0 ? (
                                            reportData.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                                        {item.label}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                                        {item.value}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold ${typeof item.ratio === 'string' ? 'text-gray-600 text-xs' : 'text-blue-600'
                                                        }`}>
                                                        {typeof item.ratio === 'number' ? `${item.ratio}%` : item.ratio}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">
                                                    Không có dữ liệu cho báo cáo này.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowReportModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 font-bold text-gray-700">Đóng</button>
                            <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-blue-500/40">
                                <Download size={18} /> Xuất Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}