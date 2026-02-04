import { Plus, MoreHorizontal, MapPin } from 'lucide-react';

export default function WarehousesPage() {
    const warehouses: any[] = []; // Data cleared

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Warehouses</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Monitor inventory locations and capacity.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" style={{ backgroundColor: '#059669' }}>
                        <Plus size={16} />
                        Receive Stock
                    </button>
                    <button className="btn-primary">
                        <Plus size={16} />
                        Add Warehouse
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Location</th>
                            <th>Capacity</th>
                            <th>Manager</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {warehouses.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No warehouses registered.
                                </td>
                            </tr>
                        ) : (
                            warehouses.map(wh => (
                                <tr key={wh.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{wh.name}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={14} color="#6b7280" />
                                            {wh.location}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '60px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: wh.capacity, height: '100%', background: parseInt(wh.capacity) > 80 ? '#ef4444' : '#10b981' }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem' }}>{wh.capacity}</span>
                                        </div>
                                    </td>
                                    <td>{wh.manager}</td>
                                    <td>
                                        <span className={`status-badge ${wh.status === 'Operational' ? 'status-active' : 'status-warning'}`}>
                                            {wh.status}
                                        </span>
                                    </td>
                                    <td><button className="action-btn"><MoreHorizontal size={16} /></button></td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
