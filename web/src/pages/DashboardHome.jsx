import React, { useState, useEffect } from 'react';
import {
    Users,
    Package,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    IndianRupee,
    Briefcase
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import api from '../services/api';
import './DashboardHome.css';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalCustomers: 0,
        totalStockItems: 0,
        totalStockValue: 0,
        lowStockCount: 0,
        recentTransactions: [],
        monthlySales: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/dashboard/stats');
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Sales',
            value: `₹${stats.totalSales.toLocaleString()}`,
            icon: <IndianRupee size={20} />,
            trend: '+12.5%',
            isPositive: true,
            color: 'blue'
        },
        {
            title: 'Customers',
            value: stats.totalCustomers,
            icon: <Users size={20} />,
            trend: '+3.2%',
            isPositive: true,
            color: 'purple'
        },
        {
            title: 'Stock Items',
            value: stats.totalStockItems,
            icon: <Package size={20} />,
            trend: '-2.4%',
            isPositive: false,
            color: 'orange'
        },
        {
            title: 'Low Stock Items',
            value: stats.lowStockCount,
            icon: <AlertTriangle size={20} />,
            trend: 'Alert',
            isPositive: false,
            color: 'red'
        }
    ];

    if (loading) {
        return <div className="loading-container">Loading Dashboard...</div>;
    }

    return (
        <div className="dashboard-home">
            <header className="dashboard-header">
                <div>
                    <h1>System Overview</h1>
                    <p>Welcome back! Here's what's happening with your stock today.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={fetchStats}>Refresh Data</button>
                </div>
            </header>

            <div className="stats-grid">
                {statCards.map((card, index) => (
                    <div key={index} className={`stat-card ${card.color}`}>
                        <div className="stat-card-header">
                            <div className={`stat-icon ${card.color}`}>
                                {card.icon}
                            </div>
                            <span className={`trend ${card.isPositive ? 'positive' : 'negative'}`}>
                                {card.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {card.trend}
                            </span>
                        </div>
                        <div className="stat-card-body">
                            <h3>{card.title}</h3>
                            <h2>{card.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-charts">
                <div className="chart-container">
                    <h3>Recent Sales Performance</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.recentTransactions.slice().reverse()}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="transaction_date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString()}
                                    stroke="#9ca3af"
                                />
                                <YAxis stroke="#9ca3af" tickFormatter={(val) => `₹${val}`} />
                                <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                                <Area
                                    type="monotone"
                                    dataKey="total_amount"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="transactions-container">
                    <div className="section-header">
                        <h3>Recent Transactions</h3>
                        <button className="btn-view-all">View All</button>
                    </div>
                    <div className="transactions-list">
                        {stats.recentTransactions.map((tx) => (
                            <div key={tx.id} className="transaction-item">
                                <div className="tx-icon">
                                    <ShoppingBag size={20} />
                                </div>
                                <div className="tx-info">
                                    <p className="tx-customer">{tx.customer_name}</p>
                                    <p className="tx-date">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                                </div>
                                <div className="tx-amount">
                                    <p className={tx.type === 'sale' ? 'amount-positive' : 'amount-neutral'}>
                                        {tx.type === 'sale' ? '+' : ''}₹{parseFloat(tx.total_amount).toLocaleString()}
                                    </p>
                                    <p className="tx-type">{tx.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
