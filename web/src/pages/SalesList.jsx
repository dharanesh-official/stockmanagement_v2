import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Edit, X, ShoppingCart, Store, User, Hash, Package, ClipboardCheck, FileText, ChevronDown, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StockList.css';

const SalesList = ({ user }) => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');

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
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.delete(`/sales/${id}`);
            fetchSales();
        } catch (err) {
            alert('Failed to delete order');
        }
    };

    const handleStatusUpdate = async (id, nextStatus) => {
        if (!window.confirm(`Update status to "${nextStatus}"?`)) return;

        try {
            await api.put(`/sales/${id}`, { status: nextStatus });
            fetchSales();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const filteredSales = sales.filter(sale => {
        if (statusFilter === 'All') return true;
        return sale.status === statusFilter;
    });

    const getPaymentStatus = (sale) => {
        const total = Number(sale.total_amount);
        const paid = Number(sale.paid_amount || 0);
        if (paid >= total) return 'Fully Paid';
        if (paid > 0) return 'Partially Paid';
        return 'Unpaid';
    };

    const getPaymentColor = (status) => {
        if (status === 'Fully Paid') return 'badge-emerald';
        if (status === 'Partially Paid') return 'badge-blue'; // Using blue/orange as preferred
        return 'badge-gray'; // Unpaid
    };

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Sales & Orders</h1>
                    <p className="subtitle">
                        {user.role === 'admin' ? 'Viewing all salesman orders' : 'Viewing your orders'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <select
                            className="btn bg-white border border-gray-300 text-gray-700 pl-4 pr-10 py-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Ordered">Ordered</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                        <Filter size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard/create-order')}>
                        <Plus size={18} /> New Order
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Shop</th>
                            <th>Customer</th>
                            <th>Salesman</th>
                            <th>Payment</th>
                            <th>Order Status</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" className="loading-cell">Loading orders...</td></tr>
                        ) : filteredSales.length === 0 ? (
                            <tr><td colSpan="8" className="loading-cell">No orders found.</td></tr>
                        ) : filteredSales.map(sale => {
                            const paymentStatus = getPaymentStatus(sale);
                            return (
                                <tr key={sale.id}>
                                    <td className="date-cell">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700">{new Date(sale.transaction_date).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(sale.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                                <Store size={16} />
                                            </div>
                                            <span className="font-bold text-gray-800">{sale.shop_name || 'Direct Sale'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-blue">
                                            <User size={12} className="inline mr-1" />
                                            {sale.customer_name}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-purple">
                                            {sale.salesman_name}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${getPaymentColor(paymentStatus)}`}>
                                            {paymentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div
                                            className={`badge ${sale.status === 'Delivered' ? 'badge-emerald' : sale.status === 'Dispatched' ? 'badge-blue' : 'badge-gray'}`}
                                            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', paddingRight: '1.75rem', cursor: 'pointer', minWidth: '110px' }}
                                        >
                                            <span className="uppercase font-bold" style={{ flex: 1 }}>{sale.status}</span>
                                            <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-60" />
                                            <select
                                                value={sale.status}
                                                onChange={(e) => handleStatusUpdate(sale.id, e.target.value)}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    opacity: 0,
                                                    cursor: 'pointer',
                                                    appearance: 'none'
                                                }}
                                            >
                                                <option value="Ordered">Ordered</option>
                                                <option value="Dispatched">Dispatched</option>
                                                <option value="Delivered">Delivered</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-lg font-black text-gray-900 line-height-none">₹{Number(sale.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="actions-cell">
                                        <div className="flex gap-1">
                                            <button className="icon-btn" title="View Invoice" onClick={() => navigate(`/dashboard/invoice/${sale.id}`)}>
                                                <FileText size={18} />
                                            </button>
                                            <button className="icon-btn" title="Edit Order" onClick={() => navigate('/dashboard/create-order', { state: { editOrder: sale } })}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn delete-btn" title="Delete Order" onClick={() => handleDelete(sale.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesList;
