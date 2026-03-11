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

import { X } from 'lucide-react'; // Import X icon
import { hasPermission } from '../utils/permissions';

const Sidebar = ({ user, isOpen, closeSidebar }) => {
    const role = user?.role;
    const permissions = user?.permissions || {};
    const [companyName, setCompanyName] = useState(localStorage.getItem('company_name') || 'Inventory Pro');
    const [logo, setLogo] = useState(localStorage.getItem('company_logo') || '');

    React.useEffect(() => {
        // ... kept same
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data?.company_name) {
                    setCompanyName(res.data.company_name);
                    localStorage.setItem('company_name', res.data.company_name);
                }
                if (res.data?.company_logo) {
                    setLogo(res.data.company_logo);
                    localStorage.setItem('company_logo', res.data.company_logo);
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


    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-container">
                        {logo ? (
                            <div className="sidebar-logo-wrapper">
                                <img src={logo} alt="Logo" className="sidebar-logo-img" />
                            </div>
                        ) : (
                            <LayoutDashboard size={28} className="sidebar-default-icon" />
                        )}
                        <span className="brand-name">{companyName}</span>
                    </div>
                    <button className="sidebar-close-btn" onClick={closeSidebar}>

                        <X size={24} />
                    </button>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard/home" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                        <Home size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    {hasPermission(user, 'stock', 'view') && (
                        <NavLink to="/dashboard/stock" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <BarChart size={20} />
                            <span>Stock Management</span>
                        </NavLink>
                    )}

                    {hasPermission(user, 'customers', 'view') && (
                        <NavLink to="/dashboard/customers" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <Users size={20} />
                            <span>Customers</span>
                        </NavLink>
                    )}

                    {hasPermission(user, 'shops', 'view') && (
                        <NavLink to="/dashboard/shops" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <Store size={20} />
                            <span>Shops</span>
                        </NavLink>
                    )}

                    {hasPermission(user, 'sales', 'view') && (
                        <NavLink to="/dashboard/sales" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <ShoppingCart size={20} />
                            <span>Sales & Orders</span>
                        </NavLink>
                    )}

                    {hasPermission(user, 'finance', 'view') && (
                        <NavLink to="/dashboard/finance" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <CreditCard size={20} />
                            <span>Finance</span>
                        </NavLink>
                    )}

                    {hasPermission(user, 'employees', 'view') && (
                        <NavLink to="/dashboard/employees" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <UserCheck size={20} />
                            <span>Employees</span>
                        </NavLink>
                    )}

                    <div className="border-t border-gray-100 my-4 mx-4"></div>

                    {hasPermission(user, 'settings', 'view') && (
                        <NavLink to="/dashboard/settings" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
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
        </>
    );
};

export default Sidebar;
