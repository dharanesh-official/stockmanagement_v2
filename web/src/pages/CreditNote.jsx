import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Search,
    Filter,
    CreditCard,
    CheckCircle,
    Clock,
    AlertCircle,
    MoreHorizontal,
    X,
    FileText,
    TrendingUp,
    IndianRupee,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CreditNote.css';

const CreditNote = ({ user }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [paymentModal, setPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/sales');
            // Filter only orders
            const orderList = res.data.filter(t => t.type === 'order');
            setOrders(orderList);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount || isNaN(paymentAmount)) return;

        try {
            await api.put(`/sales/payment/${selectedOrder.id}`, {
                amountPaid: parseFloat(paymentAmount)
            });
            setPaymentModal(false);
            setPaymentAmount('');
            setSelectedOrder(null);
            fetchOrders();
            alert('Payment updated successfully');
        } catch (err) {
            alert('Failed to update payment');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Payment Completed':
                return { bg: '#dcfce7', color: '#10b981', icon: <CheckCircle size={14} /> };
            case 'Partially Paid':
                return { bg: '#fef9c3', color: '#a16207', icon: <TrendingUp size={14} /> };
            default:
                return { bg: '#f1f5f9', color: '#64748b', icon: <Clock size={14} /> };
        }
    };

    const filteredOrders = orders.filter(o =>
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.includes(search)
    );

    if (loading) return <div className="loading-state">Loading Credit Module...</div>;

    return (
        <div className="credit-page">
            <header className="page-header">
                <div>
                    <h1>Credit Note Module</h1>
                    <p className="subtitle">Manage shop payments, track partially paid invoices, and settle balances.</p>
                </div>
            </header>

            <div className="credit-summary">
                <div className="summary-card">
                    <label>Total Orders</label>
                    <h3>{orders.length}</h3>
                </div>
                <div className="summary-card">
                    <label>Total Outstanding</label>
                    <h3 className="text-red-600">₹{orders.reduce((sum, o) => sum + (Number(o.total_amount) - Number(o.paid_amount)), 0).toLocaleString('en-IN')}</h3>
                </div>
                <div className="summary-card">
                    <label>Collection Rate</label>
                    <h3 className="text-emerald-600">
                        {((orders.reduce((sum, o) => sum + Number(o.paid_amount), 0) / orders.reduce((sum, o) => sum + Number(o.total_amount), 0)) * 100 || 0).toFixed(1)}%
                    </h3>
                </div>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <Search size={18} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Search by Customer, Shop or Order ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="credit-table">
                    <thead>
                        <tr>
                            <th>ORDER ID</th>
                            <th>SHOP / CUSTOMER</th>
                            <th>TOTAL AMOUNT</th>
                            <th>PAID AMOUNT</th>
                            <th>DUE BALANCE</th>
                            <th>INVOICE STATUS</th>
                            <th className="text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="7" className="empty-cell">No matching orders found.</td></tr>
                        ) : filteredOrders.map(order => {
                            const styles = getStatusStyles(order.status);
                            const balance = Number(order.total_amount) - Number(order.paid_amount);
                            return (
                                <tr key={order.id}>
                                    <td className="id-cell">ORD-{order.id.slice(0, 8).toUpperCase()}</td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800">{order.shop_name}</span>
                                            <span className="text-xs text-gray-400">{order.customer_name}</span>
                                        </div>
                                    </td>
                                    <td className="font-bold">₹{Number(order.total_amount).toLocaleString('en-IN')}</td>
                                    <td className="text-emerald-600 font-bold">₹{Number(order.paid_amount).toLocaleString('en-IN')}</td>
                                    <td className="text-red-600 font-black">₹{balance.toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className="status-chip" style={{ backgroundColor: styles.bg, color: styles.color }}>
                                            {styles.icon}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                className="btn-pay-sm"
                                                title="Update Payment"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setPaymentModal(true);
                                                }}
                                            >
                                                <CreditCard size={14} /> Pay
                                            </button>
                                            <button
                                                className="icon-btn-sm"
                                                title="View Invoice"
                                                onClick={() => navigate(`/dashboard/invoice/${order.id}`)}
                                            >
                                                <FileText size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {paymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content credit-modal">
                        <div className="modal-header">
                            <h2>Record Payment Entry</h2>
                            <button className="close-btn" onClick={() => setPaymentModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdatePayment}>
                            <div className="order-context">
                                <div className="context-item">
                                    <label>ORDER TOTAL</label>
                                    <span>₹{Number(selectedOrder?.total_amount).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="context-item highlight">
                                    <label>REMAINING DUE</label>
                                    <span>₹{(Number(selectedOrder?.total_amount) - Number(selectedOrder?.paid_amount)).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="amount-input-box">
                                <IndianRupee size={24} color="#10b981" />
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={Number(selectedOrder?.total_amount) - Number(selectedOrder?.paid_amount)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="quick-actions">
                                <button
                                    type="button"
                                    className="btn-link"
                                    onClick={() => setPaymentAmount((Number(selectedOrder?.total_amount) - Number(selectedOrder?.paid_amount)).toString())}
                                >
                                    Settling Full Payment?
                                </button>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Update Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditNote;
