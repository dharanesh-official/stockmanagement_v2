'use client';

import { Activity, Users, Box, Server, CheckCircle, AlertTriangle, ArrowUp, ArrowRight, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role === 'FINANCE_MANAGER') {
                    router.replace('/dashboard/finance');
                }
            } catch (e) {
                // ignore
            }
        }
    }, [router]);
    return (
        <div>
            <div className="section-header flex flex-col md:flex-row gap-4 mb-8">
                <div>
                    <h1 className="text-h2">Dashboard</h1>
                    <p className="text-gray-500">Real-time system overview and health check.</p>
                </div>
                <button className="btn btn-primary">
                    <Activity size={18} style={{ marginRight: '8px' }} />
                    Run System Diagnostics
                </button>
            </div>

            {/* KPI Stats Grid */}
            <div className="stats-grid">
                {/* Stat 1 */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <Box size={20} />
                        </div>
                    </div>
                    <div className="stat-value">0</div>
                    <div className="stat-label">Total Brands</div>
                    <div className="stat-trend trend-up">
                        --
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="stat-value">0</div>
                    <div className="stat-label">Active Users</div>
                    <div className="stat-trend trend-up">
                        --
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                            <Server size={20} />
                        </div>
                        <span className="badge badge-success">Stable</span>
                    </div>
                    <div className="stat-value">100%</div>
                    <div className="stat-label">System Health</div>
                    <div className="stat-trend" style={{ color: '#6b7280' }}>
                        <CheckCircle size={12} style={{ marginRight: '4px' }} /> All systems operational
                    </div>
                </div>

                {/* Stat 4 */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="stat-value">0</div>
                    <div className="stat-label">Inventory SKUs</div>
                    <div className="stat-trend trend-up">
                        --
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">

                {/* Main Chart Section (Left/Top) */}
                <div className="card" style={{ flex: 3 }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-h3">System Activity</h3>
                        <div className="flex gap-2">
                            <button className="btn btn-outline mobile-hidden" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>24h</button>
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>7d</button>
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>30d</button>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div style={{
                        height: '300px',
                        background: '#f9fafb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed #e5e7eb',
                        borderRadius: '8px',
                        color: '#9ca3af',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <Activity size={48} />
                        <p>No activity data available yet.</p>
                    </div>
                </div>

                {/* Right Side Panel: Uptime & Alerts */}
                <div className="flex flex-col gap-6" style={{ flex: 1 }}>
                    <div className="card">
                        <h3 className="text-h3 mb-4">Service Uptime</h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center gap-2">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
                                        API Gateway
                                    </span>
                                    <span className="font-semibold">100%</span>
                                </div>
                                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                                    <div style={{ width: '100%', height: '100%', background: '#10b981' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center gap-2">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
                                        Inventory DB
                                    </span>
                                    <span className="font-semibold">100%</span>
                                </div>
                                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                                    <div style={{ width: '100%', height: '100%', background: '#10b981' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center gap-2">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
                                        Auth Service
                                    </span>
                                    <span className="font-semibold">100%</span>
                                </div>
                                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                                    <div style={{ width: '100%', height: '100%', background: '#10b981' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Recent Audit Logs Table */}
            <div className="card mt-6" style={{ marginTop: '2rem' }}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-h3">Recent Audit Logs</h3>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Entity</th>
                                <th>Event Type</th>
                                <th>Administrator</th>
                                <th>Timestamp</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No recent audits found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
