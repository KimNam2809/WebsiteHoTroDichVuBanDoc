'use client';

import { useState, useEffect } from 'react';
import {
    Activity, Server, Database, ShieldAlert,
    RefreshCw, Terminal, Clock
} from 'lucide-react';
import { getDashboardStatsAction, getRecentActivityAction } from '../actions';

export default function SystemMonitorPage() {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    async function loadData() {
        const [s, l] = await Promise.all([
            getDashboardStatsAction(),
            getRecentActivityAction()
        ]);
        setStats(s);
        setLogs(l || []);
        setIsLoading(false);
    }

    const metrics = [
        { label: 'API Requests', value: '2.4k/h', sub: '+12% vs last hour', icon: Activity, color: 'text-blue-500' },
        { label: 'Latency', value: '45ms', sub: 'Optimal', icon: Clock, color: 'text-green-500' },
        { label: 'Database', value: 'Healthy', sub: `${stats?.tongBanDoc || 0} connections`, icon: Database, color: 'text-purple-500' },
        { label: 'System Load', value: '24%', sub: '4 Cores Active', icon: Server, color: 'text-orange-500' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Activity className="text-red-600" size={32} />
                        Giám sát hệ thống
                    </h1>
                    <p className="text-gray-500 mt-1">Theo dõi sức khỏe máy chủ và nhật ký hoạt động.</p>
                </div>
                <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg border border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                            <m.icon className={m.color} size={24} />
                            <span className="text-xs font-mono text-gray-400">LIVE</span>
                        </div>
                        <h3 className="text-3xl font-mono font-bold">{m.value}</h3>
                        <p className="font-bold text-gray-300 text-sm mt-1">{m.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{m.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* SYSTEM LOGS (TERMINAL STYLE) */}
                <div className="lg:col-span-2 bg-gray-900 rounded-2xl shadow-lg border border-gray-800 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
                        <h3 className="font-mono font-bold text-gray-200 flex items-center gap-2">
                            <Terminal size={16} /> Server Logs
                        </h3>
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                    </div>
                    <div className="p-4 font-mono text-xs md:text-sm space-y-2 overflow-y-auto max-h-[500px]">
                        {logs.length > 0 ? (
                            logs.map((log, i) => (
                                <div key={i} className="flex gap-3 text-gray-300 border-b border-gray-800 pb-2 last:border-0">
                                    <span className="text-green-500 shrink-0">
                                        [{new Date(log.time).toLocaleTimeString('en-US', { hour12: false })}]
                                    </span>
                                    <span className={`uppercase font-bold shrink-0 w-16 ${log.type === 'loan' ? 'text-blue-400' : 'text-yellow-400'}`}>
                                        {log.type === 'loan' ? 'INFO' : 'WARN'}
                                    </span>
                                    <span className="break-all">
                                        Action: {log.content}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-600 italic">Finding logs...</div>
                        )}
                        <div className="text-gray-500 animate-pulse">_</div>
                    </div>
                </div>

                {/* ALERTS PANEL */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ShieldAlert className="text-orange-500" /> Cảnh báo gần đây
                    </h3>

                    <div className="space-y-4 flex-1">
                        {/* Mock Alerts */}
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
                            <div className="flex gap-2 font-bold mb-1 items-center">
                                <ShieldAlert size={14} /> High Latency
                            </div>
                            Detected API latency spike (200ms) on /api/v1/auth at 19:42:01.
                        </div>

                        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-100 text-sm">
                            <div className="flex gap-2 font-bold mb-1 items-center">
                                <ShieldAlert size={14} /> Authentication Failure
                            </div>
                            Failed login attempt from IP 192.168.1.105 (User: admin).
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="font-bold text-gray-700 mb-3 text-sm">Trạng thái dịch vụ</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                                <span>Core API</span>
                                <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-0.5 rounded-full">Operational</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                                <span>Database (Supabase)</span>
                                <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-0.5 rounded-full">Operational</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                                <span>Email Service</span>
                                <span className="text-yellow-600 font-bold text-xs bg-yellow-100 px-2 py-0.5 rounded-full">Degraded</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}