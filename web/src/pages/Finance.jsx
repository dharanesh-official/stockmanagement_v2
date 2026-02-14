import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Search,
    CreditCard,
    ArrowDownLeft,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    History,
    IndianRupee,
    Plus,
    X,
    TrendingUp,
    FileText,
    StickyNote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Finance.css';

const Finance = ({ user }) => {
    const navigate = useNavigate();
    const [dues, setDues] = useState([]);
    const [history, setHistory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('dues');

    // Payment Modal State (General Dues)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        notes: ''
    });

    // Credit Note Modal State (Order Specific)
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Added timestamp to prevent caching
            const timestamp = Date.now();
            const [custRes, saleRes] = await Promise.all([
                api.get(`/customers?t=${timestamp}`),
                api.get(`/sales?t=${timestamp}`)
            ]);

            // For Dues Tab - Total Outstanding calculation
            const allCustomers = custRes.data;
            const sortedDues = allCustomers
                .filter(c => Number(c.balance) > 0.01) // Filter tiny dust balances
                .sort((a, b) => Number(b.balance) - Number(a.balance));

            setDues(sortedDues);

            // For History Tab
            const paymentsOnly = saleRes.data.filter(t => t.type === 'payment');
            setHistory(paymentsOnly);

            // For Credit Note Tab
            const orderList = saleRes.data.filter(t => t.type === 'order');
            setOrders(orderList);

        } catch (err) {
            console.error('Finance sync error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/sales', {
                customer_id: selectedCustomer.id,
                type: 'payment',
                amount: parseFloat(paymentData.amount),
                notes: paymentData.notes
            });
            setShowPaymentModal(false);
            setPaymentData({ amount: '', notes: '' });
            setSelectedCustomer(null);
            fetchAllData();
            alert('Payment recorded successfully!');
        } catch (err) {
            alert('Failed to record payment');
        }
    };

    const handleUpdateOrderPayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount || isNaN(paymentAmount)) return;

        try {
            await api.put(`/sales/payment/${selectedOrder.id}`, {
                amountPaid: parseFloat(paymentAmount)
            });
            setPaymentModal(false);
            setPaymentAmount('');
            setSelectedOrder(null);
            fetchAllData();
            alert('Order payment updated successfully');
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

    const canSeeTab = (tabId) => {
        if (user.role === 'admin') return true;
        return user.permissions?.finance?.[tabId] === true;
    };

    useEffect(() => {
        if (user.role !== 'admin') {
            const perms = user.permissions?.finance;
            if (perms) {
                if (perms.dues && activeTab === 'dues') return;
                if (perms.credit && activeTab === 'credit') return;
                if (perms.history && activeTab === 'history') return;

                // If currently active tab is not allowed, switch to first allowed
                if (perms.dues) setActiveTab('dues');
                else if (perms.credit) setActiveTab('credit');
                else if (perms.history) setActiveTab('history');
            }
        }
    }, [user, activeTab]);

    const totalOutstanding = dues.reduce((sum, c) => sum + Number(c.balance), 0);

    // Calculate Today's Collection
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCollection = history
        .filter(h => {
            const hDate = new Date(h.transaction_date);
            hDate.setHours(0, 0, 0, 0);
            return hDate.getTime() === today.getTime();
        })
        .reduce((sum, h) => sum + Number(h.total_amount), 0);

    const filteredDues = dues.filter(c =>
        c.full_name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredHistory = history.filter(h =>
        h.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        h.shop_name?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredOrders = orders.filter(o =>
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.includes(search)
    );

    if (loading) return <div className="loading-state">Synchronizing financial records...</div>;

    return (
        <div className="finance-page">
            <header className="page-header">
                <div>
                    <h1>Finance Hub</h1>
                    <p className="subtitle">Unified management of dues, payments, and credit notes.</p>
                </div>
            </header>

            <div className="finance-stats">
                <div className="stat-card outstanding">
                    <div className="stat-icon"><IndianRupee size={24} /></div>
                    <div className="stat-content">
                        <label>Total Outstanding</label>
                        <h3 className="text-red-500">₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
                <div className="stat-card collection">
                    <div className="stat-icon"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <label>Collection Today</label>
                        <h3 className="text-emerald-500">₹{todayCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
            </div>

            <div className="finance-container">
                <div className="finance-tabs">
                    {canSeeTab('dues') && (
                        <button
                            className={`tab ${activeTab === 'dues' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dues')}
                        >
                            <AlertCircle size={18} /> Bill Dues
                        </button>
                    )}
                    {canSeeTab('credit') && (
                        <button
                            className={`tab ${activeTab === 'credit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('credit')}
                        >
                            <StickyNote size={18} /> Credit Notes
                        </button>
                    )}
                    {canSeeTab('history') && (
                        <button
                            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <History size={18} /> Payment History
                        </button>
                    )}

                    <div className="tab-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="tab-content">
                    {activeTab === 'dues' && (
                        <div className="table-container">
                            <table className="finance-table">
                                <thead>
                                    <tr>
                                        <th>CUSTOMER</th>
                                        <th>CONTACT DETAILS</th>
                                        <th>REASON</th>
                                        <th className="text-right">DUE AMOUNT</th>
                                        <th className="text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDues.length === 0 ? (
                                        <tr><td colSpan="5" className="empty-cell">No outstanding bills found.</td></tr>
                                    ) : filteredDues.map(c => (
                                        <tr key={c.id}>
                                            <td className="customer-cell">
                                                <div className="avatar">{c.full_name[0]}</div>
                                                <div className="info">
                                                    <span className="name">{c.full_name}</span>
                                                    <span className="id">CUST-{c.id.slice(0, 5).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-info">
                                                    <span>{c.phone}</span>
                                                    <span className="email">{c.email}</span>
                                                </div>
                                            </td>
                                            <td><div className="badge badge-date"><Clock size={12} /> Pending Collection</div></td>
                                            <td className="text-right font-bold text-red-600">
                                                ₹{Number(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    className="btn-pay"
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setShowPaymentModal(true);
                                                    }}
                                                >
                                                    <CreditCard size={14} /> Record Payment
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'credit' && (
                        <div className="table-container">
                            <table className="finance-table credit-table">
                                <thead>
                                    <tr>
                                        <th>ORDER ID</th>
                                        <th>SHOP / CUSTOMER</th>
                                        <th>TOTAL</th>
                                        <th>PAID</th>
                                        <th>DUE</th>
                                        <th>STATUS</th>
                                        <th className="text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr><td colSpan="7" className="empty-cell">No credit notes found.</td></tr>
                                    ) : filteredOrders.map(order => {
                                        const styles = getStatusStyles(order.status);
                                        const balance = Number(order.total_amount) - Number(order.paid_amount);
                                        return (
                                            <tr key={order.id}>
                                                <td className="id-cell">ORD-{order.id.slice(0, 8).toUpperCase()}</td>
                                                <td>
                                                    <div className="info">
                                                        <span className="name">{order.shop_name}</span>
                                                        <span className="shop">{order.customer_name}</span>
                                                    </div>
                                                </td>
                                                <td className="font-bold">₹{Number(order.total_amount).toLocaleString('en-IN')}</td>
                                                <td className="text-emerald-600 font-bold">₹{Number(order.paid_amount).toLocaleString('en-IN')}</td>
                                                <td className="text-red-600 font-black">₹{balance.toLocaleString('en-IN')}</td>
                                                <td>
                                                    <span className="status-chip" style={{ backgroundColor: styles.bg, color: styles.color }}>
                                                        {styles.icon} {order.status}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button className="btn-pay-sm" onClick={() => { setSelectedOrder(order); setPaymentModal(true); }}>
                                                            <CreditCard size={14} /> Pay
                                                        </button>
                                                        <button className="icon-btn-sm" onClick={() => navigate(`/dashboard/invoice/${order.id}`)}>
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
                    )}

                    {activeTab === 'history' && (
                        <div className="table-container">
                            <table className="finance-table">
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>CUSTOMER / SHOP</th>
                                        <th>STATUS</th>
                                        <th>NOTES</th>
                                        <th className="text-right">COLLECTED</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.length === 0 ? (
                                        <tr><td colSpan="5" className="empty-cell">No payment history found.</td></tr>
                                    ) : filteredHistory.map(h => (
                                        <tr key={h.id}>
                                            <td className="date-cell">
                                                <span>{new Date(h.transaction_date).toLocaleDateString('en-GB').replace(/\//g, '.')}</span>
                                                <span className="time">{new Date(h.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td>
                                                <div className="info">
                                                    <span className="name">{h.shop_name || 'Direct Collection'}</span>
                                                    <span className="shop">{h.customer_name}</span>
                                                </div>
                                            </td>
                                            <td><div className="badge badge-success"><CheckCircle size={12} /> Received</div></td>
                                            <td className="notes-cell">{h.notes || '-'}</td>
                                            <td className="text-right font-black text-emerald-600">
                                                +₹{Number(h.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* General Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content finance-modal">
                        <div className="modal-header">
                            <h2><Plus size={20} /> Record New Payment</h2>
                            <button className="close-btn" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="selected-customer-box">
                                <User size={16} />
                                <span>Paying Ref: <strong>{selectedCustomer?.full_name}</strong></span>
                                <span className="balance-badge">Due: ₹{Number(selectedCustomer?.balance).toFixed(2)}</span>
                            </div>

                            <div className="form-group">
                                <label>Collection Amount (₹)</label>
                                <div className="amount-input">
                                    <IndianRupee size={18} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Payment Reference / Notes</label>
                                <textarea
                                    placeholder="e.g. Cash, GPay, Bank Transfer Reference..."
                                    value={paymentData.notes}
                                    onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Confirm Collection</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credit Note Specific Modal */}
            {paymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content credit-modal">
                        <div className="modal-header">
                            <h2>Record Payment Entry</h2>
                            <button className="close-btn" onClick={() => setPaymentModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateOrderPayment}>
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

export default Finance;
