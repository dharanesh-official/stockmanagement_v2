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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Dashboard Overview</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Welcome back! Here's what's happening with your inventory.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
            }}>
                {/* Total Products */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Products</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.totalProducts}</h3>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '0.75rem',
                            borderRadius: '12px',
                        }}>
                            <Package size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Orders</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.totalOrders}</h3>
                            <p style={{ opacity: 0.8, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                {stats.pendingOrders} pending
                            </p>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '0.75rem',
                            borderRadius: '12px',
                        }}>
                            <ShoppingCart size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Revenue</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                                ₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </h3>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '0.75rem',
                            borderRadius: '12px',
                        }}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Customers */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Customers</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.totalCustomers}</h3>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '0.75rem',
                            borderRadius: '12px',
                        }}>
                            <Users size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
            }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <Warehouse size={32} color="#6b7280" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>{stats.totalWarehouses}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Warehouses</div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <TrendingUp size={32} color="#6b7280" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingOrders}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pending Orders</div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <AlertTriangle size={32} color="#6b7280" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.lowStockItems}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Low Stock Alerts</div>
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
            <div style={{
                marginTop: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
            }}>
                {userRole === 'SALES_PERSON' && (
                    <button
                        className="btn-primary"
                        onClick={() => window.location.href = '/dashboard/my-shops'}
                        style={{ padding: '1rem', justifyContent: 'center' }}
                    >
                        <Store size={18} />
                        My Shops (Take Order)
                    </button>
                )}

                {userRole !== 'SALES_PERSON' && (
                    <button
                        className="btn-primary"
                        onClick={() => window.location.href = '/dashboard/inventory'}
                        style={{ padding: '1rem', justifyContent: 'center' }}
                    >
                        <Package size={18} />
                        Manage Inventory
                    </button>
                )}

                <button
                    className="btn-secondary"
                    onClick={() => window.location.href = '/dashboard/orders'}
                    style={{ padding: '1rem', justifyContent: 'center' }}
                >
                    <ShoppingCart size={18} />
                    View Orders
                </button>

                {userRole !== 'SALES_PERSON' && (
                    <>
                        <button
                            className="btn-secondary"
                            onClick={() => window.location.href = '/dashboard/stock'}
                            style={{ padding: '1rem', justifyContent: 'center' }}
                        >
                            <Warehouse size={18} />
                            Stock Management
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => window.location.href = '/dashboard/customers'}
                            style={{ padding: '1rem', justifyContent: 'center' }}
                        >
                            <Users size={18} />
                            Manage Customers
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
