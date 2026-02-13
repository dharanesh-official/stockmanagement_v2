'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Filter, Calendar, Search, Tag, DollarSign } from 'lucide-react';
import { api, Order } from '@/services/api';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [selectedType]);

    async function fetchOrders() {
        try {
            setLoading(true);
            let endpoint = '/orders?';
            if (selectedType) endpoint += `type=${selectedType}&`;

            const data = await api.get<Order[]>(endpoint);
            setOrders(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }

    function getTypeColor(type: string) {
        const colors: Record<string, string> = {
            ORDER: 'bg-blue-100 text-blue-700 border-blue-200',
            SALES: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            CREDIT_NOTE: 'bg-rose-100 text-rose-700 border-rose-200',
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
    }

    const filteredOrders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && orders.length === 0) {
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
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Order Transactions</h2>
                    <p className="text-gray-500 mt-1">History of orders, sales receipts, and returns.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl mb-6 border border-rose-100">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Order # or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white font-medium text-gray-700"
                    >
                        <option value="">All Transaction Types</option>
                        <option value="ORDER">Pre-Order</option>
                        <option value="SALES">Direct Sale</option>
                        <option value="CREDIT_NOTE">Credit Note</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-4">Transaction #</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Status / Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <ShoppingCart size={48} className="text-gray-100" />
                                            <p className="text-lg font-medium">No transactions found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Tag size={14} className="text-primary" />
                                                <code className="font-bold text-gray-900">{order.orderNumber}</code>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900">{order.customer?.fullName || 'Walk-in'}</div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                {order.salesPerson?.fullName ? `Agent: ${order.salesPerson.fullName}` : 'Self Registered'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getTypeColor(order.type)}`}>
                                                {order.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-black text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</div>
                                            {Number(order.discountAmount) > 0 && (
                                                <div className="text-[10px] text-rose-500 font-bold">-₹{Number(order.discountAmount).toLocaleString()} Discount</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Statistics */}
            {orders.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="relative z-10">
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Cycle Volume</p>
                            <h3 className="text-4xl font-black">{orders.length}</h3>
                            <div className="mt-4 flex items-center gap-1 text-[10px] bg-white/10 w-fit px-2 py-1 rounded-full text-white/80">
                                <TrendingUp size={10} /> +5.4% from last period
                            </div>
                        </div>
                        <ShoppingCart size={100} className="absolute -right-4 -bottom-4 text-white/5 -rotate-12" />
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Gross Revenue</p>
                        <h3 className="text-4xl font-black text-emerald-600">
                            ₹{orders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                        <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                            <DollarSign size={10} /> Fully Realized Value
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Sales Conversion</p>
                        <h3 className="text-4xl font-black text-primary">
                            {((orders.filter(o => o.type === 'SALES').length / orders.length) * 100).toFixed(0)}%
                        </h3>
                        <div className="mt-4 flex items-center gap-1 text-[10px] text-primary font-bold">
                            Ratio of Orders to Final Sales
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TrendingUp({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
    );
}
