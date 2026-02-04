'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import '../dashboard.css';
import './tables.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="dashboard-container">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={closeSidebar}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 90,
                        backdropFilter: 'blur(4px)'
                    }}
                />
            )}

            <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />

            <div className="main-wrapper">
                <Header onMenuClick={toggleSidebar} />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
