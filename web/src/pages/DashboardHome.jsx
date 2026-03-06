import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Briefcase,
    Plus,
    ShoppingCart,
    CreditCard,
    UserPlus,
    Bell,
    Search,
    CheckCircle,
    Activity
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
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalSales: 0,
        totalCustomers: 0,
        totalStockItems: 0,
        totalStockValue: 0,
        lowStockCount: 0,
        recentTransactions: [],
        monthlySales: 0,
        stockHealth: { healthy: 0, low: 0, out: 0 },
        topSelling: [],
        lowStockPreview: []
    });
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStats = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/dashboard/stats?period=${period}`);
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const statCards = [
        {
            title: 'Total Sales',
            value: `₹${(stats.totalSales || 0).toLocaleString()}`,
            icon: <IndianRupee size={20} />,
            trend: '+12.5%',
            isPositive: true,
            color: 'blue'
        },
        {
            title: 'Customers',
            value: stats.totalCustomers || 0,
            icon: <Users size={20} />,
            trend: '+3.2%',
            isPositive: true,
            color: 'purple'
        },
        {
            title: 'Stock Items',
            value: stats.totalStockItems || 0,
            icon: <Package size={20} />,
            trend: '-2.4%',
            isPositive: false,
            color: 'orange'
        },
        {
            title: 'Low Stock Items',
            value: stats.lowStockCount || 0,
            icon: <AlertTriangle size={20} />,
            trend: 'Alert',
            isPositive: false,
            color: 'red'
        }
    ];

    if (loading && !stats.recentTransactions.length) {
        return <div className="loading-container">Loading Dashboard...</div>;
    }

    return (
        <div className="dashboard-home">
            <header className="dashboard-header">
                <div className="header-top" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>System Overview</h1>
                        <p>Welcome back! Here's what's happening today.</p>
                    </div>

                    <div className="header-search">
                        <Search className="search-icon" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search products, orders, customers..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="header-right">
                        <button className="notif-btn">
                            <Bell size={20} />
                            <span className="notif-badge"></span>
                        </button>
                        <select 
                            className="period-filter" 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                        <button className="btn-refresh" onClick={fetchStats}>Refresh</button>
                    </div>
                </div>
            </header>

            <div className="quick-actions">
                <button className="action-btn" onClick={() => navigate('/dashboard/stock')}>
                    <div className="icon-wrapper"><Plus size={20} /></div>
                    <span>Add Product</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/dashboard/create-order')}>
                    <div className="icon-wrapper"><ShoppingCart size={20} /></div>
                    <span>New Sale</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/dashboard/finance')}>
                    <div className="icon-wrapper"><CreditCard size={20} /></div>
                    <span>Record Payment</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/dashboard/customers')}>
                    <div className="icon-wrapper"><UserPlus size={20} /></div>
                    <span>Add Customer</span>
                </button>
            </div>

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

            <div className="dashboard-grid-layout">
                <div className="chart-container">
                    <div className="section-header">
                        <h3>Sales Analytics</h3>
                        <p className="subtitle">Visualizing your performance over the selected period</p>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={(stats.recentTransactions || []).slice().reverse()}>
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

                <div className="sidebar-widgets">
                    <div className="widget-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="widget-title"><Activity size={18} color="#10b981" /> Stock Health</h3>
                        <div className="health-grid">
                            <div className="health-item">
                                <div className="health-label"><div className="health-dot healthy"></div> Healthy Items</div>
                                <div className="health-value">{stats.stockHealth.healthy}</div>
                            </div>
                            <div className="health-item">
                                <div className="health-label"><div className="health-dot low"></div> Low Stock</div>
                                <div className="health-value">{stats.stockHealth.low}</div>
                            </div>
                            <div className="health-item">
                                <div className="health-label"><div className="health-dot out"></div> Out of Stock</div>
                                <div className="health-value">{stats.stockHealth.out}</div>
                            </div>
                        </div>
                    </div>

                    <div className="widget-card">
                        <h3 className="widget-title"><TrendingUp size={18} color="#3b82f6" /> Top Products</h3>
                        <div className="popular-list">
                            {stats.topSelling.map((item, i) => (
                                <div key={i} className="popular-item">
                                    <div className="item-main">
                                        <span className="item-name">{item.item_name}</span>
                                        <span className="item-sub">Popular this month</span>
                                    </div>
                                    <span className="item-metric">{item.sold} sold</span>
                                </div>
                            ))}
                            {stats.topSelling.length === 0 && <p className="text-center text-gray-500 py-4">No sales data yet</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-charts">
                <div className="transactions-container">
                    <div className="section-header">
                        <h3>Recent Transactions</h3>
                        <button className="btn-view-all" onClick={() => navigate('/dashboard/sales')}>View All</button>
                    </div>
                    <div className="transactions-list">
                        {(stats.recentTransactions || []).map((tx) => (
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
                                        {tx.type === 'sale' ? '+' : ''}₹{parseFloat(tx.total_amount || 0).toLocaleString()}
                                    </p>
                                    <p className="tx-type">{tx.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="widget-card">
                    <div className="section-header">
                        <h3>Low Stock Alert</h3>
                        <button className="btn-view-all" onClick={() => navigate('/dashboard/stock')}>Manage</button>
                    </div>
                    <div className="low-stock-list">
                        {stats.lowStockPreview.map((item, i) => (
                            <div key={i} className="low-stock-item">
                                <div className="item-main">
                                    <span className="item-name">{item.item_name}</span>
                                    <span className="item-sub">Urgent restock needed</span>
                                </div>
                                <span className="badge-low">{item.quantity} left</span>
                            </div>
                        ))}
                        {stats.lowStockPreview.length === 0 && <p className="text-center text-gray-400 py-8">All stock is healthy! ✨</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
