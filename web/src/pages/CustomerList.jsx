import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Lock, Unlock, Trash2, Edit } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './StockList.css';

const CustomerList = ({ user }) => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: null,
        full_name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const hasPermission = (module, action) => {
        if (!user) return false;
        if (user.role === 'admin' && (!user.permissions?.[module] || user.permissions[module][action] !== false)) return true;
        return user.permissions?.[module]?.[action] === true;
    };

    const handleCreateOrUpdate = async (e) => {
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
                await api.put(`/customers/${formData.id}`, finalData);
            } else {
                await api.post('/customers', finalData);
            }
            setShowModal(false);
            resetForm();
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data || 'Failed to save customer');
        }
    };

    const resetForm = () => {
        setFormData({ id: null, full_name: '', email: '', phone: '', address: '' });
    };

    const openEdit = (c) => {
        // Strip prefix for editing
        const rawPhone = c.phone ? c.phone.replace('+91 ', '') : '';
        setFormData({
            id: c.id,
            full_name: c.full_name,
            email: c.email || '',
            phone: rawPhone,
            address: c.address || ''
        });
        setShowModal(true);
    };

    const toggleLock = async (id, currentStatus) => {
        if (!hasPermission('customers', 'edit')) return;
        try {
            await api.put(`/customers/${id}/lock`, { is_locked: !currentStatus });
            fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!hasPermission('customers', 'delete')) return;
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.phone && c.phone.includes(search))
    );

    return (
        <>
            {loading && <LoadingSpinner fullScreen message="Loading customers..." />}
            <div className="stock-page">
                <div className="page-header">
                    <div>
                        <h1>Customer Management</h1>
                        <p className="subtitle">Manage customer relationships and outstanding balances.</p>
                    </div>
                    {hasPermission('customers', 'create') && (
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={18} /> Add Customer
                        </button>
                    )}
                </div>

                <div className="controls-bar">
                    <div className="search-box">
                        <Search size={18} color="#9ca3af" />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="loading-cell">Loading customers...</td></tr>
                            ) : filteredCustomers.map(c => (
                                <tr key={c.id}>
                                    <td>{c.full_name}</td>
                                    <td>{c.email || '-'}</td>
                                    <td>{c.phone || '-'}</td>
                                    <td>
                                        <span className={`badge ${c.is_locked ? 'badge-gray' : 'badge-emerald'}`} style={{
                                            backgroundColor: c.is_locked ? '#fee2e2' : '#dcfce7',
                                            color: c.is_locked ? '#991b1b' : '#166534'
                                        }}>
                                            {c.is_locked ? 'Locked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <div className="flex gap-1">
                                            {hasPermission('customers', 'edit') && (
                                                <>
                                                    <button className="icon-btn" title="Edit" onClick={() => openEdit(c)}><Edit size={18} /></button>
                                                    <button className="icon-btn" title={c.is_locked ? "Unlock" : "Lock"} onClick={() => toggleLock(c.id, c.is_locked)}>
                                                        {c.is_locked ? <Unlock size={18} className="text-orange-600" /> : <Lock size={18} />}
                                                    </button>
                                                </>
                                            )}
                                            {hasPermission('customers', 'delete') && (
                                                <button className="icon-btn delete-btn" title="Delete" onClick={() => handleDelete(c.id)}>
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

                {/* Customer Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h2>{formData.id ? 'Edit Customer' : 'Add New Customer'}</h2>
                            </div>
                            <form onSubmit={handleCreateOrUpdate}>
                                <div className="managed-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter customer name"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="customer@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <div className="flex items-center gap-2">
                                            <div style={{
                                                padding: '10px 12px',
                                                backgroundColor: '#f3f4f6',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                color: '#374151',
                                                fontWeight: '500'
                                            }}>+91</div>
                                            <input
                                                type="text"
                                                placeholder="98765 43210"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                                                required
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Enter exactly 10 digits</p>
                                    </div>
                                    <div className="form-group">
                                        <label>Address</label>
                                        <textarea
                                            placeholder="Customer address"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            style={{ minHeight: '80px', padding: '10px' }}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Customer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CustomerList;
