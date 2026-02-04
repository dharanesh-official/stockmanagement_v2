'use client';

import { useState } from 'react';
import { Save, Bell, Lock, User, CreditCard } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Platform Settings</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Configure your account and brand preferences.</p>
                </div>
            </div>

            <div className="settings-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexDirection: 'row' }}>
                {/* Settings Sidebar */}
                <div style={{ width: '240px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', fontWeight: '600', fontSize: '0.875rem' }}>General</div>

                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                                color: activeTab === tab.id ? '#2563eb' : '#4b5563',
                                borderLeft: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                                fontSize: '0.875rem',
                                fontWeight: activeTab === tab.id ? '500' : '400',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </div>
                    ))}
                </div>

                {/* Dynamic Content */}
                <div className="form-card" style={{ flex: 1 }}>
                    {activeTab === 'profile' && <ProfileForm />}
                    {activeTab === 'security' && <SecurityForm />}
                    {activeTab === 'notifications' && <NotificationsForm />}
                    {activeTab === 'billing' && <BillingForm />}
                </div>
            </div>
        </div>
    );
}

function ProfileForm() {
    return (
        <>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Profile Information</h3>

            <div className="form-group">
                <label>Full Name</label>
                <input type="text" defaultValue="Vikram Malhotra" />
            </div>

            <div className="form-group">
                <label>Email Address</label>
                <input type="email" defaultValue="admin@stockpro.com" disabled style={{ backgroundColor: '#f3f4f6' }} />
            </div>

            <div className="form-group">
                <label>Role</label>
                <input type="text" defaultValue="SUPER_ADMIN" disabled style={{ backgroundColor: '#f3f4f6' }} />
            </div>

            <div className="form-group">
                <label>Bio</label>
                <textarea rows={4} placeholder="Enter a brief bio..."></textarea>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary">
                    <Save size={16} />
                    Save Changes
                </button>
            </div>
        </>
    )
}

function SecurityForm() {
    return (
        <>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Security Settings</h3>

            <div className="form-group">
                <label>Current Password</label>
                <input type="password" placeholder="••••••••" />
            </div>

            <div className="form-settings-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>New Password</label>
                    <input type="password" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Confirm Password</label>
                    <input type="password" />
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h4 style={{ fontWeight: '600', fontSize: '0.875rem' }}>Two-Factor Authentication</h4>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Add an extra layer of security to your account.</p>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} />
                        <span className="slider" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ccc', borderRadius: '34px', transition: '.4s' }}></span>
                        <span className="slider-knob" style={{ position: 'absolute', content: '', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
                    </label>
                </div>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary">
                    <Save size={16} />
                    Update Password
                </button>
            </div>
        </>
    )
}

function NotificationsForm() {
    return (
        <>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Notification Preferences</h3>

            {['Email Notifications', 'Push Notifications', 'Weekly Reports', 'Security Alerts'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                        <h4 style={{ fontWeight: '500', fontSize: '0.875rem' }}>{item}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Receive updates about {item.toLowerCase()}.</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>
            ))}

            <div style={{ paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary">
                    <Save size={16} />
                    Save Preferences
                </button>
            </div>
        </>
    )
}

function BillingForm() {
    return (
        <>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Billing & Subscription</h3>

            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', color: 'white', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Current Plan</div>
                <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Enterprise</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Renews on Mar 1, 2026</div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Payment Method</h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                    <CreditCard size={24} color="#374151" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>•••• •••• •••• 4242</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Expires 12/28</div>
                </div>
                <button style={{ color: '#2563eb', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Billing History</h4>
            <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                    <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ paddingBottom: '0.5rem' }}>Date</th>
                        <th style={{ paddingBottom: '0.5rem' }}>Amount</th>
                        <th style={{ paddingBottom: '0.5rem' }}>Status</th>
                        <th style={{ paddingBottom: '0.5rem' }}>Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: '0.75rem 0' }}>Feb 1, 2026</td>
                        <td>₹24,999</td>
                        <td><span style={{ color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600' }}>Paid</span></td>
                        <td><a href="#" style={{ color: '#2563eb' }}>PDF</a></td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}
