import React from 'react';
import { Menu } from 'lucide-react';
import './Header.css';

const Header = ({ user, toggleSidebar }) => {
    return (
        <header className="header">
            <div className="breadcrumb">
                <button className="menu-btn" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="crumb-text">
                    <span className="text-gray-500">Dashboard</span>
                    <span className="separator">/</span>
                    <span className="active-crumb">Overview</span>
                </div>
            </div>

            <div className="header-right">
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
