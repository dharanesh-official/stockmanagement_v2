'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Package,
    LayoutDashboard,
    ShoppingCart,
    Users,
    Settings,
    BarChart3,
    Box,
    LogOut,
    DollarSign,
    FileText,
    X,
    ClipboardList
} from 'lucide-react';

interface SidebarProps {
    mobileOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
                if (payload.fullName) setUserName(payload.fullName);
                else setUserName(payload.role === 'ADMIN' ? 'Administrator' : 'Sales Person');
            } catch (e) {
                console.error('Failed to parse token', e);
            }
        }
    }, []);

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        router.push('/');
    };

    const isAdmin = userRole === 'ADMIN';
    const isSales = userRole === 'SALES_PERSON';

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
            {/* Brand Header */}
            <div className="sidebar-header">
                <Link href="/dashboard" className="brand-logo">
                    <div className="brand-icon">
                        <Box size={20} />
                    </div>
                    <span>StockPro</span>
                </Link>
                <button
                    className="mobile-only btn-icon"
                    onClick={onClose}
                    style={{ marginLeft: 'auto', color: '#6b7280' }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">Main Menu</div>

                <Link href="/dashboard" onClick={onClose} className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
                    <LayoutDashboard className="nav-icon" />
                    <span>Dashboard</span>
                </Link>

                <Link href="/dashboard/inventory" onClick={onClose} className={`nav-item ${isActive('/dashboard/inventory') ? 'active' : ''}`}>
                    <Package className="nav-icon" />
                    <span>Products</span>
                </Link>

                <Link href="/dashboard/stock" onClick={onClose} className={`nav-item ${isActive('/dashboard/stock') ? 'active' : ''}`}>
                    <ClipboardList className="nav-icon" />
                    <span>Stock Control</span>
                </Link>

                <Link href="/dashboard/orders" onClick={onClose} className={`nav-item ${isActive('/dashboard/orders') ? 'active' : ''}`}>
                    <ShoppingCart className="nav-icon" />
                    <span>Orders</span>
                </Link>

                <Link href="/dashboard/invoices" onClick={onClose} className={`nav-item ${isActive('/dashboard/invoices') ? 'active' : ''}`}>
                    <FileText className="nav-icon" />
                    <span>Invoices</span>
                </Link>

                <Link href="/dashboard/customers" onClick={onClose} className={`nav-item ${isActive('/dashboard/customers') ? 'active' : ''}`}>
                    <Users className="nav-icon" />
                    <span>Customers</span>
                </Link>

                <div className="nav-section-label">Finance & Reports</div>

                <Link href="/dashboard/finance" onClick={onClose} className={`nav-item ${isActive('/dashboard/finance') ? 'active' : ''}`}>
                    <DollarSign className="nav-icon" />
                    <span>Payments</span>
                </Link>

                <Link href="/dashboard/reports" onClick={onClose} className={`nav-item ${isActive('/dashboard/reports') ? 'active' : ''}`}>
                    <BarChart3 className="nav-icon" />
                    <span>Reports</span>
                </Link>

                {isAdmin && (
                    <>
                        <div className="nav-section-label">Administration</div>
                        <Link href="/dashboard/users" onClick={onClose} className={`nav-item ${isActive('/dashboard/users') ? 'active' : ''}`}>
                            <Users className="nav-icon" />
                            <span>Users</span>
                        </Link>
                    </>
                )}

                <div className="nav-section-label">System</div>
                <Link href="/dashboard/settings" onClick={onClose} className={`nav-item ${isActive('/dashboard/settings') ? 'active' : ''}`}>
                    <Settings className="nav-icon" />
                    <span>Settings</span>
                </Link>
            </nav>

            {/* Footer User Profile */}
            <div className="sidebar-footer">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="user-profile-mini" style={{ flex: 1 }}>
                        <div className="user-avatar" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isAdmin ? '#fecaca' : '#e0e7ff',
                            color: isAdmin ? '#991b1b' : '#4338ca',
                            fontWeight: 'bold'
                        }}>
                            {userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <h4>{userName}</h4>
                            <p style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{userRole ? userRole.replace('_', ' ').toLowerCase() : 'Guest'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Sign Out"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            color: '#ef4444',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s',
                            marginLeft: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
