'use client';

import { FileText, DollarSign, CreditCard, PieChart, Plus } from 'lucide-react';

export default function FinancePage() {
    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Finance</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manage invoices, settlements, and credit notes.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary">
                        <Plus size={16} />
                        New Invoice
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-value">₹0.00</div>
                    <div className="stat-label">Total Collections</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <div className="stat-value">₹0.00</div>
                    <div className="stat-label">Pending Settlements</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="stat-value">₹0.00</div>
                    <div className="stat-label">Invoices Due</div>
                </div>

            </div>

            <div className="flex gap-6 mt-8">
                {/* Recent Invoices */}
                <div className="table-container" style={{ flex: 2 }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 600 }}>Recent Invoices</h3>
                        <button className="text-sm text-blue-600">View All</button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No recent invoices.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Quick Actions / Settlements */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 className="text-h3 mb-4">Credit Notes</h3>
                        <p className="text-gray-500 text-sm mb-4">Issue refunds or adjustments for returned stock.</p>
                        <button className="btn btn-outline" style={{ width: '100%' }}>Issue Credit Note</button>
                    </div>

                </div>
            </div>
        </div>
    );
}
