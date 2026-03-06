import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft, Phone, Mail, MapPin,
    CreditCard, ShoppingBag, History,
    Calendar, ShieldCheck, Tag,
    ExternalLink, Copy, Check
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './CustomerProfile.css';

const CustomerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(null);

    const fetchCustomerDetails = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/customers/${id}`);
            setCustomer(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCustomerDetails();
    }, [fetchCustomerDetails]);

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    if (loading) return <LoadingSpinner fullScreen message="Loading customer profile..." />;
    if (!customer) return <div className="p-8 text-center">Customer not found.</div>;

    const { transactions, analytics } = customer;

    return (
        <div className="customer-profile">
            <div className="profile-header">
                <button className="back-btn" onClick={() => navigate('/dashboard/customers')}>
                    <ArrowLeft size={20} /> Back to Customers
                </button>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => navigate(`/dashboard/customers?edit=${customer.id}`)}>Edit Profile</button>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard/create-order', { state: { customerId: customer.id } })}>New Transaction</button>
                </div>
            </div>

            <div className="profile-grid">
                {/* Left Sidebar: Basic Info */}
                <div className="profile-sidebar">
                    <div className="card info-card">
                        <div className="user-avatar-large">
                            {customer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="customer-name">{customer.full_name}</h2>
                        <div className={`status-pill large ${(customer.status || 'active').toLowerCase()}`}>
                            {customer.status}
                        </div>

                        <div className="info-list">
                            <div className="info-item">
                                <Phone size={16} />
                                <div className="info-content">
                                    <label>Phone</label>
                                    <div className="flex items-center gap-2">
                                        <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                                        <button className="copy-btn" onClick={() => copyToClipboard(customer.phone, 'phone')}>
                                            {copied === 'phone' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="info-item">
                                <Mail size={16} />
                                <div className="info-content">
                                    <label>Email</label>
                                    <div className="flex items-center gap-2">
                                        <a href={`mailto:${customer.email}`}>{customer.email || 'No email provided'}</a>
                                        {customer.email && (
                                            <button className="copy-btn" onClick={() => copyToClipboard(customer.email, 'email')}>
                                                {copied === 'email' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="info-item">
                                <MapPin size={16} />
                                <div className="info-content">
                                    <label>Location</label>
                                    <span>{customer.address || 'No address provided'}</span>
                                    {customer.city && <span className="text-sm text-gray-500">{customer.city}, {customer.state}</span>}
                                </div>
                            </div>
                            <div className="info-item">
                                <ShieldCheck size={16} />
                                <div className="info-content">
                                    <label>Customer Type</label>
                                    <span className="badge badge-indigo">{customer.customer_type}</span>
                                </div>
                            </div>
                            {customer.gst_number && (
                                <div className="info-item">
                                    <Tag size={16} />
                                    <div className="info-content">
                                        <label>GST Number</label>
                                        <span>{customer.gst_number}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="tags-container">
                            {(customer.tags || []).map((tag, i) => (
                                <span key={i} className="tag-pill">{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className="card credit-card-widget">
                        <h3>Credit Tracking</h3>
                        <div className="credit-metric">
                            <label>Outstanding Balance</label>
                            <span className={`amount ${customer.balance > 0 ? 'danger' : 'success'}`}>
                                ₹{parseFloat(customer.balance).toLocaleString()}
                            </span>
                        </div>
                        <div className="credit-metric">
                            <label>Credit Limit</label>
                            <span>₹{parseFloat(customer.credit_limit || 0).toLocaleString()}</span>
                        </div>
                        <div className="progress-bar-container">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${Math.min((customer.balance / (customer.credit_limit || 1)) * 100, 100)}%`,
                                    backgroundColor: customer.balance > customer.credit_limit ? '#ef4444' : '#6366f1'
                                }}
                            ></div>
                        </div>
                        {customer.balance > customer.credit_limit && (
                            <p className="limit-warning">Warning: Over credit limit!</p>
                        )}
                    </div>
                </div>

                {/* Main Content: Stats & History */}
                <div className="profile-main">
                    <div className="stats-row">
                        <div className="stat-box">
                            <ShoppingBag className="stat-icon purple" />
                            <div className="stat-info">
                                <label>Total Purchases</label>
                                <h3>₹{parseFloat(analytics.total_purchases).toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="stat-box text-blue">
                            <CreditCard className="stat-icon blue" />
                            <div className="stat-info">
                                <label>Total Paid</label>
                                <h3>₹{parseFloat(analytics.total_paid).toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="stat-box gold">
                            <History className="stat-icon gold" />
                            <div className="stat-info">
                                <label>Total Orders</label>
                                <h3>{analytics.order_count}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="card history-card">
                        <div className="tabs-header">
                            <h3 className="tab-title active">Recent Activity</h3>
                        </div>
                        <div className="history-list">
                            {transactions && transactions.length > 0 ? transactions.map((tx) => (
                                <div key={tx.id} className="history-item">
                                    <div className={`tx-icon-circle ${tx.type}`}>
                                        {tx.type === 'order' || tx.type === 'sale' ? <ShoppingBag size={18} /> : <CreditCard size={18} />}
                                    </div>
                                    <div className="tx-main">
                                        <p className="tx-title">
                                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} #{tx.id.slice(0, 8).toUpperCase()}
                                        </p>
                                        <div className="tx-meta">
                                            <Calendar size={12} /> {new Date(tx.transaction_date).toLocaleDateString()}
                                            <span className={`status-dot ${(tx.status || '').toLowerCase()}`}></span> {tx.status}
                                        </div>
                                    </div>
                                    <div className="tx-amount">
                                        <span className={tx.type === 'payment' ? 'text-success' : ''}>
                                            {tx.type === 'payment' ? '-' : ''}₹{parseFloat(tx.total_amount).toLocaleString()}
                                        </span>
                                        <button className="view-btn" onClick={() => navigate(`/dashboard/invoice/${tx.id}`)}>
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state">No transaction history found.</div>
                            )}
                        </div>
                    </div>

                    <div className="card notes-card">
                        <h3>Relationship Notes</h3>
                        <p>{customer.notes || 'No special notes for this customer yet.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
