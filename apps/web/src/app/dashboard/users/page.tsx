import { UserPlus, MoreHorizontal } from 'lucide-react';

export default function UsersPage() {
    const users: any[] = []; // Data cleared

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>User Management</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manage system access and roles.</p>
                </div>
                <button className="btn-primary">
                    <UserPlus size={16} />
                    Add User
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td><span className="status-badge status-pending" style={{ fontSize: '0.7rem' }}>{user.role}</span></td>
                                    <td><span className="status-badge status-active">{user.status}</span></td>
                                    <td style={{ color: '#6b7280' }}>{user.lastLogin}</td>
                                    <td><button className="action-btn"><MoreHorizontal size={16} /></button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
