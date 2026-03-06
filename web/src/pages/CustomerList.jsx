import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
    Plus, Search, Lock, Unlock, Trash2, Edit, 
    Eye, CreditCard, Filter, ChevronDown, 
    MoreVertical, Phone, Mail, Copy, Check,
    TrendingUp, Users, AlertCircle, Calendar
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './StockList.css';
import './CustomerList.css';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

const CustomerList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(null);
    
    // Filters
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('name');

    const [formData, setFormData] = useState({
        id: null,
        full_name: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'Retail',
        gst_number: '',
        company_name: '',
        city: '',
        state: 'Tamil Nadu',
        pincode: '',
        credit_limit: 0,
        notes: '',
        status: 'Active',
        tags: []
    });

    const fetchCustomers = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/customers');
            setCustomers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, []);

    const resetForm = React.useCallback(() => {
        setFormData({
            id: null, full_name: '', email: '', phone: '', address: '',
            customer_type: 'Retail', gst_number: '', company_name: '',
            city: '', state: 'Tamil Nadu', pincode: '', credit_limit: 0,
            notes: '', status: 'Active', tags: []
        });
    }, []);

    const openEdit = React.useCallback((c) => {
        setFormData({
            ...c,
            email: c.email || '',
            gst_number: c.gst_number || '',
            company_name: c.company_name || '',
            city: c.city || '',
            state: c.state || 'Tamil Nadu',
            pincode: c.pincode || '',
            credit_limit: parseFloat(c.credit_limit || 0),
            notes: c.notes || '',
            tags: c.tags || []
        });
        setShowModal(true);
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && customers.length > 0) {
            const cust = customers.find(c => c.id === editId);
            if (cust) openEdit(cust);
        }
    }, [searchParams, customers, openEdit]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.put(`/customers/${formData.id}`, formData);
            } else {
                await api.post('/customers', formData);
            }
            setShowModal(false);
            resetForm();
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data || 'Failed to save customer');
        }
    };

    const filteredCustomers = React.useMemo(() => {
        return customers.filter(c => {
            const matchesSearch = 
                c.full_name.toLowerCase().includes(search.toLowerCase()) ||
                (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
                (c.phone && c.phone.includes(search)) ||
                (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase())) ||
                (c.id && c.id.slice(0, 8).includes(search.toLowerCase()));

            const matchesType = filterType === 'All' || c.customer_type === filterType;
            const matchesStatus = filterStatus === 'All' || c.status === filterStatus;

            return matchesSearch && matchesType && matchesStatus;
        }).sort((a, b) => {
            if (sortBy === 'last_purchase') {
                return new Date(b.last_purchase_date || 0) - new Date(a.last_purchase_date || 0);
            }
            if (sortBy === 'balance') {
                return b.balance - a.balance;
            }
            return a.full_name.localeCompare(b.full_name);
        });
    }, [customers, search, filterType, filterStatus, sortBy]);

    const analytics = React.useMemo(() => {
        const totalOutstanding = customers.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);
        const activeCount = customers.filter(c => c.status === 'Active').length;
        const highDueCount = customers.filter(c => parseFloat(c.balance) > parseFloat(c.credit_limit)).length;
        return { totalOutstanding, activeCount, highDueCount };
    }, [customers]);

    return (
        <div className="stock-page customer-mgmt">
            <div className="page-header">
                <div className="header-title">
                    <h1>Customer Ecosystem</h1>
                    <p className="subtitle">Manage relationships, credit lines, and purchase patterns.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus size={18} /> New Customer
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="analytics-grid">
                <div className="anal-card">
                    <TrendingUp className="anal-icon red" />
                    <div className="anal-content">
                        <label>Outstanding Debt</label>
                        <h3>₹{analytics.totalOutstanding.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="anal-card">
                    <Users className="anal-icon blue" />
                    <div className="anal-content">
                        <label>Active Relations</label>
                        <h3>{analytics.activeCount}</h3>
                    </div>
                </div>
                <div className="anal-card">
                    <AlertCircle className="anal-icon orange" />
                    <div className="anal-content">
                        <label>Over Credit Limit</label>
                        <h3>{analytics.highDueCount}</h3>
                    </div>
                </div>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <Search size={18} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, email, company or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="filters-group">
                    <div className="filter-item">
                        <label className="filter-label">Customer Type</label>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="filter-select">
                            <option value="All">All Types</option>
                            <option value="Retail">Retail</option>
                            <option value="Wholesale">Wholesale</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label className="filter-label">Relation Status</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Blocked">Blocked</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label className="filter-label">Priority Sort</label>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
                            <option value="name">Sort by Name</option>
                            <option value="last_purchase">Last Purchase</option>
                            <option value="balance">Highest Balance</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container fade-in">
                {loading ? <div className="p-10 text-center"><LoadingSpinner /></div> : (
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Customer Info</th>
                                <th>Type / Status</th>
                                <th>Location</th>
                                <th>Finances</th>
                                <th>Last Order</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div className="cust-cell">
                                            <div className="avatar">{c.full_name.charAt(0).toUpperCase()}</div>
                                            <div className="details">
                                                <span className="name" onClick={() => navigate(`/dashboard/customers/${c.id}`)}>{c.full_name}</span>
                                                <span className="sub">ID: #{c.id.slice(0, 8).toUpperCase()}</span>
                                                <div className="contact-links">
                                                    <a href={`tel:${c.phone}`} title="Call"><Phone size={12} /></a>
                                                    <span className="sep">|</span>
                                                    <span onClick={() => copyToClipboard(c.phone, c.id)} title="Copy Phone">
                                                        {copied === c.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="status-cell">
                                            <span className={`type-tag ${c.customer_type.toLowerCase()}`}>{c.customer_type}</span>
                                            <span className={`status-pill ${c.status.toLowerCase()}`}>{c.status}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="loc-cell">
                                            <span className="city">{c.city || 'No City'}</span>
                                            <span className="state">{c.state || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="finance-cell">
                                            <div className="finance-row">
                                                <label>Used:</label>
                                                <span className={`balance ${parseFloat(c.balance) > 0 ? 'text-red' : 'text-green'}`}>
                                                    ₹{parseFloat(c.balance).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="finance-row">
                                                <label>Limit:</label>
                                                <span>₹{parseFloat(c.credit_limit || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="finance-row remaining">
                                                <label>Remaining:</label>
                                                <span className={parseFloat(c.credit_limit || 0) - parseFloat(c.balance || 0) < 0 ? 'text-red' : 'text-blue'}>
                                                    ₹{Math.max(0, parseFloat(c.credit_limit || 0) - parseFloat(c.balance || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <span>{c.last_purchase_date ? new Date(c.last_purchase_date).toLocaleDateString() : 'Never'}</span>
                                            <span className="ago">{c.last_purchase_date ? 'Purchased' : '-'}</span>
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        <div className="action-btns">
                                            <button className="icon-btn" onClick={() => navigate(`/dashboard/customers/${c.id}`)} title="View Profile"><Eye size={18} /></button>
                                            <button className="icon-btn" onClick={() => openEdit(c)} title="Edit"><Edit size={18} /></button>
                                            <button className="icon-btn money-btn" onClick={() => navigate('/dashboard/finance', { state: { customerId: c.id } })} title="Record Payment">
                                                <CreditCard size={18} />
                                            </button>
                                            <button className="icon-btn delete-btn" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state-large">
                                            <Users size={48} color="#e5e7eb" />
                                            <p>No customers found matching your criteria.</p>
                                            <button className="btn btn-outline" onClick={() => setShowModal(true)}>Add your first customer</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Comprehensive Customer Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content wide-modal">
                        <div className="modal-header">
                            <h2>{formData.id ? 'Refine Customer Data' : 'Establish New Relation'}</h2>
                            <button className="close-x" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateOrUpdate} className="customer-rich-form">
                            <div className="form-sections">
                                {/* Section 1: Core Identity */}
                                <div className="section">
                                    <h3 className="section-title">Identity & Contact</h3>
                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required placeholder="John Doe" />
                                        </div>
                                        <div className="form-group">
                                            <label>Customer Type</label>
                                            <select value={formData.customer_type} onChange={e => setFormData({...formData, customer_type: e.target.value})}>
                                                <option value="Retail">Retail</option>
                                                <option value="Wholesale">Wholesale</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="9876543210" />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                                        </div>
                                    </div>
                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label>Company Name (Optional)</label>
                                            <input type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="Acme Corp" />
                                        </div>
                                        <div className="form-group">
                                            <label>GST Number</label>
                                            <input type="text" value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} placeholder="22AAAAA0000A1Z5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Location & Shipping */}
                                <div className="section">
                                    <h3 className="section-title">Location Details</h3>
                                    <div className="form-group">
                                        <label>Street Address</label>
                                        <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Door No, Street name..."></textarea>
                                    </div>
                                    <div className="grid-3">
                                        <div className="form-group">
                                            <label>City</label>
                                            <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" />
                                        </div>
                                        <div className="form-group">
                                            <label>State</label>
                                            <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Pincode</label>
                                            <input type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="600001" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Parameters & Credit */}
                                <div className="section">
                                    <h3 className="section-title">Business Parameters</h3>
                                    <div className="grid-3">
                                        <div className="form-group">
                                            <label>Credit Limit (₹)</label>
                                            <input type="number" value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Relationship Status</label>
                                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Blocked">Blocked</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Tags (Comma separated)</label>
                                            <input 
                                                type="text" 
                                                value={(formData.tags || []).join(', ')} 
                                                onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})} 
                                                placeholder="VIP, Frequent" 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Internal Relationship Notes</label>
                                        <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any special requirements or history..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions-fixed">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Discard</button>
                                <button type="submit" className="btn btn-primary">Synchronize Records</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerList;
