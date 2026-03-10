import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    User, Lock, Save, AlertCircle, CheckCircle, Building, 
    MapPin, Globe, FileText, CreditCard, Bell, 
    Database, Link2, Palette, Shield, Activity, AlertTriangle, UserCircle, Settings as SettingsIcon
} from 'lucide-react';
import './StockList.css'; 
import './Settings.css'; 

const Settings = ({ user }) => {
    const [activeTab, setActiveTab] = useState('company_info');
    const [msg, setMsg] = useState({ type: '', text: '' });
    
    // User Form State
    const [userForm, setUserForm] = useState({
        full_name: '',
        email: '',
        new_password: '',
        confirm_password: ''
    });

    // Company Settings Form State
    const [companyForm, setCompanyForm] = useState({
        company_name: '',
        company_logo: '',
        gst_number: '',
        phone: '',
        email: '',
        website: '',
        company_address: '',
        currency: '₹',
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        language: 'English',
        invoice_prefix: 'INV-',
        invoice_footer: '',
        settings_json: {}
    });

    const [activityLogs, setActivityLogs] = useState([]);

    useEffect(() => {
        if (user) {
            setUserForm(prev => ({ ...prev, full_name: user.full_name || '', email: user.email || '' }));
            if (user.role === 'admin') {
                fetchCompanySettings();
                fetchActivityLogs();
            } else {
                setActiveTab('user_profile');
            }
        }
    }, [user]);

    const fetchCompanySettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data) setCompanyForm(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            const res = await api.get('/settings/logs');
            if (res.data) setActivityLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUserChange = (e) => {
        setUserForm({ ...userForm, [e.target.name]: e.target.value });
    };

    const handleCompanyChange = (e) => {
        setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                setMsg({ type: 'error', text: 'Logo size should be less than 2MB' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyForm(prev => ({ ...prev, company_logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const saveUserSettings = async () => {
        if (userForm.new_password && userForm.new_password !== userForm.confirm_password) {
            return setMsg({ type: 'error', text: 'Passwords do not match.' });
        }
        try {
            const payload = { full_name: userForm.full_name };
            if (userForm.new_password) payload.password = userForm.new_password;

            const res = await api.put('/auth/profile', payload);
            
            // Update local storage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...res.data }));

            setUserForm(prev => ({ ...prev, new_password: '', confirm_password: '' }));
            return true;
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to update personal profile.' });
            return false;
        }
    };

    const saveCompanySettings = async () => {
        try {
            await api.put('/settings', companyForm);
            window.dispatchEvent(new Event('company-settings-updated'));
            return true;
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to update company settings.' });
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        
        let success = false;
        if (activeTab === 'user_profile' || activeTab === 'security') {
            success = await saveUserSettings();
        } else if (user.role === 'admin' || user.role === 'super_admin') {
            success = await saveCompanySettings();
        }


        if (success) {
            setMsg({ type: 'success', text: 'Settings updated successfully!' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
            if (activeTab === 'activity_log') fetchActivityLogs();
        }
    };

    const TABS = [
        { id: 'company_info', label: 'Company Information', icon: <Building size={16}/>, adminOnly: true },
        { id: 'address', label: 'Address Details', icon: <MapPin size={16}/>, adminOnly: true },
        { id: 'business', label: 'Business Settings', icon: <Globe size={16}/>, adminOnly: true },
        { id: 'invoice', label: 'Invoice Settings', icon: <FileText size={16}/>, adminOnly: true },
        { id: 'user_profile', label: 'User Profile', icon: <UserCircle size={16}/>, adminOnly: false },
        { id: 'security', label: 'Security Settings', icon: <Lock size={16}/>, adminOnly: false },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'company_info':
                return (
                    <>
                        <h2 className="settings-section-title">Company Information</h2>
                        <p className="settings-section-desc">Manage primary business identity.</p>
                        <div className="settings-form-grid">
                            <div className="form-group full-width">
                                <label>Company Name</label>
                                <input type="text" name="company_name" value={companyForm.company_name} onChange={handleCompanyChange} />
                            </div>
                             <div className="form-group">
                                <label>Business Registration Number (GST/VAT)</label>
                                <input type="text" name="gst_number" value={companyForm.gst_number || ''} onChange={handleCompanyChange} />
                            </div>
                             <div className="form-group">
                                <label>Company Logo</label>
                                    <div className="logo-upload-box">
                                        <div className="logo-preview-circle">
                                            {companyForm.company_logo ? (
                                                <img src={companyForm.company_logo} alt="Logo" className="logo-img-preview" />
                                            ) : (
                                                <Building size={24} color="#94a3b8" />
                                            )}
                                        </div>
                                        <div className="logo-upload-controls">
                                            <label className="btn-upload-logo">
                                                <Activity size={14} /> Upload New Logo
                                                <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                            </label>
                                            {companyForm.company_logo && (
                                                <button type="button" className="btn-remove-logo" onClick={() => setCompanyForm(p => ({ ...p, company_logo: '' }))}>
                                                    Remove Image
                                                </button>
                                            )}
                                            <p className="upload-tip">PNG, JPG or SVG. Max 2MB.</p>
                                        </div>
                                    </div>

                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="text" name="phone" value={companyForm.phone || ''} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" name="email" value={companyForm.email || ''} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group full-width">
                                <label>Website URL</label>
                                <input type="url" name="website" value={companyForm.website || ''} onChange={handleCompanyChange} />
                            </div>
                        </div>
                    </>
                );
            case 'address':
                return (
                    <>
                        <h2 className="settings-section-title">Address Details</h2>
                        <p className="settings-section-desc">Registered operational address for billing.</p>
                        <div className="settings-form-grid">
                            <div className="form-group full-width">
                                <label>Complete Address</label>
                                <textarea 
                                    name="company_address" 
                                    rows={4}
                                    value={companyForm.company_address} 
                                    onChange={handleCompanyChange} 
                                />
                            </div>
                        </div>
                    </>
                );
            case 'business':
                return (
                    <>
                        <h2 className="settings-section-title">Business Settings</h2>
                        <p className="settings-section-desc">Localization configurations.</p>
                        <div className="settings-form-grid">
                            <div className="form-group">
                                <label>Primary Currency</label>
                                <select name="currency" value={companyForm.currency || '₹'} onChange={handleCompanyChange}>
                                    <option value="₹">Indian Rupee (₹)</option>
                                    <option value="$">US Dollar ($)</option>
                                    <option value="€">Euro (€)</option>
                                    <option value="£">British Pound (£)</option>
                                    <option value="¥">Japanese Yen (¥)</option>
                                    <option value="C$">Canadian Dollar (C$)</option>
                                    <option value="A$">Australian Dollar (A$)</option>
                                    <option value="AED">UAE Dirham (AED)</option>
                                    <option value="SAR">Saudi Riyal (SAR)</option>
                                    <option value="S$">Singapore Dollar (S$)</option>
                                    <option value="KWD">Kuwaiti Dinar (KWD)</option>
                                    <option value="CHF">Swiss Franc (CHF)</option>
                                    <option value="CNY">Chinese Yuan (CNY)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Timezone</label>
                                <select name="timezone" value={companyForm.timezone || 'Asia/Kolkata'} onChange={handleCompanyChange}>
                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    <option value="UTC">UTC Standard</option>
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="Europe/London">Greenwich Mean (GMT)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date Format</label>
                                <select name="date_format" value={companyForm.date_format || 'DD/MM/YYYY'} onChange={handleCompanyChange}>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>System Language</label>
                                <select name="language" value={companyForm.language || 'English'} onChange={handleCompanyChange}>
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Spanish">Spanish</option>
                                </select>
                            </div>
                        </div>
                    </>
                );
            case 'invoice':
                return (
                    <>
                        <h2 className="settings-section-title">Invoice Settings</h2>
                        <p className="settings-section-desc">Customize billing artifacts.</p>
                        <div className="settings-form-grid">
                            <div className="form-group">
                                <label>Invoice Prefix</label>
                                <input type="text" name="invoice_prefix" value={companyForm.invoice_prefix || 'INV-'} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group full-width">
                                <label>Invoice Footer Notes</label>
                                <textarea name="invoice_footer" rows={3} value={companyForm.invoice_footer || ''} onChange={handleCompanyChange} placeholder="T&C, Bank Details..." />
                            </div>
                        </div>
                    </>
                );
            case 'user_profile':
                return (
                    <>
                        <h2 className="settings-section-title">Personal Profile</h2>
                        <p className="settings-section-desc">Manage your account identity.</p>
                        <div className="settings-form-grid">
                            <div className="form-group full-width">
                                <label>Display Name</label>
                                <input type="text" name="full_name" value={userForm.full_name} onChange={handleUserChange} required />
                            </div>
                            <div className="form-group full-width">
                                <label>Email Address</label>
                                <input type="email" name="email" value={userForm.email} disabled />
                            </div>
                        </div>
                    </>
                );
            case 'security':
                return (
                    <>
                        <h2 className="settings-section-title">Security & Passwords</h2>
                        <p className="settings-section-desc">Update authentication credentials.</p>
                        <div className="settings-form-grid">
                            <div className="form-group full-width">
                                <label>New Password</label>
                                <input type="password" name="new_password" value={userForm.new_password} onChange={handleUserChange} placeholder="Leave blank to keep current" />
                            </div>
                            <div className="form-group full-width">
                                <label>Confirm New Password</label>
                                <input type="password" name="confirm_password" value={userForm.confirm_password} onChange={handleUserChange} />
                            </div>
                        </div>
                    </>
                );

            default:
                return (
                    <div className="placeholder-view">
                        <SettingsIcon size={48} color="#cbd5e1" style={{marginBottom: 16}} />
                        <h3 style={{fontSize: '1.2rem', color: '#475569', marginBottom: 8}}>Component Under Development</h3>
                        <p>The "{TABS.find(t => t.id === activeTab)?.label}" configuration panel is actively being implemented.</p>
                    </div>
                );
        }
    };

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Settings & Config</h1>
                    <p className="subtitle">Enterprise configuration and system health.</p>
                </div>
            </div>

            <div className="settings-layout">
                {/* Vertical Navigation Tab Sidebar */}
                <div className="settings-sidebar">
                    {TABS.filter(t => !t.adminOnly || (user?.role === 'admin' || user?.role === 'super_admin')).map((tab) => (
                        <div 
                            key={tab.id}
                            className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </div>
                    ))}
                </div>

                {/* Main Content Pane */}
                <div className="settings-content-area">
                    {msg.text && (
                        <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                            {msg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {renderTabContent()}

                        <div className="settings-actions">
                            <button type="submit" className="btn-save-settings">
                                <Save size={18} /> Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
