'use client';

import { useState, useEffect } from 'react';
import {
    Settings, Save, RefreshCw, Layers,
    BookOpen, DollarSign, Clock, Info
} from 'lucide-react';
import { getConfigAction, saveConfigAction } from '../actions';

export default function ConfigPage() {
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        const data = await getConfigAction();
        if (data) setConfig(data);
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        const res = await saveConfigAction(config);
        setIsSaving(false);
        if (res.success) {
            alert("Đã lưu cấu hình thành công!");
        } else {
            alert("Lỗi lưu cấu hình: " + (res.error || "Unknown"));
        }
    };

    const handleChange = (section, key, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    if (isLoading) return <div className="p-10 text-center">Đang tải cấu hình...</div>;
    if (!config) return <div className="p-10 text-center text-red-500">Không thể tải cấu hình.</div>;

    const tabs = [
        { id: 'general', label: 'Thông tin chung', icon: Info },
        { id: 'loans', label: 'Luật mượn trả', icon: BookOpen },
        { id: 'fines', label: 'Quy định phạt', icon: DollarSign },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">

            {/* HERADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Settings className="text-blue-600" size={32} />
                        Cấu hình hệ thống
                    </h1>
                    <p className="text-gray-500 mt-1">Thiết lập các tham số vận hành cho thư viện.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 ${isActive
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* CONTENT */}
            <div className="bg-white p-8 rounded-b-2xl rounded-tr-2xl shadow-sm border border-gray-100">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tên thư viện</label>
                            <input
                                type="text"
                                value={config.general.libraryName || ''}
                                onChange={(e) => handleChange('general', 'libraryName', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email liên hệ</label>
                            <input
                                type="text"
                                value={config.general.emailContact || ''}
                                onChange={(e) => handleChange('general', 'emailContact', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Giờ mở cửa</label>
                            <input
                                type="text"
                                value={config.general.workingHours || ''}
                                onChange={(e) => handleChange('general', 'workingHours', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>
                    </div>
                )}

                {/* LOANS TAB */}
                {activeTab === 'loans' && (
                    <div className="space-y-8 max-w-3xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Số sách tối đa / BanDoc</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={config.loans.maxBooksPerUser}
                                        onChange={(e) => handleChange('loans', 'maxBooksPerUser', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold font-mono text-lg"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">cuốn</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Giới hạn số lượng tài liệu được mượn cùng lúc.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Thời hạn mượn</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={config.loans.loanDurationDays}
                                        onChange={(e) => handleChange('loans', 'loanDurationDays', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold font-mono text-lg"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">ngày</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Số ngày mặc định cho mỗi lượt mượn.</p>
                            </div>
                        </div>

                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <Clock size={18} /> Gia hạn sách
                            </h3>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.loans.allowRenewal}
                                        onChange={(e) => handleChange('loans', 'allowRenewal', e.target.checked)}
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-700">Cho phép gia hạn</span>
                                </label>

                                {config.loans.allowRenewal && (
                                    <div className="flex items-center gap-2 ml-8">
                                        <span className="text-sm font-medium text-gray-700">Thêm:</span>
                                        <input
                                            type="number"
                                            value={config.loans.renewalDays}
                                            onChange={(e) => handleChange('loans', 'renewalDays', parseInt(e.target.value))}
                                            className="w-20 px-2 py-1 bg-white border border-blue-200 rounded-lg text-center font-bold"
                                        />
                                        <span className="text-sm font-medium text-gray-700">ngày</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* FINES TAB */}
                {activeTab === 'fines' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                            <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                <DollarSign size={18} /> Phạt quá hạn
                            </h3>

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Số tiền phạt / ngày / sách</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={config.fines.overdueFinePerDay}
                                            onChange={(e) => handleChange('fines', 'overdueFinePerDay', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold font-mono text-lg text-red-600"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">VNĐ</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Hệ số phạt mất sách</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.fines.lostBookMultiplier}
                                    onChange={(e) => handleChange('fines', 'lostBookMultiplier', parseFloat(e.target.value))}
                                    className="w-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center"
                                />
                                <span className="text-gray-600 font-medium">x (Giá bìa sách)</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Ví dụ: 2.0 nghĩa là phạt gấp đôi giá bìa.</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}