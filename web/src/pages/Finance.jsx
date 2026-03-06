import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Search, CreditCard, ArrowDownLeft, Clock, CheckCircle, AlertCircle,
    User, History, IndianRupee, Plus, X, TrendingUp, FileText, StickyNote,
    Store, Calendar, ArrowRight, Layout, Download, ShieldAlert,
    ChevronRight, Wallet, Activity, Bell, Filter
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Finance.css';

const Finance = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Core Data State
    const [dues, setDues] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('dues');
    
    // Dynamic Stats
    const [stats, setStats] = useState({
        totalOutstanding: 0,
        thisMonthCollection: 0,
        overdueCount: 0
    });

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const timestamp = Date.now();
            const [custRes, saleRes, shopRes] = await Promise.all([
                api.get(`/customers?t=${timestamp}`),
                api.get(`/sales?t=${timestamp}`),
                api.get(`/shops?t=${timestamp}`)
            ]);

            setShops(shopRes.data);
            
            // For this UI demo, we'll treat unpaid transactions as 'dues' 
            // filtered from sales where total > paid
            const unpaid = saleRes.data.filter(s => 
                (s.type === 'order' || s.type === 'sale') && 
                Number(s.total_amount || s.amount) > Number(s.paid_amount || 0)
            );

            setDues(unpaid);

            // Calculate Stats
            const totalOut = unpaid.reduce((sum, item) => sum + (Number(item.total_amount || item.amount) - Number(item.paid_amount || 0)), 0);
            
            // Collections this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0,0,0,0);
            
            const collectedThisMonth = saleRes.data
                .filter(s => s.type === 'payment' && new Date(s.created_at) >= startOfMonth)
                .reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);

            setStats({
                totalOutstanding: totalOut,
                thisMonthCollection: collectedThisMonth,
                overdueCount: unpaid.filter(u => u.status === 'overdue' || u.status === 'Overdue').length || 0
            });

        } catch (err) {
            console.error("Finance load error", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayClick = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentAmount(String(Number(invoice.total_amount || invoice.amount) - Number(invoice.paid_amount || 0)));
        setShowPaymentModal(true);
    };

    const submitPayment = async () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) return;
        setSubmitting(true);
        try {
            await api.post('/sales', {
                type: 'payment',
                shop_id: selectedInvoice.shop_id,
                customer_id: selectedInvoice.customer_id,
                paid_amount: Number(paymentAmount),
                notes: paymentNotes || `Manual payment for ${selectedInvoice.invoice_number}`,
                parent_id: selectedInvoice.id
            });
            setShowPaymentModal(false);
            fetchAllData();
            // Reset
            setPaymentAmount('');
            setPaymentNotes('');
        } catch (err) {
            alert("Payment failed: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDues = dues.filter(d => 
        (d.invoice_number && d.invoice_number.toLowerCase().includes(search.toLowerCase())) ||
        (d.shop_name && d.shop_name.toLowerCase().includes(search.toLowerCase())) ||
        (d.customer_name && d.customer_name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="finance-page">
            {/* 1. Header Hub */}
            <div className="finance-header-hub">
                <div className="finance-title-section">
                    <h1>Finance & Collections</h1>
                    <p>Track your receivables, manage credit notes and view payment history.</p>
                </div>
                <button className="premium-btn-pay" onClick={() => fetchAllData()}>
                    <Activity size={18} /> Refresh Data
                </button>
            </div>

            {/* 2. Summary Dashboard */}
            <div className="finance-summary-grid">
                <div className="stat-card-new danger">
                    <div className="card-label">
                        <Wallet size={14} /> Total Outstanding
                    </div>
                    <div className="card-value">₹{stats.totalOutstanding.toLocaleString()}</div>
                    <div className="card-footer">
                        <AlertCircle size={14} color="#ef4444" /> {dues.length} Pending Invoices
                    </div>
                </div>

                <div className="stat-card-new success">
                    <div className="card-label">
                        <TrendingUp size={14} /> Collected (MTD)
                    </div>
                    <div className="card-value">₹{stats.thisMonthCollection.toLocaleString()}</div>
                    <div className="card-footer">
                        <CheckCircle size={14} color="#10b981" /> This month's performance
                    </div>
                </div>

                <div className="stat-card-new warning">
                    <div className="card-label">
                        <Bell size={14} /> Critical Dues
                    </div>
                    <div className="card-value">{stats.overdueCount} Alerts</div>
                    <div className="card-footer">
                        <History size={14} color="#f59e0b" /> Follow-up required
                    </div>
                </div>
            </div>

            {/* 3. Main Content Container */}
            <div className="finance-main-content">
                {/* Navigation Pills */}
                <div className="nav-tabs-wrapper">
                    <button 
                        className={`finance-nav-pill ${activeTab === 'dues' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dues')}
                    >
                        <FileText size={18} /> Collection Queue
                    </button>
                    <button 
                        className={`finance-nav-pill ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History size={18} /> Payment History
                    </button>
                    
                    <div className="search-field-pill">
                        <Search size={18} className="search-icon-pill" />
                        <input 
                            placeholder="Find by invoice or shop..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <button className="ghost-btn-icon" title="Filter Options">
                        <Filter size={18} />
                    </button>
                    <button className="ghost-btn-icon" title="Download Report">
                        <Download size={18} />
                    </button>
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className="loading-state">Syncing Financial Records...</div>
                ) : (
                    <table className="modern-data-table">
                        <thead>
                            <tr>
                                <th>Invoice Details</th>
                                <th>Business Entity</th>
                                <th>Amount Due</th>
                                <th>Ageing Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDues.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-cell">No collection items found.</td>
                                </tr>
                            ) : (
                                filteredDues.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="invoice-badge">{item.invoice_number}</div>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>
                                                {new Date(item.created_at).toLocaleDateString('en-IN')}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="merchant-info">
                                                <span className="merchant-name">{item.shop_name || 'Generic Shop'}</span>
                                                <span className="merchant-sub">{item.customer_name || 'Default Customer'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="currency-text">
                                                ₹{(Number(item.total_amount || item.amount) - Number(item.paid_amount || 0)).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                Total bill: ₹{Number(item.total_amount || item.amount).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`status-ring ${Number(item.balance) > 5000 ? 'warning' : 'normal'}`}>
                                                {Number(item.balance) > 5000 ? (
                                                    <><ShieldAlert size={14} /> Overdue</>
                                                ) : (
                                                    <><CheckCircle size={14} /> Normal</>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-stack">
                                                <button className="ghost-btn-icon" title="View PDF">
                                                    <FileText size={18} />
                                                </button>
                                                <button className="premium-btn-pay" onClick={() => handlePayClick(item)}>
                                                    Collect Pay
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Premium Payment Modal */}
            {showPaymentModal && (
                <div className="modal-backdrop-blur">
                    <div className="premium-modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Process Collection</h2>
                            <button className="ghost-btn-icon" onClick={() => setShowPaymentModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ marginTop: '1.5rem', background: '#f1f5f9', padding: '1rem', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>COLLECTING FROM</div>
                            <div style={{ fontWeight: '800', fontSize: '1.125rem', color: '#0f172a' }}>{selectedInvoice.shop_name}</div>
                        </div>

                        <div className="payment-input-hub">
                            <label className="input-label-premium">Amount received (₹)</label>
                            <div className="currency-input-full">
                                <IndianRupee size={28} color="#10b981" />
                                <input 
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <label className="input-label-premium">Notes / Ref #</label>
                        <textarea 
                            style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none' }}
                            rows="2"
                            placeholder="e.g. Cash collected by Murugan"
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                        />

                        <div className="footer-btn-group">
                            <button className="btn-premium-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                            <button className="btn-premium-solid" onClick={submitPayment} disabled={submitting}>
                                {submitting ? 'Processing...' : 'Post Collection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
