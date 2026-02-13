'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Filter, TrendingUp, TrendingDown, DollarSign, Package, ShoppingBag, BarChart3 } from 'lucide-react';
import { api, Product, Order } from '@/services/api';

export default function ReportsPage() {
    const [stats, setStats] = useState({
        inventoryValue: 0,
        monthlyRevenue: 0,
        unitsSold: 0,
        averageOrderValue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, []);

    async function fetchReportData() {
        try {
            setLoading(true);
            const [products, orders] = await Promise.all([
                api.get<Product[]>('/products'),
                api.get<Order[]>('/orders')
            ]);

            // Calculate Inventory Value
            const inventoryValue = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.basePrice)), 0);

            // Calculate Monthly Revenue (current month)
            const now = new Date();
            const currentMonthOrders = orders.filter(o => {
                const date = new Date(o.createdAt);
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            });

            const monthlyRevenue = currentMonthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

            // Units Sold
            const unitsSold = orders.filter(o => o.type === 'SALES').length; // Just a mock for now, ideally sum of item quantities

            setStats({
                inventoryValue,
                monthlyRevenue,
                unitsSold,
                averageOrderValue: orders.length > 0 ? (orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length) : 0
            });
        } catch (error) {
            console.error('Failed to fetch report data:', error);
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Reports</h2>
                    <p className="text-gray-500 mt-1">Real-time business performance analytics.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all font-semibold text-gray-700">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all font-semibold">
                        <Download size={16} />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                            <TrendingUp size={12} /> +12%
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">₹{stats.inventoryValue.toLocaleString()}</div>
                    <div className="text-gray-500 text-sm font-medium mt-1">Total Assets Value</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-blue-500 text-xs font-bold flex items-center gap-1">
                            <TrendingUp size={12} /> +8%
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">₹{stats.monthlyRevenue.toLocaleString()}</div>
                    <div className="text-gray-500 text-sm font-medium mt-1">Monthly Revenue</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <ShoppingBag size={24} />
                        </div>
                        <span className="text-rose-500 text-xs font-bold flex items-center gap-1">
                            <TrendingDown size={12} /> -2%
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{stats.unitsSold}</div>
                    <div className="text-gray-500 text-sm font-medium mt-1">Successful Sales</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Package size={24} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-gray-900">₹{stats.averageOrderValue.toFixed(0)}</div>
                    <div className="text-gray-500 text-sm font-medium mt-1">Avg. Order Value</div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Revenue Comparison</h3>
                </div>
                <div className="p-20 text-center">
                    <BarChart3 size={64} className="mx-auto text-gray-100 mb-4" />
                    <h4 className="text-gray-400 font-bold uppercase tracking-widest text-sm">Visual Analytics Coming Soon</h4>
                    <p className="text-gray-400 text-sm mt-2">Integrating Chart.js for detailed monthly insights.</p>
                </div>
            </div>
        </div>
    );
}
