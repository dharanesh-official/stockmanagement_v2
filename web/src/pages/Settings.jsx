import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import './StockList.css'; // Inheriting basic layout
import './Settings.css'; // New Styles

const Settings = ({ user }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        current_password: '', // Kept for logic if needed later
        new_password: '',
        confirm_password: ''
    });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [companyData, setCompanyData] = useState({ company_name: '', company_address: '' });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, full_name: user.full_name || '', email: user.email || '' }));
            if (user.role === 'admin') fetchCompanySettings();
        }
    }, [user]);

    const fetchCompanySettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data) setCompanyData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCompanyChange = (e) => {
        setCompanyData({ ...companyData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        if (formData.new_password && formData.new_password !== formData.confirm_password) {
            setMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            const payload = { full_name: formData.full_name };
            if (formData.new_password) payload.password = formData.new_password;

            const res = await api.put('/auth/profile', payload);

            if (user.role === 'admin') {
                await api.put('/settings', companyData);
                window.dispatchEvent(new Event('company-settings-updated'));
            }

            setMsg({ type: 'success', text: 'Settings updated successfully!' });

            // Update local storage user info
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...storedUser, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Optional: reset password fields
            setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));

            // Auto hide success msg
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Account Settings</h1>
                    <p className="subtitle">Update your profile and security preferences.</p>
                </div>
            </div>

            <div className="settings-container">
                {msg.text && (
                    <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                        {msg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {user && user.role === 'admin' && (
                        <>
                            <div className="settings-group">
                                <div className="settings-group-title">
                                    <User size={20} color="#10b981" /> Company Information
                                </div>
                                <div className="form-input-container">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={companyData.company_name}
                                        onChange={handleCompanyChange}
                                        placeholder="Enter company name"
                                    />
                                </div>
                                <div className="form-input-container">
                                    <label>Company Address</label>
                                    <input
                                        type="text"
                                        name="company_address"
                                        value={companyData.company_address}
                                        onChange={handleCompanyChange}
                                        placeholder="Enter company address"
                                    />
                                </div>
                            </div>
                            <div className="separator"></div>
                        </>
                    )}

                    <div className="settings-group">
                        <div className="settings-group-title">
                            <User size={20} color="#10b981" /> Personal Information
                        </div>

                        <div className="form-input-container">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-input-container">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                            />
                            <p className="form-hint">Email address cannot be changed.</p>
                        </div>
                    </div>

                    <div className="separator"></div>

                    <div className="settings-group">
                        <div className="settings-group-title">
                            <Lock size={20} color="#10b981" /> Security
                        </div>
                        <div className="form-input-container">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={formData.new_password}
                                onChange={handleChange}
                                placeholder="Leave blank to keep current"
                            />
                        </div>
                        <div className="form-input-container">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div className="action-row">
                        <button type="submit" className="btn-save">
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
