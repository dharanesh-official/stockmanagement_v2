'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Filter } from 'lucide-react';
import { api, Order, Brand } from '@/services/api';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        fetchOrders();
        fetchBrands();
    }, [selectedBrand, selectedStatus]);

    async function fetchOrders() {
        try {
            setLoading(true);
            let endpoint = '/orders?';
            if (selectedBrand) endpoint += `brandId=${selectedBrand}&`;
            if (selectedStatus) endpoint += `status=${selectedStatus}&`;

            const data = await api.get<Order[]>(endpoint);
            setOrders(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }

    async function fetchBrands() {
        try {
            const data = await api.get<Brand[]>('/brands');
            setBrands(data);
        } catch (err) {
            console.error('Failed to fetch brands:', err);
        }
    }

    async function updateOrderStatus(orderId: string, newStatus: string) {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            fetchOrders();
        } catch (err: any) {
            alert(err.message || 'Failed to update order status');
        }
    }

    function getStatusColor(status: string) {
        const colors: Record<string, string> = {
            DRAFT: 'gray',
            PENDING: 'warning',
            CONFIRMED: 'info',
            PACKED: 'info',
            SHIPPED: 'info',
            DELIVERED: 'active',
            CANCELLED: 'cancelled',
            RETURNED: 'cancelled',
        };
        return colors[status] || 'gray';
    }

    if (loading && orders.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading orders...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 className="text-h2">Orders Management</h2>
                    <p className="text-sm text-gray-500">View and manage customer orders.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-danger-bg text-danger rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="form-select"
                >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                </select>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="form-select"
                >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PACKED">Packed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RETURNED">Returned</option>
                </select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Salesperson</th>
                            <th>Status</th>
                            <th>Total Amount</th>
                            <th>Discount</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <ShoppingCart size={48} color="#e5e7eb" />
                                        <p>No orders found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <code style={{ fontWeight: 'bold' }}>{order.orderNumber}</code>
                                    </td>
                                    <td>
                                        <div>
                                            <strong>{order.customer?.fullName}</strong>
                                            {order.customer?.phoneNumber && (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    {order.customer.phoneNumber}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{order.salesPerson?.fullName || '-'}</td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`status-badge status-${getStatusColor(order.status)}`}
                                            style={{
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                            }}
                                        >
                                            <option value="DRAFT">DRAFT</option>
                                            <option value="PENDING">PENDING</option>
                                            <option value="CONFIRMED">CONFIRMED</option>
                                            <option value="PACKED">PACKED</option>
                                            <option value="SHIPPED">SHIPPED</option>
                                            <option value="DELIVERED">DELIVERED</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                            <option value="RETURNED">RETURNED</option>
                                        </select>
                                    </td>
                                    <td>
                                        <strong>₹{Number(order.totalAmount).toFixed(2)}</strong>
                                    </td>
                                    <td>₹{Number(order.discountAmount).toFixed(2)}</td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn-icon" title="View Details">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Statistics */}
            {orders.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    <div className="card flex flex-col items-center justify-center p-6 text-center">
                        <div className="text-sm text-gray-500 mb-2">Total Orders</div>
                        <div className="text-h2 text-success">{orders.length}</div>
                    </div>
                    <div className="card flex flex-col items-center justify-center p-6 text-center">
                        <div className="text-sm text-gray-500 mb-2">Total Revenue</div>
                        <div className="text-h2 text-success">
                            ₹{orders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="card flex flex-col items-center justify-center p-6 text-center">
                        <div className="text-sm text-gray-500 mb-2">Pending Orders</div>
                        <div className="text-h2 text-warning">
                            {orders.filter(o => o.status === 'PENDING').length}
                        </div>
                    </div>
                    <div className="card flex flex-col items-center justify-center p-6 text-center">
                        <div className="text-sm text-gray-500 mb-2">Delivered</div>
                        <div className="text-h2 text-primary-600">
                            {orders.filter(o => o.status === 'DELIVERED').length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
