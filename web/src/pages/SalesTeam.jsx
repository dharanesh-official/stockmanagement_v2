import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, ShieldCheck, Mail, User } from 'lucide-react';
import './StockList.css'; // Inheriting shared table styles
import './SalesTeam.css'; // New styles

const SalesTeam = ({ user }) => {
    const [salesmen, setSalesmen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });

    useEffect(() => {
        if (user.role !== 'admin') return;
        fetchSalesmen();
    }, [user.role]);

    const fetchSalesmen = async () => {
        try {
            const res = await api.get('/users/salesmen');
            setSalesmen(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will remove the user access.')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchSalesmen();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/salesmen', formData);
            setShowModal(false);
            setFormData({ full_name: '', email: '', password: '' });
            fetchSalesmen();
        } catch (err) {
            alert(err.response?.data || 'Failed to create user');
        }
    };

    if (user.role !== 'admin') return <div className="p-4 text-red-600">Access Denied</div>;

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Sales Team Management</h1>
                    <p className="subtitle">Manage access for your sales personnel.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Salesman
                </button>
            </div>

            <div className="table-container sales-team-list">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="loading-cell">Loading team...</td></tr>
                        ) : salesmen.length === 0 ? (
                            <tr><td colSpan="5" className="loading-cell">No salesmen found. Add one to get started.</td></tr>
                        ) : salesmen.map(s => (
                            <tr key={s.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar text-gray-500">
                                            <User size={16} />
                                        </div>
                                        {s.full_name}
                                    </div>
                                </td>
                                <td><div className="email-cell text-gray-600"><Mail size={14} /> {s.email}</div></td>
                                <td><span className="badge badge-blue"><ShieldCheck size={12} /> Salesman</span></td>
                                <td className="text-gray-500 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                                <td className="actions-cell">
                                    <button className="icon-btn delete-btn" onClick={() => handleDelete(s.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New Salesman</h2>
                        </div>
                        <form onSubmit={handleCreate} className="personnel-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="e.g. john@company.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Create password"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesTeam;
