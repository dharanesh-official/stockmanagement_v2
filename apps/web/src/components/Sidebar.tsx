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
    Truck,
    Shield,
    Box,
    LogOut,
    Globe,
    DollarSign,
    Store,
    FileText
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
        // Simple JWT decode to get role without external libs
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
                // Also try to get name if available, otherwise default
                if (payload.name) setUserName(payload.name);
                else {
                    // Fallback visual names based on role
                    if (payload.role === 'SUPER_ADMIN') setUserName('Vikram Malhotra');
                    if (payload.role === 'BRAND_ADMIN') setUserName('Rahul Verma');
                    if (payload.role === 'WAREHOUSE_MANAGER' || payload.role === 'WAREHOUSE') setUserName('Suresh Kumar');
                    if (payload.role === 'FINANCE_MANAGER') setUserName('Priya Das');
                }
            } catch (e) {
                console.error('Failed to parse token', e);
            }
        }
    }, []);

    // Helper to check active state
    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        router.push('/');
    };

    // RBAC Configuration
    const hasAccess = (itemRole: string[]) => {
        if (!userRole) return false; // meaningful default

        let normalizedRole = userRole;
        if (userRole === 'WAREHOUSE') normalizedRole = 'WAREHOUSE_MANAGER';

        if (normalizedRole === 'SUPER_ADMIN') return true; // Super admin sees all
        return itemRole.includes(normalizedRole);
    };

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
            {/* Brand Header */}
            <div className="sidebar-header">
                <Link href="/dashboard" className="brand-logo">
                    <div className="brand-icon">
                        <Box size={20} />
                    </div>
                    <span>StockPro Inventory</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">Main Menu</div>

                {!hasAccess(['FINANCE_MANAGER']) && (
                    <Link href="/dashboard" onClick={onClose} className={`nav-item ${isActive('/dashboard') && !isActive('/dashboard/inventory') ? 'active' : ''}`}>
                        <LayoutDashboard className="nav-icon" />
                        <span>Dashboard</span>
                    </Link>
                )}

                {hasAccess(['SALES_PERSON']) && (
                    <Link href="/dashboard/my-shops" onClick={onClose} className={`nav-item ${isActive('/dashboard/my-shops') ? 'active' : ''}`}>
                        <Store className="nav-icon" />
                        <span>My Shops</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER']) && (
                    <Link href="/dashboard/inventory" onClick={onClose} className={`nav-item ${isActive('/dashboard/inventory') ? 'active' : ''}`}>
                        <Package className="nav-icon" />
                        <span>Inventory</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'WAREHOUSE_MANAGER']) && (
                    <Link href="/dashboard/stock" onClick={onClose} className={`nav-item ${isActive('/dashboard/stock') ? 'active' : ''}`}>
                        <Box className="nav-icon" />
                        <span>Stock Management</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'BRAND_ADMIN', 'SALES_PERSON']) && (
                    <Link href="/dashboard/orders" onClick={onClose} className={`nav-item ${isActive('/dashboard/orders') ? 'active' : ''}`}>
                        <ShoppingCart className="nav-icon" />
                        <span>Orders</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'BRAND_ADMIN', 'SALES_PERSON', 'FINANCE_MANAGER']) && (
                    <Link href="/dashboard/invoices" onClick={onClose} className={`nav-item ${isActive('/dashboard/invoices') ? 'active' : ''}`}>
                        <FileText className="nav-icon" />
                        <span>Invoices</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'BRAND_ADMIN', 'SALES_PERSON']) && (
                    <Link href="/dashboard/customers" onClick={onClose} className={`nav-item ${isActive('/dashboard/customers') ? 'active' : ''}`}>
                        <Users className="nav-icon" />
                        <span>Customers</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'BRAND_ADMIN', 'FINANCE_MANAGER']) && (
                    <Link href="/dashboard/reports" onClick={onClose} className={`nav-item ${isActive('/dashboard/reports') ? 'active' : ''}`}>
                        <BarChart3 className="nav-icon" />
                        <span>Reports & Analytics</span>
                    </Link>
                )}

                <div className="nav-section-label">Management</div>

                {hasAccess(['SUPER_ADMIN']) && (
                    <Link href="/dashboard/brands" onClick={onClose} className={`nav-item ${isActive('/dashboard/brands') ? 'active' : ''}`}>
                        <Globe className="nav-icon" />
                        <span>Brands</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'WAREHOUSE_MANAGER']) && (
                    <Link href="/dashboard/warehouses" onClick={onClose} className={`nav-item ${isActive('/dashboard/warehouses') ? 'active' : ''}`}>
                        <Truck className="nav-icon" />
                        <span>Warehouses</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER']) && (
                    <Link href="/dashboard/shops" onClick={onClose} className={`nav-item ${isActive('/dashboard/shops') ? 'active' : ''}`}>
                        <Store className="nav-icon" />
                        <span>Shops</span>
                    </Link>
                )}

                {hasAccess(['SUPER_ADMIN', 'BRAND_ADMIN']) && (
                    <Link href="/dashboard/users" onClick={onClose} className={`nav-item ${isActive('/dashboard/users') ? 'active' : ''}`}>
                        <Users className="nav-icon" />
                        <span>{userRole === 'BRAND_ADMIN' ? 'Salespersons' : 'User Management'}</span>
                    </Link>
                )}

                {hasAccess(['FINANCE_MANAGER']) && (
                    <Link href="/dashboard/finance" onClick={onClose} className={`nav-item ${isActive('/dashboard/finance') ? 'active' : ''}`}>
                        <DollarSign className="nav-icon" />
                        <span>Finance & Tax</span>
                    </Link>
                )}

                <div className="nav-section-label">System</div>

                {hasAccess(['SUPER_ADMIN']) && (
                    <Link href="/dashboard/audit" onClick={onClose} className={`nav-item ${isActive('/dashboard/audit') ? 'active' : ''}`}>
                        <Shield className="nav-icon" />
                        <span>Audit Logs</span>
                    </Link>
                )}

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
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
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
