import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Edit, X, Store, Phone, MapPin, Mail, User } from 'lucide-react';
import './StockList.css'; // Reusing common table/page styles
import './Shops.css';

const Shops = () => {
    const [shops, setShops] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);
    const [employees, setEmployees] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [historyTab, setHistoryTab] = useState('orders');
    const [allTransactions, setAllTransactions] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        address: '',
        phone: '',
        email: '',
        customer_id: '',
        salesman_id: ''
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            if (storedUser.role === 'admin') {
                fetchEmployees();
            }
        }
        fetchShops();
        fetchCustomers();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await api.get('/shops');
            setShops(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching shops:', error);
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const hasPermission = (module, action) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        const permissions = user.permissions || {};
        return permissions[module]?.[action] === true;
    };

    const openHistory = async (shop) => {
        try {
            setSelectedShop(shop);
            setHistoryLoading(true);
            const res = await api.get('/sales'); // This will be filtered by salesman if applicable
            const shopSales = res.data.filter(t => t.shop_id === shop.id);
            setAllTransactions(shopSales);
            setShowHistory(true);
            setHistoryTab('orders');
        } catch (err) {
            console.error(err);
            alert('Failed to load shop history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleCreateOrUpdateShop = async (e) => {
        e.preventDefault();

        // Phone validation: should be exactly 10 digits
        const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
        if (phoneDigits.length !== 10) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }

        const finalData = {
            ...formData,
            phone: `+91 ${phoneDigits}`
        };

        try {
            if (formData.id) {
                await api.put(`/shops/${formData.id}`, finalData);
            } else {
                await api.post('/shops', finalData);
            }
            setShowModal(false);
            resetForm();
            fetchShops();
        } catch (error) {
            alert('Failed to save shop');
        }
    };

    const resetForm = () => {
        setFormData({ id: null, name: '', address: '', phone: '', email: '', customer_id: '', salesman_id: '' });
    };

    const openEditShop = (shop) => {
        // Strip prefix for editing
        const rawPhone = shop.phone ? shop.phone.replace('+91 ', '') : '';
        setFormData({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            phone: rawPhone,
            email: shop.email || '',
            customer_id: shop.customer_id,
            salesman_id: shop.salesman_id || ''
        });
        setShowModal(true);
    };

    const handleDeleteShop = async (id) => {
        if (!window.confirm('Are you sure you want to delete this shop?')) return;
        try {
            await api.delete(`/shops/${id}`);
            fetchShops();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(search.toLowerCase()) ||
        shop.phone.includes(search)
    );

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Shop Management</h1>
                    <p className="subtitle">Manage branches and linked customers across regions.</p>
                </div>
                <div className="header-actions">
                    {hasPermission('shops', 'create') && (
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={18} /> Add Shop
                        </button>
                    )}
                </div>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <Search size={18} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Search by Shop Name or Phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>SHOP NAME</th>
                            <th>CUSTOMER</th>
                            {user?.role === 'admin' && <th>SALESMAN</th>}
                            <th>CONTACT</th>
                            <th>ADDRESS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="loading-cell">Loading shops...</td></tr>
                        ) : filteredShops.map((shop, index) => (
                            <tr key={shop.id} onClick={() => openHistory(shop)} className="clickable-row">
                                <td className="sno-cell">{index + 1}</td>
                                <td className="product-cell">
                                    <div className="flex flex-col">
                                        <span className="product-name font-medium text-gray-900">
                                            {shop.name}
                                        </span>
                                        {shop.email && <span className="text-xs text-gray-500">{shop.email}</span>}
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-blue">
                                        <User size={12} className="inline mr-1" />
                                        {shop.customer_name}
                                    </span>
                                </td>
                                {user?.role === 'admin' && (
                                    <td>
                                        <span className="badge badge-purple">
                                            <User size={12} className="inline mr-1" />
                                            {shop.salesman_name || 'Unassigned'}
                                        </span>
                                    </td>
                                )}
                                <td>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Phone size={14} className="text-gray-400" />
                                        {shop.phone}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex items-start gap-2 text-sm max-w-xs">
                                        <MapPin size={14} className="text-emerald-500 mt-1 shrink-0" />
                                        <span className="text-gray-600 leading-relaxed">{shop.address}</span>
                                    </div>
                                </td>
                                <td className="actions-cell">
                                    <div className="flex gap-1">
                                        {hasPermission('shops', 'edit') && (
                                            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openEditShop(shop); }}><Edit size={18} /></button>
                                        )}
                                        {hasPermission('shops', 'delete') && (
                                            <button className="icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id); }}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Shop Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{formData.id ? 'Edit Shop' : 'Add New Shop'}</h2>
                        </div>
                        <form onSubmit={handleCreateOrUpdateShop} className="shop-form">
                            <div className="managed-form">
                                <div className="form-group">
                                    <label>Shop Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter shop name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Customer</label>
                                    <select
                                        value={formData.customer_id}
                                        onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>{customer.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                {user?.role === 'admin' && (
                                    <div className="form-group">
                                        <label>Assign Salesman</label>
                                        <select
                                            value={formData.salesman_id}
                                            onChange={e => setFormData({ ...formData, salesman_id: e.target.value })}
                                        >
                                            <option value="">Assign to Me (Default)</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <div className="flex items-center">
                                        <div className="phone-prefix">+91</div>
                                        <input
                                            type="text"
                                            className="phone-input"
                                            placeholder="98765 43210"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                                            required
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Enter exactly 10 digits</p>
                                </div>
                                <div className="form-group">
                                    <label>Email (Optional)</label>
                                    <input
                                        type="email"
                                        placeholder="shop@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        placeholder="Full shop address"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        required
                                        style={{ minHeight: '100px' }}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Shop</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Shop History Modal */}
            {showHistory && selectedShop && (
                <div className="modal-overlay">
                    <div className="modal-content history-modal">
                        <div className="modal-header history-header">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2>{selectedShop.name} - History</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Owner: {selectedShop.customer_name} | Salesman: {selectedShop.salesman_name || 'N/A'}
                                    </p>
                                </div>
                                <button className="close-btn" onClick={() => setShowHistory(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="history-stats">
                            <div className="h-stat-card">
                                <span className="h-stat-label">Total Orders</span>
                                <span className="h-stat-value">{allTransactions.filter(t => t.type === 'order').length}</span>
                            </div>
                            <div className="h-stat-card">
                                <span className="h-stat-label">Total Paid</span>
                                <span className="h-stat-value text-emerald-600">
                                    ₹{allTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + Number(t.total_amount), 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="h-stat-card">
                                <span className="h-stat-label">Current Due</span>
                                <span className="h-stat-value text-rose-600">
                                    ₹{(allTransactions.filter(t => t.type === 'order').reduce((sum, t) => sum + (Number(t.total_amount) - Number(t.paid_amount || 0)), 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="history-tabs">
                            <button
                                className={`h-tab ${historyTab === 'orders' ? 'active' : ''}`}
                                onClick={() => setHistoryTab('orders')}
                            >
                                Order History
                            </button>
                            <button
                                className={`h-tab ${historyTab === 'payments' ? 'active' : ''}`}
                                onClick={() => setHistoryTab('payments')}
                            >
                                Payment History
                            </button>
                            <button
                                className={`h-tab ${historyTab === 'dues' ? 'active' : ''}`}
                                onClick={() => setHistoryTab('dues')}
                            >
                                Due Details
                            </button>
                        </div>

                        <div className="history-content">
                            {historyLoading ? (
                                <div className="loading-cell p-20">Refreshing history and financial data...</div>
                            ) : (
                                <>
                                    {historyTab === 'orders' && (
                                        <table className="history-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Total</th>
                                                    <th>Paid</th>
                                                    <th>Balance</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allTransactions.filter(t => t.type === 'order').length > 0 ? (
                                                    allTransactions.filter(t => t.type === 'order').map(t => (
                                                        <tr key={t.id}>
                                                            <td>{new Date(t.transaction_date).toLocaleDateString()}</td>
                                                            <td>₹{Number(t.total_amount).toLocaleString()}</td>
                                                            <td>₹{Number(t.paid_amount || 0).toLocaleString()}</td>
                                                            <td className="text-rose-600">₹{(Number(t.total_amount) - Number(t.paid_amount || 0)).toLocaleString()}</td>
                                                            <td><span className={`status-pill ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="5" className="text-center p-8 text-gray-500">No orders found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}

                                    {historyTab === 'payments' && (
                                        <table className="history-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Amount</th>
                                                    <th>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allTransactions.filter(t => t.type === 'payment').length > 0 ? (
                                                    allTransactions.filter(t => t.type === 'payment').map(t => (
                                                        <tr key={t.id}>
                                                            <td>{new Date(t.transaction_date).toLocaleDateString()}</td>
                                                            <td className="text-emerald-600">₹{Number(t.total_amount).toLocaleString()}</td>
                                                            <td className="text-gray-500 italic">{t.notes || 'No notes'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="3" className="text-center p-8 text-gray-500">No payments found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}

                                    {historyTab === 'dues' && (
                                        <div className="dues-view">
                                            <p className="p-4 bg-rose-50 text-rose-800 rounded-lg text-sm border border-rose-200">
                                                These are the individual outstanding amounts for current active orders in this shop.
                                            </p>
                                            <table className="history-table mt-4">
                                                <thead>
                                                    <tr>
                                                        <th>Order ID</th>
                                                        <th>Date</th>
                                                        <th>Pending Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allTransactions.filter(t => t.type === 'order' && (Number(t.total_amount) - Number(t.paid_amount || 0)) > 0).map(t => (
                                                        <tr key={t.id}>
                                                            <td className="font-mono text-xs">#{t.id.slice(0, 8).toUpperCase()}</td>
                                                            <td>{new Date(t.transaction_date).toLocaleDateString()}</td>
                                                            <td className="text-rose-600 font-bold">₹{(Number(t.total_amount) - Number(t.paid_amount || 0)).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shops;
