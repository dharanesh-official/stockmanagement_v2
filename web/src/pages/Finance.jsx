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
    StickyNote,
    Store,
    Calendar,
    ArrowRight,
    Layout,
    Download,
    ShieldAlert
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Finance.css';

const Finance = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [dues, setDues] = useState([]);
    const [unpaidTransactions, setUnpaidTransactions] = useState([]);
    const [creditNotes, setCreditNotes] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('dues');
    const [filterCustomerId, setFilterCustomerId] = useState(location.state?.customerId || null);
    const [filterShopId, setFilterShopId] = useState(location.state?.shopId || null);

    // Payment Modal State (General Dues)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        notes: ''
    });

    // Shop-wise Data State
    const [selectedShopForFinance, setSelectedShopForFinance] = useState(null);
    const [shopFinanceHistory, setShopFinanceHistory] = useState([]);
    const [shopFinanceSummary, setShopFinanceSummary] = useState(null);
    const [shopFinanceLoading, setShopFinanceLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Credit Limit Modal State
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [creditData, setCreditData] = useState({
        limit: 0
    });

    // Credit Note Modal State (Order Specific)
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Added timestamp to prevent caching
            const timestamp = Date.now();
            const [custRes, saleRes, shopRes] = await Promise.all([
                api.get(`/customers?t=${timestamp}`),
                api.get(`/sales?t=${timestamp}`),
                api.get(`/shops?t=${timestamp}`)
            ]);

            // For Dues Tab - Total Outstanding calculation
            const allCustomers = custRes.data;
            setShops(shopRes.data);
            
            // If filtering by shop, we might still want to see the specific customer's balance
            // Dues logic: if shop filter is active, we should only show customers associated with that shop's transactions?
            // Actually, balance is per customer. Let's just keep dues as customers but filterable.
            
            // Update State
            setDues(allCustomers);
            setShops(shopRes.data);
            
            const allTransactions = saleRes.data;

            // For Dues Tab - Unpaid Invoices
            const unpaid = allTransactions.filter(t => (t.type === 'order' || t.type === 'sale') && (Number(t.total_amount) - Number(t.paid_amount) > 0.01));
            setUnpaidTransactions(unpaid);

            // For History Tab
            const payments = allTransactions.filter(t => t.type === 'payment');
            setPaymentHistory(payments);

            // For Credit Note Tab
            const credits = allTransactions.filter(t => t.type === 'credit_note');
            setCreditNotes(credits);

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
                notes: paymentData.notes,
                payment_method: selectedPaymentMethod
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
            await api.post('/sales', {
                customer_id: selectedOrder.customer_id,
                shop_id: selectedOrder.shop_id,
                type: 'payment',
                amount: parseFloat(paymentAmount),
                notes: `Ref Order #${selectedOrder.id.slice(0, 8).toUpperCase()}`,
                payment_method: selectedPaymentMethod,
                applied_invoice_id: selectedOrder.id
            });

            // Additionally update the order status
            await api.put(`/sales/payment/${selectedOrder.id}`, {
                amountPaid: parseFloat(paymentAmount)
            });

            setPaymentModal(false);
            setPaymentAmount('');
            setSelectedOrder(null);
            fetchAllData();
            alert('Payment recorded successfully!');
        } catch (err) {
            alert('Failed to update payment');
        }
    };

    const handleUpdateCreditLimit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/customers/${selectedCustomer.id}`, {
                credit_limit: parseFloat(creditData.limit)
            });
            setShowCreditModal(false);
            setSelectedCustomer(null);
            fetchAllData();
            alert('Credit limit updated successfully!');
        } catch (err) {
            alert('Failed to update credit limit');
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
        if (user.role === 'admin' || user.role === 'super_admin') return true;
        return user.permissions?.finance?.[tabId] === true;
    };

    const fetchShopFinanceHistory = async (shopId) => {
        setShopFinanceLoading(true);
        try {
            const res = await api.get(`/shops/${shopId}/finance`, {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });
            setShopFinanceHistory(res.data.history);
            setShopFinanceSummary(res.data.summary);
        } catch (err) {
            console.error('Failed to fetch shop finance:', err);
        } finally {
            setShopFinanceLoading(false);
        }
    };

    useEffect(() => {
        if (selectedShopForFinance) {
            fetchShopFinanceHistory(selectedShopForFinance.id);
        }
    }, [dateRange, selectedShopForFinance]);

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
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollection = paymentHistory
        .filter(h => h.transaction_date.slice(0, 10) === todayStr)
        .reduce((sum, h) => sum + Number(h.total_amount), 0);

    const filteredUnpaid = unpaidTransactions.filter(t => {
        const matchesSearch = t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                              t.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
                              t.id.includes(search);
        const matchesCustomer = filterCustomerId ? t.customer_id === filterCustomerId : true;
        const matchesShop = filterShopId ? t.shop_id === filterShopId : true;
        return matchesSearch && matchesCustomer && matchesShop;
    });

    const filteredHistory = paymentHistory.filter(h => {
        const matchesSearch = h.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                              h.shop_name?.toLowerCase().includes(search.toLowerCase());
        const matchesCustomer = filterCustomerId ? h.customer_id === filterCustomerId : true;
        const matchesShop = filterShopId ? h.shop_id === filterShopId : true;
        return matchesSearch && matchesCustomer && matchesShop;
    });

    const filteredCreditNotes = creditNotes.filter(o => {
        const matchesSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                              o.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
                              o.id.includes(search);
        const matchesCustomer = filterCustomerId ? o.customer_id === filterCustomerId : true;
        const matchesShop = filterShopId ? o.shop_id === filterShopId : true;
        return matchesSearch && matchesCustomer && matchesShop;
    });

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => Object.values(item).map(val => `"${val}"`).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="loading-state">Synchronizing financial records...</div>;

    return (
        <div className="finance-page">
            <header className="page-header">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1>Finance Hub</h1>
                            <p className="subtitle">Unified management of dues, payments, and credit notes.</p>
                        </div>
                        <div className="filter-badge-group">
                            {filterCustomerId && (
                                <div className="filter-badge customer">
                                    <User size={12} />
                                    <span>{dues.find(d => d.id === filterCustomerId)?.full_name || 'Specific Customer'}</span>
                                    <button className="clear-filter" onClick={() => setFilterCustomerId(null)}>&times;</button>
                                </div>
                            )}
                            {filterShopId && (
                                <div className="filter-badge shop">
                                    <Store size={12} />
                                    <span>{shops.find(s => s.id === filterShopId)?.name || 'Specific Shop'}</span>
                                    <button className="clear-filter" onClick={() => setFilterShopId(null)}>&times;</button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="header-filters">
                        <div className="shop-select-wrapper">
                            <Store size={16} className="select-icon" />
                            <select 
                                value={filterShopId || ''} 
                                onChange={(e) => setFilterShopId(e.target.value || null)}
                                className="shop-filter-select"
                            >
                                <option value="">All Shops (Shop-wise)</option>
                                {shops.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
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

            {/* Smart Alerts Section */}
            <div className="finance-alerts">
                {unpaidTransactions.filter(t => Number(t.days_overdue) > 7).length > 0 && (
                    <div className="alert-banner danger">
                        <ShieldAlert size={18} />
                        <span><strong>{unpaidTransactions.filter(t => Number(t.days_overdue) > 7).length}</strong> high-priority invoices are overdue. Please follow up.</span>
                        <button onClick={() => { setActiveTab('dues'); setSearch(''); }}>View Dues</button>
                    </div>
                )}
                {dues.filter(c => Number(c.balance) > Number(c.credit_limit || 0) && Number(c.credit_limit) > 0).length > 0 && (
                    <div className="alert-banner warning">
                        <ShieldAlert size={18} />
                        <span><strong>{dues.filter(c => Number(c.balance) > Number(c.credit_limit || 0) && Number(c.credit_limit) > 0).length}</strong> customers have exceeded their credit limit.</span>
                    </div>
                )}
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
                    {canSeeTab('shops') && (
                        <button
                            className={`tab ${activeTab === 'shops' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('shops');
                                setSelectedShopForFinance(null);
                            }}
                        >
                            <Layout size={18} /> Shop-wise Data
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
                            <div className="table-header-row">
                                <span className="title">Pending Collection (Unpaid Invoices)</span>
                                <button className="btn-export" onClick={() => exportToCSV(filteredUnpaid, 'Unpaid_Invoices')}>
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                            <table className="finance-table">
                                <thead>
                                    <tr>
                                        <th>INVOICE ID</th>
                                        <th>SHOP / CUSTOMER</th>
                                        <th>SALESMAN</th>
                                        <th>ORDER DATE</th>
                                        <th>DUE DATE</th>
                                        <th className="text-right">DUE AMOUNT</th>
                                        <th className="text-center">STATUS</th>
                                        <th className="text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUnpaid.length === 0 ? (
                                        <tr><td colSpan="8" className="empty-cell">No outstanding bills found.</td></tr>
                                    ) : filteredUnpaid.map(t => {
                                        const overdue = Number(t.days_overdue);
                                        let overdueColor = 'green';
                                        let statusText = 'Normal';
                                        
                                        if (overdue > 7) { overdueColor = 'red'; statusText = 'Overdue'; }
                                        else if (overdue > 0) { overdueColor = 'yellow'; statusText = 'Due Soon'; }
                                        
                                        return (
                                            <tr key={t.id}>
                                                <td className="id-cell">INV-{t.id.slice(0, 8).toUpperCase()}</td>
                                                <td>
                                                    <div className="info">
                                                        <span className="name">{t.shop_name || 'Direct Sale'}</span>
                                                        <span className="shop">{t.customer_name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-blue-600 font-semibold">{t.salesman_name}</td>
                                                <td className="text-gray-500 font-medium">{new Date(t.transaction_date).toLocaleDateString('en-GB')}</td>
                                                <td className="text-gray-500 font-medium">{t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : '-'}</td>
                                                <td className="text-right font-black text-red-600">
                                                    ₹{Number(t.total_amount - t.paid_amount).toLocaleString('en-IN')}
                                                </td>
                                                <td className="text-center">
                                                    <div className={`overdue-pill ${overdueColor}`}>
                                                        {statusText} {overdue > 0 && `(${overdue}d)`}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            className="btn-pay-sm"
                                                            onClick={() => {
                                                                setSelectedOrder(t);
                                                                setPaymentModal(true);
                                                            }}
                                                        >
                                                            <CreditCard size={14} /> Pay
                                                        </button>
                                                        <button 
                                                            className="btn-limit-sm" 
                                                            title="Credit Limit" 
                                                            onClick={() => {
                                                                setSelectedCustomer({ id: t.customer_id, full_name: t.customer_name });
                                                                setShowCreditModal(true);
                                                            }}
                                                        >
                                                            <ShieldAlert size={14} />
                                                        </button>
                                                        <button 
                                                            className="icon-btn-sm" 
                                                            title="Customer Ledger" 
                                                            onClick={() => navigate(`/dashboard/customers/${t.customer_id}/ledger`)}
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
                    )}

                    {activeTab === 'credit' && (
                        <div className="table-container">
                            <div className="table-header-row">
                                <span className="title">Credit Notes Issued</span>
                                <button className="btn-export" onClick={() => exportToCSV(filteredCreditNotes, 'Credit_Notes')}>
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                            <table className="finance-table credit-table">
                                <thead>
                                    <tr>
                                        <th>CN-ID</th>
                                        <th>SHOP / CUSTOMER</th>
                                        <th className="text-right">AMOUNT</th>
                                        <th>REASON</th>
                                        <th>DATE</th>
                                        <th>LINKED INV</th>
                                        <th className="text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCreditNotes.length === 0 ? (
                                        <tr><td colSpan="7" className="empty-cell">No credit notes found.</td></tr>
                                    ) : filteredCreditNotes.map(cn => {
                                        return (
                                            <tr key={cn.id}>
                                                <td className="id-cell">CN-{cn.id.slice(0, 8).toUpperCase()}</td>
                                                <td>
                                                    <div className="info">
                                                        <span className="name">{cn.shop_name}</span>
                                                        <span className="shop">{cn.customer_name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-right font-bold text-amber-600">₹{Number(cn.total_amount).toLocaleString('en-IN')}</td>
                                                <td className="notes-cell">{cn.notes || 'Return/Adjustment'}</td>
                                                <td className="text-gray-500">{new Date(cn.transaction_date).toLocaleDateString('en-GB')}</td>
                                                <td className="font-semibold text-blue-500">
                                                    {cn.applied_invoice_id ? `INV-${cn.applied_invoice_id.slice(0, 8).toUpperCase()}` : '-'}
                                                </td>
                                                <td className="text-center">
                                                    <button className="icon-btn-sm" onClick={() => navigate(`/dashboard/invoice/${cn.id}`)}>
                                                        <FileText size={14} />
                                                    </button>
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
                            <div className="table-header-row">
                                <span className="title">Universal Payment History</span>
                                <button className="btn-export" onClick={() => exportToCSV(filteredHistory, 'Payment_History')}>
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                            <table className="finance-table">
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>CUSTOMER / SHOP</th>
                                        <th>METHOD</th>
                                        <th>LINKED INV</th>
                                        <th>NOTES</th>
                                        <th className="text-right">COLLECTED</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.length === 0 ? (
                                        <tr><td colSpan="6" className="empty-cell">No payment history found.</td></tr>
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
                                            <td>
                                                <span className={`method-pill ${h.payment_method?.toLowerCase().replace(' ', '-') || 'cash'}`}>
                                                    {h.payment_method || 'Cash'}
                                                </span>
                                            </td>
                                            <td>
                                                {h.applied_invoice_id ? (
                                                    <span className="text-blue-500 font-bold">INV-{h.applied_invoice_id.slice(0, 8).toUpperCase()}</span>
                                                ) : <span className="text-gray-400">Direct</span>}
                                            </td>
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

                    {activeTab === 'shops' && (
                        <div className="shop-finance-view">
                            {!selectedShopForFinance ? (
                                <div className="shops-grid">
                                    {(search ? shops.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : shops).map(shop => (
                                        <div key={shop.id} className="shop-finance-card" onClick={() => setSelectedShopForFinance(shop)}>
                                            <div className="card-header">
                                                <div className="shop-icon"><Store size={20} /></div>
                                                <div className="shop-meta">
                                                    <h4>{shop.name}</h4>
                                                    <span className="area">{shop.area_name}</span>
                                                </div>
                                                <ArrowRight size={18} className="arrow" />
                                            </div>
                                            <div className="card-body">
                                                <div className="mini-stat">
                                                    <span>Salesman</span>
                                                    <strong>{shop.salesman_name || 'Unassigned'}</strong>
                                                </div>
                                                <div className="mini-stat">
                                                    <span>Contact</span>
                                                    <strong>{shop.phone}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {shops.length === 0 && <div className="empty-state">No shops found.</div>}
                                </div>
                            ) : (
                                <div className="shop-detail-view">
                                    <div className="detail-header">
                                        <div className="flex items-center gap-4">
                                            <button className="btn-back" onClick={() => setSelectedShopForFinance(null)}>
                                                &larr; Back
                                            </button>
                                            <div className="shop-title">
                                                <h2>{selectedShopForFinance.name}</h2>
                                                <p>{selectedShopForFinance.address}</p>
                                            </div>
                                        </div>
                                        <div className="date-filter">
                                            <div className="date-input">
                                                <Calendar size={14} />
                                                <input 
                                                    type="date" 
                                                    value={dateRange.start} 
                                                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                                />
                                            </div>
                                            <span className="sep">-</span>
                                            <div className="date-input">
                                                <Calendar size={14} />
                                                <input 
                                                    type="date" 
                                                    value={dateRange.end} 
                                                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shop-summary-bar">
                                        <div className="sum-item">
                                            <label>Total Sales</label>
                                            <span className="val primary">₹{Number(shopFinanceSummary?.total_sales || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="sum-item">
                                            <label>Total Collected</label>
                                            <span className="val success">₹{Number(shopFinanceSummary?.total_payments || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="sum-item">
                                            <label>Credits Issued</label>
                                            <span className="val warning">₹{Number(shopFinanceSummary?.total_credits || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="sum-item highlight">
                                            <label>Net Balance (Est.)</label>
                                            <span className="val danger">
                                                ₹{(Number(shopFinanceSummary?.total_sales || 0) - Number(shopFinanceSummary?.total_payments || 0) - Number(shopFinanceSummary?.total_credits || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {shopFinanceLoading ? (
                                        <div className="loading-mini">Synchronizing shop history...</div>
                                    ) : (
                                        <div className="table-container history-table">
                                            <table className="finance-table">
                                                <thead>
                                                    <tr>
                                                        <th>DATE</th>
                                                        <th>CUSTOMER</th>
                                                        <th>TYPE</th>
                                                        <th>SALESMAN</th>
                                                        <th className="text-right">AMOUNT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {shopFinanceHistory.length === 0 ? (
                                                        <tr><td colSpan="5" className="empty-cell">No transactions found for this period.</td></tr>
                                                    ) : shopFinanceHistory.map(h => (
                                                        <tr key={h.id}>
                                                            <td className="date-cell">
                                                                {new Date(h.transaction_date).toLocaleDateString('en-GB')}
                                                            </td>
                                                            <td className="font-bold">{h.customer_name}</td>
                                                            <td>
                                                                <span className={`type-pill ${h.type}`}>
                                                                    {h.type.replace('_', ' ').toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="text-gray-500">{h.salesman_name}</td>
                                                            <td className={`text-right font-black amount-cell ${h.type}`}>
                                                                {h.type === 'payment' ? '+' : h.type === 'credit_note' ? '-' : ''}₹{Number(h.total_amount).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                <label>Payment Method</label>
                                <div className="payment-methods-grid">
                                    {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Credit'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            className={`method-btn ${selectedPaymentMethod === method ? 'active' : ''}`}
                                            onClick={() => setSelectedPaymentMethod(method)}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Payment Reference / Notes</label>
                                <textarea
                                    placeholder="e.g. UPI Ref, Cheque No, Bank Ref..."
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

                            <div className="form-group mt-4">
                                <label>Payment Method</label>
                                <div className="payment-methods-grid">
                                    {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Credit'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            className={`method-btn ${selectedPaymentMethod === method ? 'active' : ''}`}
                                            onClick={() => setSelectedPaymentMethod(method)}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Update Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credit Limit Management Modal */}
            {showCreditModal && (
                <div className="modal-overlay">
                    <div className="modal-content credit-limit-modal">
                        <div className="modal-header">
                            <h2><ShieldAlert size={20} /> Credit Limit Control</h2>
                            <button className="close-btn" onClick={() => setShowCreditModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateCreditLimit}>
                            <div className="selected-customer-box">
                                <User size={16} />
                                <span>Policy for: <strong>{selectedCustomer?.full_name}</strong></span>
                            </div>

                            <div className="form-group">
                                <label>Maximum Credit Allowed (₹)</label>
                                <div className="amount-input">
                                    <IndianRupee size={18} />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={creditData.limit}
                                        onChange={e => setCreditData({ limit: e.target.value })}
                                        required
                                    />
                                </div>
                                <p className="helper-text">System will block new orders if balance exceeds this limit. Set to 0 for unlimited.</p>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Authorize Limit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
