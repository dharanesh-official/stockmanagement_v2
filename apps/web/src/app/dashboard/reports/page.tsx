import { FileText, Download, Filter } from 'lucide-react';

export default function ReportsPage() {
    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Financial Reports</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>View earnings, expenses, and inventory value.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="action-btn" style={{ border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                        <Filter size={16} />
                    </button>
                    <button className="btn-primary">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="stat-value">₹0</div>
                    <div className="stat-label">Total Inventory Value</div>
                    <div className="stat-trend trend-up">
                        --
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="stat-value">₹0</div>
                    <div className="stat-label">Monthly Revenue</div>
                    <div className="stat-trend trend-up">
                        --
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="stat-value">0</div>
                    <div className="stat-label">Units Sold</div>
                    <div className="stat-trend trend-down">
                        --
                    </div>
                </div>
            </div>

            <div className="table-container" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <FileText size={48} color="#e5e7eb" style={{ margin: '0 auto', display: 'block' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>No Reports Available</h3>
                <p>Select a date range to generate detailed reports.</p>
            </div>
        </div>
    );
}
