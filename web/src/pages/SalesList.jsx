import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Edit, X, ShoppingCart, Store, User, Hash, Package, ClipboardCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StockList.css';

const SalesList = ({ user }) => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Sales & Orders</h1>
                    <p className="subtitle">
                        {user.role === 'admin' ? 'Viewing all salesman orders' : 'Viewing your orders'}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard/create-order')}>
                    <Plus size={18} /> New Order
                </button>
            </div>

            <div className="table-container">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Shop</th>
                            <th>Customer</th>
                            <th>Salesman</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="loading-cell">Loading orders...</td></tr>
                        ) : sales.map(sale => (
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
                                        <User size={12} className="inline mr-1" />
                                        {sale.salesman_name}
                                    </span>
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesList;
