import { Shield, Clock, AlertTriangle } from 'lucide-react';

export default function AuditPage() {
    const logs: any[] = []; // Data cleared

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Security Audit Log</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Track all system activities and security events.</p>
                </div>
                <button className="btn-primary" style={{ backgroundColor: '#4b5563' }}>
                    <DownloadIcon size={16} />
                    Download Logs
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th>IP Address</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No audit logs available.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                {log.user.charAt(0)}
                                            </div>
                                            {log.user}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 500, color: log.action.includes('Delete') ? '#dc2626' : 'inherit' }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.target}</td>
                                    <td style={{ color: '#6b7280', fontSize: '0.8rem' }}>{log.ip}</td>
                                    <td style={{ color: '#6b7280', fontSize: '0.8rem' }}>{log.time}</td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DownloadIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}
