import { ShoppingCart, Filter, Download, MoreHorizontal } from 'lucide-react';

export default function OrdersPage() {
    const orders: any[] = []; // Data cleared

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Order Management</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>View and manage customer orders.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="action-btn" style={{ border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                        <Filter size={16} />
                    </button>
                    <button className="btn-primary">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{order.id}</td>
                                    <td>{order.customer}</td>
                                    <td style={{ color: '#6b7280' }}>{order.date}</td>
                                    <td>
                                        <span className={`status-badge ${order.status === 'Delivered' ? 'status-active' :
                                                order.status === 'Shipped' ? 'status-active' :
                                                    order.status === 'Processing' ? 'status-warning' : 'status-pending'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{order.items}</td>
                                    <td style={{ fontWeight: 500 }}>{order.amount}</td>
                                    <td><button className="action-btn"><MoreHorizontal size={16} /></button></td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
