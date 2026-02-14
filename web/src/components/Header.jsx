import React from 'react';
import { Bell, Search } from 'lucide-react';
import './Header.css';
import './Header.css';

const Header = ({ user }) => {
    return (
        <header className="header">
            <div className="breadcrumb">
                <span className="text-gray-500">Dashboard</span>
                <span className="separator">/</span>
                <span className="active-crumb">Overview</span>
            </div>

            <div className="header-right">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search..." />
                </div>
                <button className="icon-btn-header">
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>
                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-name">{user.full_name || 'User'}</span>
                        <span className="user-role">{user.role === 'admin' ? 'Brand Admin' : 'Sales Associate'}</span>
                    </div>

                </div>
            </div>
        </header>
    );
};

export default Header;
