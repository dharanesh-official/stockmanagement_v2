import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    User, Lock, Save, AlertCircle, CheckCircle, Building, 
    MapPin, Globe, FileText, CreditCard, Bell, 
    Database, Link2, Palette, Shield, Activity, AlertTriangle, UserCircle, Settings as SettingsIcon,
    Smartphone, Mail, Globe2, CreditCard as CardIcon, Laptop, Cloud, Share2, Printer
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
        const { name, value, type, checked } = e.target;
        if (name.startsWith('json_')) {
            const key = name.replace('json_', '');
            setCompanyForm({ 
                ...companyForm, 
                settings_json: { 
                    ...companyForm.settings_json, 
                    [key]: type === 'checkbox' ? checked : value 
                } 
            });
        } else {
            setCompanyForm({ ...companyForm, [name]: type === 'checkbox' ? checked : value });
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
        } else if (user.role === 'admin') {
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
        { id: 'payment', label: 'Payment Settings', icon: <CreditCard size={16}/>, adminOnly: true },
        { id: 'notification', label: 'Notification Settings', icon: <Bell size={16}/>, adminOnly: true },
        { id: 'user_profile', label: 'User Profile', icon: <UserCircle size={16}/>, adminOnly: false },
        { id: 'security', label: 'Security Settings', icon: <Lock size={16}/>, adminOnly: false },
        { id: 'system', label: 'System Settings', icon: <Shield size={16}/>, adminOnly: true },
        { id: 'data', label: 'Data Management', icon: <Database size={16}/>, adminOnly: true },
        { id: 'integrations', label: 'Integrations', icon: <Link2 size={16}/>, adminOnly: true },
        { id: 'branding', label: 'Branding', icon: <Palette size={16}/>, adminOnly: true },
        { id: 'account', label: 'Account Management', icon: <User size={16}/>, adminOnly: true },
        { id: 'activity_log', label: 'Activity Log', icon: <Activity size={16}/>, adminOnly: true },
        { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={16}/>, adminOnly: true },
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
                                <label>Company Logo URL</label>
                                <input type="text" name="company_logo" value={companyForm.company_logo || ''} onChange={handleCompanyChange} placeholder="https://..." />
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
            case 'activity_log':
                return (
                    <>
                        <h2 className="settings-section-title">Activity Log</h2>
                        <p className="settings-section-desc">Recent administrative actions across the platform.</p>
                        <div className="activity-list">
                            {activityLogs.map((log) => (
                                <div key={log.id} className="activity-item">
                                    <div className="activity-icon"><Activity size={18}/></div>
                                    <div className="activity-meta">
                                        <div className="activity-action">{log.action}</div>
                                        <div className="activity-user">{log.full_name || 'System'} • {log.ip_address}</div>
                                    </div>
                                    <div className="activity-time">{new Date(log.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                            {activityLogs.length === 0 && <p className="placeholder-view">No audit records found.</p>}
                        </div>
                    </>
                );
            case 'danger':
                return (
                    <>
                        <h2 className="settings-section-title" style={{color: '#b91c1c'}}>Danger Zone</h2>
                        <p className="settings-section-desc">Irreversible organizational actions.</p>
                        <div className="danger-zone">
                            <div className="danger-item">
                                <div className="danger-info">
                                    <h4>Factory Reset Database</h4>
                                    <p>Clears all transactions, orders, and logs. Does not delete products.</p>
                                </div>
                                <button type="button" className="btn-danger" onClick={() => alert('Feature strictly disabled in current branch')}>Wipe Data</button>
                            </div>
                        </div>
                    </>
                );
            case 'payment':
                return (
                    <>
                        <h2 className="settings-section-title">Payment Gateways</h2>
                        <p className="settings-section-desc">Configure billing and transaction processors.</p>
                        <div className="settings-form-grid">
                            <div className="full-width">
                                <div className="toggle-row">
                                    <div className="toggle-info">
                                        <h4>Enable UPI Payments</h4>
                                        <p>Allow customers to pay via QR codes on invoices.</p>
                                    </div>
                                    <input type="checkbox" name="json_enable_upi" checked={companyForm.settings_json?.enable_upi || false} onChange={handleCompanyChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>UPI ID (VPA)</label>
                                <input type="text" name="json_upi_id" value={companyForm.settings_json?.upi_id || ''} onChange={handleCompanyChange} placeholder="company@upi" />
                            </div>
                            <div className="form-group">
                                <label>Bank Account Number</label>
                                <input type="text" name="json_bank_account" value={companyForm.settings_json?.bank_account || ''} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label>IFSC Code</label>
                                <input type="text" name="json_ifsc" value={companyForm.settings_json?.ifsc || ''} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label>Payment Terms (Days)</label>
                                <input type="number" name="json_payment_terms" value={companyForm.settings_json?.payment_terms || 30} onChange={handleCompanyChange} />
                            </div>
                        </div>
                    </>
                );
            case 'notification':
                return (
                    <>
                        <h2 className="settings-section-title">Notifications</h2>
                        <p className="settings-section-desc">Manage system alerts and automated messaging.</p>
                        <div className="activity-list">
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <h4>Email Alerts</h4>
                                    <p>Send transaction receipts and low stock alerts via email.</p>
                                </div>
                                <input type="checkbox" name="json_notify_email" checked={companyForm.settings_json?.notify_email || false} onChange={handleCompanyChange} />
                            </div>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <h4>WhatsApp Integration</h4>
                                    <p>Send order confirmations directly to customer WhatsApp.</p>
                                </div>
                                <input type="checkbox" name="json_notify_whatsapp" checked={companyForm.settings_json?.notify_whatsapp || false} onChange={handleCompanyChange} />
                            </div>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <h4>Browser Push Notifications</h4>
                                    <p>Real-time updates for sales and warehouse activity.</p>
                                </div>
                                <input type="checkbox" name="json_notify_push" checked={companyForm.settings_json?.notify_push || false} onChange={handleCompanyChange} />
                            </div>
                        </div>
                    </>
                );
            case 'system':
                return (
                    <>
                        <h2 className="settings-section-title">System Configuration</h2>
                        <p className="settings-section-desc">Advanced technical and performance controls.</p>
                        <div className="settings-form-grid">
                            <div className="full-width">
                                <div className="toggle-row">
                                    <div className="toggle-info">
                                        <h4>Maintenance Mode</h4>
                                        <p>Disable client access for scheduled system updates.</p>
                                    </div>
                                    <input type="checkbox" name="json_maint_mode" checked={companyForm.settings_json?.maint_mode || false} onChange={handleCompanyChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Session Timeout (Minutes)</label>
                                <input type="number" name="json_session_timeout" value={companyForm.settings_json?.session_timeout || 60} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label>Auto-Backup Frequency</label>
                                <select name="json_backup_freq" value={companyForm.settings_json?.backup_freq || 'daily'} onChange={handleCompanyChange}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                    </>
                );
            case 'data':
                return (
                    <>
                        <h2 className="settings-section-title">Data Management</h2>
                        <p className="settings-section-desc">Export, import, and archiving tools.</p>
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-icon" style={{color: '#059669'}}><Share2 size={18}/></div>
                                <div className="activity-meta">
                                    <div className="activity-action">Full Database Export</div>
                                    <div className="activity-user">Download all organizational data in SQL/CSV format.</div>
                                </div>
                                <button type="button" className="btn-save-settings" style={{padding: '8px 16px', fontSize: '12px'}}>Export Now</button>
                            </div>
                            <div className="activity-item">
                                <div className="activity-icon" style={{color: '#0284c7'}}><Cloud size={18}/></div>
                                <div className="activity-meta">
                                    <div className="activity-action">Cloud Sync Identity</div>
                                    <div className="activity-user">Manage distributed warehouse synchronization.</div>
                                </div>
                                <button type="button" className="btn-save-settings" style={{padding: '8px 16px', fontSize: '12px', background: '#64748b'}}>Configure</button>
                            </div>
                        </div>
                    </>
                );
            case 'integrations':
                return (
                    <>
                        <h2 className="settings-section-title">External Integrations</h2>
                        <p className="settings-section-desc">Bridge with third-party business applications.</p>
                        <div className="settings-form-grid">
                            <div className="form-group flex items-center justify-between full-width p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 style={{fontWeight: 700, margin: 0}}>Zapier Connector</h4>
                                    <p style={{fontSize: '0.8rem', color: '#64748b', margin: 0}}>Streamline workflows through Zapier automation.</p>
                                </div>
                                <span className="badge-payment" style={{background: '#f1f5f9', color: '#64748b'}}>READY TO SETUP</span>
                            </div>
                            <div className="form-group">
                                <label>API Key for Custom Hooks</label>
                                <input type="password" value="************************" disabled />
                            </div>
                            <div className="form-group">
                                <label>Webhook URL</label>
                                <input type="text" name="json_webhook_url" value={companyForm.settings_json?.webhook_url || ''} onChange={handleCompanyChange} placeholder="https://endpoint..." />
                            </div>
                        </div>
                    </>
                );
            case 'branding':
                return (
                    <>
                        <h2 className="settings-section-title">White-Label Branding</h2>
                        <p className="settings-section-desc">Customize themes and portal aesthetics.</p>
                        <div className="settings-form-grid">
                            <div className="form-group">
                                <label>Primary Theme Color</label>
                                <input type="color" name="json_theme_color" value={companyForm.settings_json?.theme_color || '#059669'} onChange={handleCompanyChange} style={{height: '42px'}} />
                            </div>
                            <div className="form-group">
                                <label>Sidebar Mode</label>
                                <select name="json_sidebar_mode" value={companyForm.settings_json?.sidebar_mode || 'expanded'} onChange={handleCompanyChange}>
                                    <option value="expanded">Always Visible</option>
                                    <option value="collapsed">Compact View</option>
                                </select>
                            </div>
                            <div className="full-width">
                                <div className="toggle-row">
                                    <div className="toggle-info">
                                        <h4>Show Powered By</h4>
                                        <p>Toggle system credits in footer.</p>
                                    </div>
                                    <input type="checkbox" name="json_show_credits" checked={companyForm.settings_json?.show_credits !== false} onChange={handleCompanyChange} />
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 'account':
                return (
                    <>
                        <h2 className="settings-section-title">Account Management</h2>
                        <p className="settings-section-desc">Subscription and organizational tier control.</p>
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-icon"><Shield size={18}/></div>
                                <div className="activity-meta">
                                    <div className="activity-action">Enterprise Tier</div>
                                    <div className="activity-user">Unlimited users, stores, and transactions.</div>
                                </div>
                                <div style={{fontWeight: 'bold', color: '#059669'}}>LIFETIME LICENSE</div>
                            </div>
                        </div>
                    </>
                );
            default:
                return (
                    <div className="placeholder-view">
                        <SettingsIcon size={48} color="#cbd5e1" style={{marginBottom: 16}} />
                        <h3 style={{fontSize: '1.2rem', color: '#475569', marginBottom: 8}}>Module Loading...</h3>
                        <p>If this persists, the requested configuration panel is unavailable in this version.</p>
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
                    {TABS.filter(t => !t.adminOnly || user?.role === 'admin').map((tab) => (
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

                        {/* Hide save button on purely informational tabs */}
                        {!['activity_log', 'danger'].includes(activeTab) && activeTab !== 'system' && activeTab !== 'data' && activeTab !== 'integrations' && activeTab !== 'branding' && activeTab !== 'account' && activeTab !== 'notification' && activeTab !== 'payment' && (
                            <div className="settings-actions">
                                <button type="submit" className="btn-save-settings">
                                    <Save size={18} /> Save Settings
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
