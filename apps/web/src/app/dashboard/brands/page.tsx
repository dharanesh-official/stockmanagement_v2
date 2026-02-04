import { Plus, ShieldCheck, Globe } from 'lucide-react';

export default function BrandsPage() {
    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Brand Management</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manage tenant brands and their configurations.</p>
                </div>
                <button className="btn-primary">
                    <Plus size={16} />
                    Onboard New Brand
                </button>
            </div>

            <div className="stats-grid">
                {/* Placeholder for brand stats can go here if needed */}
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Brand Name</th>
                            <th>Slug</th>
                            <th>Admin</th>
                            <th>Status</th>
                            <th>Locations</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <Globe size={48} color="#e5e7eb" />
                                    <p>No brands onboarded yet.</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
