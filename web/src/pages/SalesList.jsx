import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    Plus, Search, Trash2, Edit, X, ShoppingCart, Store, User, Hash, 
    Package, ClipboardCheck, FileText, ChevronDown, Filter, Loader2, 
    Navigation, TrendingUp, BarChart3 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import SalesAnalytics from './SalesAnalytics';
import './StockList.css';

const SalesList = ({ user }) => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAnalytics, setShowAnalytics] = useState(false);
    
    // Filters State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales');
            setSales(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Warning: This will permanently delete the order and associated stock records. Proceed?')) return;
        try {
            await api.delete(`/sales/${id}`);
            fetchSales();
        } catch (err) {
            alert('Failed to delete order');
        }
    };

    const handleStatusUpdate = async (id, nextStatus, currentStatus) => {
        if (updatingId === id || nextStatus === currentStatus) return;
        setUpdatingId(id);
        try {
            await api.put(`/sales/${id}`, { status: nextStatus });
            await fetchSales();
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const getPaymentStatus = (sale) => {
        const total = Number(sale.total_amount) + Number(sale.gst_amount || 0) + Number(sale.shipping_charge || 0) - Number(sale.discount_amount || 0);
        const paid = Number(sale.paid_amount || 0);
        const due_date = new Date(sale.due_date);
        const today = new Date();

        if (paid >= total) return { label: 'Paid', class: 'badge-emerald' };
        if (paid > 0) return { label: 'Partial', class: 'badge-blue' };
        if (sale.due_date && due_date < today) return { label: 'Overdue', class: 'badge-red' };
        return { label: 'Unpaid', class: 'badge-gray' };
    };

    const filteredSales = sales.filter(sale => {
        const matchesSearch = 
            (sale.invoice_number?.toLowerCase().includes(search.toLowerCase())) ||
            (sale.customer_name?.toLowerCase().includes(search.toLowerCase())) ||
            (sale.shop_name?.toLowerCase().includes(search.toLowerCase()));
            
        const matchesStatus = statusFilter === 'All' || sale.status === statusFilter;
        const matchesType = typeFilter === 'All' || sale.order_type === typeFilter;
        
        const payStatus = getPaymentStatus(sale).label;
        const matchesPayment = paymentFilter === 'All' || payStatus === paymentFilter;

        return matchesSearch && matchesStatus && matchesType && matchesPayment;
    });

    return (
        <>
            {loading && <LoadingSpinner fullScreen message="Loading order ledger..." />}
            <div className="stock-page">
                <div className="page-header">
                    <div>
                        <h1>Order Management</h1>
                        <p className="subtitle">Track sales performance and logistics lifecycle across all shops.</p>
                    </div>
                    <div className="header-actions">
                        <button className={`btn ${showAnalytics ? 'btn-outline' : 'btn-secondary'}`} onClick={() => setShowAnalytics(!showAnalytics)}>
                            {showAnalytics ? <TrendingUp size={18} /> : <BarChart3 size={18} />}
                            {showAnalytics ? 'Hide Market Insights' : 'Show Market Insights'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/dashboard/create-order')}>
                            <Plus size={18} /> New Transaction
                        </button>
                    </div>
                </div>

                {showAnalytics && <SalesAnalytics />}

                <div className="controls-bar" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <div className="search-box" style={{ flex: '1 1 300px' }}>
                        <Search size={18} color="#9ca3af" />
                        <input
                            type="text"
                            placeholder="Find by Invoice ID, Shop or Customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="filters-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="filter-item">
                            <label className="filter-label">Origin</label>
                            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                <option value="All">All Types</option>
                                <option value="Shop Order">Shop Order</option>
                                <option value="Direct Sale">Direct Sale</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label className="filter-label">Status</label>
                            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">All Status</option>
                                <option value="Ordered">Ordered</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Returned">Returned</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label className="filter-label">Payment</label>
                            <select className="filter-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
                                <option value="All">Any Status</option>
                                <option value="Paid">Paid</option>
                                <option value="Partial">Partially Paid</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>ORDER / INVOICE</th>
                                <th>CLIENT & SHOP</th>
                                <th>ORIGIN</th>
                                <th>PAYMENT</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>DUE AMOUNT</th>
                                <th style={{ textAlign: 'right' }}>TOTAL</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="empty-inventory" style={{ padding: '4rem' }}>
                                            <ClipboardCheck size={48} className="empty-icon" />
                                            <h3>No Transactions Found</h3>
                                            <p>Adjust your filters or search terms to find specific records.</p>
                                            <button className="btn btn-outline" onClick={() => { setSearch(''); setStatusFilter('All'); setTypeFilter('All'); setPaymentFilter('All'); }}>Reset Explorer</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSales.map(sale => {
                                const payStatus = getPaymentStatus(sale);
                                return (
                                    <tr key={sale.id}>
                                        <td className="date-cell">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{sale.invoice_number || `ORD-${sale.id.slice(0, 8).toUpperCase()}`}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(sale.transaction_date).toLocaleDateString()} at {new Date(sale.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800">{sale.customer_name}</span>
                                                <small className="text-gray-500 font-medium flex items-center gap-1">
                                                    <Store size={12} /> {sale.shop_name || 'Direct Sale'}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${sale.order_type === 'Shop Order' ? 'badge-purple' : 'badge-gray'}`}>
                                                {sale.order_type || 'Direct Sale'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className={`badge ${payStatus.class}`} style={{ width: 'fit-content' }}>{payStatus.label}</span>
                                                <small className="text-gray-400 font-bold uppercase" style={{ fontSize: '9px' }}>{sale.payment_method || 'Unspecified'}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                className={`badge ${sale.status === 'Delivered' ? 'badge-emerald' : sale.status === 'Dispatched' ? 'badge-blue' : sale.status === 'Cancelled' ? 'badge-red' : 'badge-gray'}`}
                                                style={{
                                                    position: 'relative',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    paddingRight: '1.75rem',
                                                    cursor: updatingId === sale.id ? 'wait' : 'pointer',
                                                    minWidth: '120px',
                                                }}
                                            >
                                                <span className="uppercase font-bold" style={{ flex: 1 }}>{sale.status}</span>
                                                {updatingId === sale.id ? (
                                                    <Loader2 size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin" />
                                                ) : (
                                                    <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-60" />
                                                )}
                                                <select
                                                    value={sale.status}
                                                    onChange={(e) => handleStatusUpdate(sale.id, e.target.value, sale.status)}
                                                    disabled={updatingId === sale.id}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                >
                                                    <option value="Ordered">Ordered</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Dispatched">Dispatched</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                    <option value="Returned">Returned</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className={`font-bold ${Number(sale.due_amount) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                ₹{Number(sale.due_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="text-lg font-black text-gray-900">₹{(Number(sale.total_amount) + Number(sale.gst_amount || 0) + Number(sale.shipping_charge || 0) - Number(sale.discount_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                            <div className="flex gap-1">
                                                <button className="icon-btn" title="View Invoice" onClick={() => navigate(`/dashboard/invoice/${sale.id}`)}>
                                                    <FileText size={18} />
                                                </button>
                                                <button className="icon-btn" title="Order Details" onClick={() => navigate(`/dashboard/sales/${sale.id}`)}>
                                                    <Package size={18} />
                                                </button>
                                                {user.role === 'admin' && (
                                                    <button className="icon-btn delete-btn" title="Void Order" onClick={() => handleDelete(sale.id)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default SalesList;
