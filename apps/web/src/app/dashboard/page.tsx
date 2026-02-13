'use client';

import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, DollarSign, BarChart3, PlusCircle } from 'lucide-react';
import { api } from '@/services/api';

interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    salesCount: number;
    lowStockItems: number;
    recentOrders: any[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        salesCount: 0,
        lowStockItems: 0,
        recentOrders: [],
    });
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        let role = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                role = payload.role;
            } catch (e) {
                console.error('Failed to parse token', e);
            }
        }
        setUserRole(role);
        fetchDashboardData(role);
    }, []);

    async function fetchDashboardData(role: string | null) {
        try {
            setLoading(true);

            // Helper to handle API failures gracefully
            const safeFetch = async (url: string) => {
                try {
                    return await api.get(url);
                } catch (e) {
                    return [];
                }
            };

            const [products, orders, customers, lowStock] = await Promise.all([
                safeFetch('/products'),
                safeFetch('/orders'),
                safeFetch('/customers'),
                safeFetch('/stock/low-stock'),
            ]);

            // Calculate stats
            const ordersArray = Array.isArray(orders) ? orders : [];
            const totalRevenue = ordersArray.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
            const salesCount = ordersArray.filter((order: any) => order.type === 'SALES').length;
            const recentOrders = ordersArray.slice(0, 5);

            setStats({
                totalProducts: Array.isArray(products) ? products.length : 0,
                totalOrders: ordersArray.length,
                totalCustomers: Array.isArray(customers) ? customers.length : 0,
                totalRevenue,
                salesCount,
                lowStockItems: Array.isArray(lowStock) ? lowStock.length : 0,
                recentOrders,
            });
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="section-header mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h2>
                    <p className="text-gray-500 mt-1">Welcome back! Here's your business summary.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Total Products</p>
                        <h3 className="text-4xl font-black mb-1">{stats.totalProducts}</h3>
                    </div>
                    <Package size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
                </div>

                <div className="card text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Total Orders</p>
                        <h3 className="text-4xl font-black mb-1">{stats.totalOrders}</h3>
                    </div>
                    <ShoppingCart size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
                </div>

                <div className="card text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Total Revenue</p>
                        <h3 className="text-4xl font-black mb-1">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                    </div>
                    <DollarSign size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
                </div>

                <div className="card text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Total Customers</p>
                        <h3 className="text-4xl font-black mb-1">{stats.totalCustomers}</h3>
                    </div>
                    <Users size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
                </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Status Breakdown */}
                <div className="lg:col-span-2 card bg-white shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-primary" />
                        Recent Transactions
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-center">Order #</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3 text-center">Type</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recentOrders.length === 0 ? (
                                    <tr><td colSpan={5} className="py-10 text-center text-gray-400">No transactions recorded</td></tr>
                                ) : (
                                    stats.recentOrders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4"><code className="text-primary font-bold">{order.orderNumber}</code></td>
                                            <td className="px-4 py-4 text-gray-900 font-medium">{order.customer?.fullName || 'Walk-in'}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${order.type === 'SALES' ? 'bg-emerald-100 text-emerald-700' :
                                                        order.type === 'CREDIT_NOTE' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {order.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-bold text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</td>
                                            <td className="px-4 py-4 text-gray-500 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Alerts & Quick Actions */}
                <div className="space-y-6">
                    <div className="card bg-rose-50 border border-rose-100 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-rose-600 text-white rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-rose-900">Critical Stock</h4>
                                <p className="text-sm text-rose-700 opacity-80">{stats.lowStockItems} items need attention</p>
                            </div>
                        </div>
                        <button className="w-full py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-200 transition-all active:scale-95" onClick={() => window.location.href = '/dashboard/stock'}>
                            Restock Now
                        </button>
                    </div>

                    <div className="card bg-gray-900 text-white p-6 shadow-xl">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                            Quick Navigation
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5" onClick={() => window.location.href = '/dashboard/orders'}>
                                <PlusCircle size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">New Order</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5" onClick={() => window.location.href = '/dashboard/customers'}>
                                <Users size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Customers</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5" onClick={() => window.location.href = '/dashboard/stock'}>
                                <TrendingUp size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Stock</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5" onClick={() => window.location.href = '/dashboard/inventory'}>
                                <Package size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Products</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
