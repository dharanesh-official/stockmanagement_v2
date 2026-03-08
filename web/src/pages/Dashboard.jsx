import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load pages
const StockList = lazy(() => import('./StockList'));
const CustomerList = lazy(() => import('./CustomerList'));
const SalesList = lazy(() => import('./SalesList'));
const Finance = lazy(() => import('./Finance'));
const Employees = lazy(() => import('./Employees'));
const Settings = lazy(() => import('./Settings'));
const DashboardHome = lazy(() => import('./DashboardHome'));
const Shops = lazy(() => import('./Shops'));
const CreateOrder = lazy(() => import('./CreateOrder'));
const Invoice = lazy(() => import('./Invoice'));
const OrderDetails = lazy(() => import('./OrderDetails'));
const CustomerProfile = lazy(() => import('./CustomerProfile'));
const CustomerLedger = lazy(() => import('./CustomerLedger'));

import api from '../services/api'; // Or context
import './Dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser || storedUser === 'null' || storedUser === 'undefined') {
                navigate('/login');
                return;
            }
            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser) {
                navigate('/login');
                return;
            }
            setUser(parsedUser);
        } catch (error) {
            console.error("Session error:", error);
            navigate('/login');
        }
    }, [navigate]);

    if (!user) return <div className="loading-container">Validating session...</div>;

    return (
        <div className="dashboard-container">
            <Sidebar
                user={user}
                isOpen={isSidebarOpen}
                closeSidebar={() => setIsSidebarOpen(false)}
            />
            <div className="main-content">
                <Header
                    user={user}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                <div className="content-area">
                    <Suspense fallback={<LoadingSpinner fullScreen message="Synchronizing Module..." />}>
                        <Routes>
                            <Route index element={<DashboardHome user={user} />} />
                            <Route path="home" element={<DashboardHome user={user} />} />
                            <Route path="stock" element={<StockList user={user} />} />
                            <Route path="customers" element={<CustomerList user={user} />} />
                            <Route path="customers/:id" element={<CustomerProfile user={user} />} />
                            <Route path="customers/:id/ledger" element={<CustomerLedger user={user} />} />
                            <Route path="sales" element={<SalesList user={user} />} />
                            <Route path="sales/:id" element={<OrderDetails user={user} />} />
                            <Route path="finance" element={<Finance user={user} />} />
                            <Route path="employees" element={<Employees user={user} />} />
                            <Route path="settings" element={<Settings user={user} />} />
                            <Route path="shops" element={<Shops user={user} />} />
                            <Route path="create-order" element={<CreateOrder user={user} />} />
                            <Route path="invoice/:id" element={<Invoice user={user} />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
