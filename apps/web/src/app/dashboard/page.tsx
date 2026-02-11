'use client';

import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, Warehouse, TrendingUp, AlertTriangle, DollarSign, BarChart3, Store } from 'lucide-react';
import { api } from '@/services/api';

interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalWarehouses: number;
    totalRevenue: number;
    pendingOrders: number;
    lowStockItems: number;
    recentOrders: any[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalWarehouses: 0,
        totalRevenue: 0,
        pendingOrders: 0,
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

            const isSalesPerson = role === 'SALES_PERSON';

            // Helper to handle API failures gracefully
            const safeFetch = async (url: string) => {
                try {
                    return await api.get(url);
                } catch (e) {
                    return [];
                }
            };

            // Fetch all data in parallel, skipping restricted endpoints for Salespersons
            const [products, orders, customers, warehouses, lowStock] = await Promise.all([
                safeFetch('/products'),
                safeFetch('/orders'),
                safeFetch('/customers'),
                !isSalesPerson ? safeFetch('/warehouses') : Promise.resolve([]),
                !isSalesPerson ? safeFetch('/stock/low-stock') : Promise.resolve([]),
            ]);

            // Calculate stats
            const totalRevenue = Array.isArray(orders) ? orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0) : 0;
            const pendingOrders = Array.isArray(orders) ? orders.filter((order: any) => order.status === 'PENDING').length : 0;
            const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];

            setStats({
                totalProducts: Array.isArray(products) ? products.length : 0,
                totalOrders: Array.isArray(orders) ? orders.length : 0,
                totalCustomers: Array.isArray(customers) ? customers.length : 0,
                totalWarehouses: Array.isArray(warehouses) ? warehouses.length : 0,
                totalRevenue,
                pendingOrders,
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 className="text-h2">Dashboard Overview</h2>
                    <p className="text-sm text-gray-500">Welcome back! Here's what's happening with your inventory.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Products */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold mb-2" style={{ opacity: 0.9 }}>Total Products</p>
                            <h3 className="text-h1 m-0" style={{ color: 'white' }}>{stats.totalProducts}</h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                            <Package size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: 'white' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold mb-2" style={{ opacity: 0.9 }}>Total Orders</p>
                            <h3 className="text-h1 m-0" style={{ color: 'white' }}>{stats.totalOrders}</h3>
                            <p className="text-xs mt-1" style={{ opacity: 0.8 }}>{stats.pendingOrders} pending</p>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                            <ShoppingCart size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold mb-2" style={{ opacity: 0.9 }}>Total Revenue</p>
                            <h3 className="text-h1 m-0" style={{ color: 'white' }}>₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Customers */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: 'white' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold mb-2" style={{ opacity: 0.9 }}>Total Customers</p>
                            <h3 className="text-h1 m-0" style={{ color: 'white' }}>{stats.totalCustomers}</h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                            <Users size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card flex flex-col items-center justify-center text-center p-6">
                    <Warehouse size={32} className="text-gray-500 mb-2" />
                    <div className="text-h2 text-success">{stats.totalWarehouses}</div>
                    <div className="text-sm text-gray-500">Warehouses</div>
                </div>

                <div className="card flex flex-col items-center justify-center text-center p-6">
                    <TrendingUp size={32} className="text-gray-500 mb-2" />
                    <div className="text-h2 text-warning">{stats.pendingOrders}</div>
                    <div className="text-sm text-gray-500">Pending Orders</div>
                </div>

                <div className="card flex flex-col items-center justify-center text-center p-6">
                    <AlertTriangle size={32} className="text-gray-500 mb-2" />
                    <div className="text-h2 text-danger">{stats.lowStockItems}</div>
                    <div className="text-sm text-gray-500">Low Stock Alerts</div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="card">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={20} />
                    Recent Orders
                </h3>
                {stats.recentOrders.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No recent orders</p>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map((order: any) => (
                                    <tr key={order.id}>
                                        <td><code>{order.orderNumber}</code></td>
                                        <td><strong>{order.customer?.fullName || 'N/A'}</strong></td>
                                        <td>
                                            <span className={`status-badge status-${order.status === 'DELIVERED' ? 'active' :
                                                order.status === 'PENDING' ? 'warning' :
                                                    order.status === 'CANCELLED' ? 'cancelled' : 'info'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td><strong>₹{Number(order.totalAmount).toFixed(2)}</strong></td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {userRole === 'SALES_PERSON' && (
                    <button className="btn-primary w-full" onClick={() => window.location.href = '/dashboard/my-shops'}>
                        <Store size={18} />
                        My Shops (Take Order)
                    </button>
                )}

                {userRole !== 'SALES_PERSON' && (
                    <button className="btn-primary w-full" onClick={() => window.location.href = '/dashboard/inventory'}>
                        <Package size={18} />
                        Manage Inventory
                    </button>
                )}

                <button className="btn-secondary w-full" onClick={() => window.location.href = '/dashboard/orders'}>
                    <ShoppingCart size={18} />
                    View Orders
                </button>

                {userRole !== 'SALES_PERSON' && (
                    <>
                        <button className="btn-secondary w-full" onClick={() => window.location.href = '/dashboard/stock'}>
                            <Warehouse size={18} />
                            Stock Management
                        </button>
                        <button className="btn-secondary w-full" onClick={() => window.location.href = '/dashboard/customers'}>
                            <Users size={18} />
                            Manage Customers
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
