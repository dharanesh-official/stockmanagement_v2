import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StockList from './StockList';
import CustomerList from './CustomerList';
import SalesList from './SalesList';
import Finance from './Finance';
import Employees from './Employees';
import Settings from './Settings';
import DashboardHome from './DashboardHome';
import Shops from './Shops';
import CreateOrder from './CreateOrder';
import Invoice from './Invoice';
import api from '../services/api'; // Or context
import './Dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <Sidebar user={user} />
            <div className="main-content">
                <Header user={user} />
                <div className="content-area">
                    <Routes>
                        <Route index element={<DashboardHome user={user} />} />
                        <Route path="home" element={<DashboardHome user={user} />} />
                        <Route path="stock" element={<StockList user={user} />} />
                        <Route path="customers" element={<CustomerList user={user} />} />
                        <Route path="sales" element={<SalesList user={user} />} />
                        <Route path="finance" element={<Finance user={user} />} />
                        <Route path="employees" element={<Employees user={user} />} />
                        <Route path="settings" element={<Settings user={user} />} />
                        <Route path="shops" element={<Shops user={user} />} />
                        <Route path="create-order" element={<CreateOrder user={user} />} />
                        <Route path="invoice/:id" element={<Invoice user={user} />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
