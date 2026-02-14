import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart,
    Users,
    ShoppingCart,
    CreditCard,
    UserCheck,
    Settings,
    LogOut,
    LayoutDashboard,
    Home,
    Store
} from 'lucide-react';
import './Sidebar.css';

import api from '../services/api';

const Sidebar = ({ user }) => {
    const role = user?.role;
    const permissions = user?.permissions || {};
    const [companyName, setCompanyName] = useState(localStorage.getItem('company_name') || 'Inventory Pro');

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data?.company_name) {
                    setCompanyName(res.data.company_name);
                    localStorage.setItem('company_name', res.data.company_name);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchSettings();

        const handleUpdate = () => fetchSettings();
        window.addEventListener('company-settings-updated', handleUpdate);
        return () => window.removeEventListener('company-settings-updated', handleUpdate);
    }, []);

    // Helper to check module view permission
    const canView = (module) => {
        if (role === 'admin' && (!permissions[module] || permissions[module].view !== false)) return true;
        return permissions[module]?.view === true;
    };

    return (
        <div className="sidebar">
            <div className="sidebar-brand">
                <LayoutDashboard size={28} color="#10b981" />
                <span className="brand-name">{companyName}</span>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/dashboard/home" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <Home size={20} />
                    <span>Dashboard</span>
                </NavLink>

                {canView('stock') && (
                    <NavLink to="/dashboard/stock" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <BarChart size={20} />
                        <span>Stock Management</span>
                    </NavLink>
                )}

                {canView('customers') && (
                    <NavLink to="/dashboard/customers" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <Users size={20} />
                        <span>Customers</span>
                    </NavLink>
                )}

                {canView('shops') && (
                    <NavLink to="/dashboard/shops" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <Store size={20} />
                        <span>Shops</span>
                    </NavLink>
                )}

                {canView('sales') && (
                    <NavLink to="/dashboard/sales" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <ShoppingCart size={20} />
                        <span>Sales & Orders</span>
                    </NavLink>
                )}

                {canView('finance') && (
                    <NavLink to="/dashboard/finance" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <CreditCard size={20} />
                        <span>Finance</span>
                    </NavLink>
                )}

                {canView('employees') && (
                    <NavLink to="/dashboard/employees" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <UserCheck size={20} />
                        <span>Employees</span>
                    </NavLink>
                )}

                <div className="border-t border-gray-100 my-4 mx-4"></div>

                {canView('settings') && (
                    <NavLink to="/dashboard/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </NavLink>
                )}

            </nav>

            <div className="sidebar-footer">
                <button className="nav-item logout-btn" onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
