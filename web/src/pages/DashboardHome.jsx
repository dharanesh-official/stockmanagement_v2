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
import LoadingSpinner from '../components/LoadingSpinner';
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
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchStats = React.useCallback(async () => {
        try {
            // Only set loading if we don't have data yet
            if (!(stats.recentTransactions || []).length) {
                setLoading(true);
            }
            const response = await api.get(`/dashboard/stats?period=${period}`);
            setStats(response.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    }, [period, stats.recentTransactions]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const statCards = [
        {
            title: 'Total Sales',
            value: `₹${(stats.totalSales || 0).toLocaleString()}`,
            icon: <IndianRupee size={22} />,
            trend: '+12.5%',
            isPositive: true,
            color: 'blue'
        },
        {
            title: 'Active Customers',
            value: stats.totalCustomers || 0,
            icon: <Users size={22} />,
            trend: '+3.2%',
            isPositive: true,
            color: 'purple'
        },
        {
            title: 'Inventory Items',
            value: stats.totalStockItems || 0,
            icon: <Package size={22} />,
            trend: '-2.4%',
            isPositive: false,
            color: 'orange'
        },
        {
            title: 'Critical Low Stock',
            value: stats.lowStockCount || 0,
            icon: <AlertTriangle size={22} />,
            trend: 'Action-Needed',
            isPositive: false,
            color: 'red'
        }
    ];

    if (loading && !(stats.recentTransactions || []).length) {
        return <div className="loading-container">
            <LoadingSpinner fullScreen message="Loading Professional Suite..." />
        </div>;
    }

    return (
        <div className="dashboard-home">
            <header className="dashboard-header">
                <div className="header-top">
                    <div className="header-title">
                        <h1>Operations Hub</h1>
                        <p>Real-time analytics & inventory control • Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    <div className="header-search">
                        <Search className="search-icon" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find products, orders, or customers..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="header-right">
                        <button className="notif-btn" title="Notifications">
                            <Bell size={20} />
                            <span className="notif-badge"></span>
                        </button>
                        <select 
                            className="period-filter" 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="today">Today's Performance</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Month to Date</option>
                            <option value="90d">Quarterly View</option>
                        </select>
                        <button className="btn-refresh" onClick={fetchStats}>
                            <TrendingUp size={16} style={{marginRight: '8px'}} /> Refresh
                        </button>
                    </div>
                </div>
            </header>

            <div className="quick-actions">
                <button className="action-btn" onClick={() => navigate('/dashboard/stock')}>
                    <div className="icon-wrapper"><Plus size={20} /></div>
                    <span>Inventory</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/dashboard/create-order')}>
                    <div className="icon-wrapper"><ShoppingCart size={20} /></div>
                    <span>Terminal</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/dashboard/finance')}>
                    <div className="icon-wrapper"><CreditCard size={20} /></div>
                    <span>Finance</span>
                </button>
                <button className="action-btn" onClick={() => navigate('/dashboard/customers')}>
                    <div className="icon-wrapper"><UserPlus size={20} /></div>
                    <span>CRM</span>
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
                                {card.isPositive ? <ArrowUpRight size={14} /> : <AlertTriangle size={14} />}
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
                <div className="widget-card chart-widget">
                    <div className="section-header">
                        <div>
                            <h3>Sales Dynamics</h3>
                            <p className="subtitle">Performance trajectory over the window</p>
                        </div>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={(stats.recentTransactions || []).slice().reverse()}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="transaction_date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickMargin={10}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={12} 
                                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} 
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total_amount"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="sidebar-widgets">
                    <div className="widget-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="widget-title"><Activity size={18} color="#10b981" /> Resilience Matrix</h3>
                        <div className="health-grid">
                            <div className="health-item">
                                <div className="health-label"><div className="health-dot healthy"></div> Optimal Stock</div>
                                <div className="health-value">{(stats.stockHealth || {}).healthy || 0}</div>
                            </div>
                            <div className="health-item">
                                <div className="health-label"><div className="health-dot low"></div> Low Threshold</div>
                                <div className="health-value">{(stats.stockHealth || {}).low || 0}</div>
                            </div>
                            <div className="health-item">
                                <div className="health-label"><div className="health-dot out"></div> Depleted</div>
                                <div className="health-value">{(stats.stockHealth || {}).out || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div className="widget-card">
                        <h3 className="widget-title"><TrendingUp size={18} color="#4f46e5" /> Performance Leaders</h3>
                        <div className="popular-list">
                            {(stats.topSelling || []).map((item, i) => (
                                <div key={i} className="popular-item">
                                    <div className="item-main">
                                        <span className="item-name">{item.item_name}</span>
                                        <span className="item-sub">High velocity asset</span>
                                    </div>
                                    <span className="item-metric">{item.sold} Pcs</span>
                                </div>
                            ))}
                            {(!stats.topSelling || stats.topSelling.length === 0) && (
                                <div className="text-center py-6">
                                    <ShoppingBag size={32} color="#e2e8f0" style={{marginBottom: '8px'}} />
                                    <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>Market activity pending</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-charts">
                <div className="widget-card">
                    <div className="section-header">
                        <h3>Transaction Log</h3>
                        <button className="btn-view-all" onClick={() => navigate('/dashboard/sales')}>Full Ledger</button>
                    </div>
                    <div className="transactions-list">
                        {(stats.recentTransactions || []).map((tx) => (
                            <div key={tx.id} className="transaction-item">
                                <div className="tx-icon">
                                    <ShoppingCart size={18} />
                                </div>
                                <div className="tx-info">
                                    <p className="tx-customer">{tx.customer_name}</p>
                                    <p className="tx-date">{new Date(tx.transaction_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="tx-amount">
                                    <p className={tx.type === 'sale' ? 'amount-positive' : 'amount-neutral'}>
                                        {tx.type === 'sale' ? '↑' : ''} ₹{(tx.total_amount || 0).toLocaleString()}
                                    </p>
                                    <p className="tx-type">{tx.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="widget-card">
                    <div className="section-header">
                        <h3>Continuity Alerts</h3>
                        <button className="btn-view-all" onClick={() => navigate('/dashboard/stock')}>Optimization</button>
                    </div>
                    <div className="low-stock-list">
                        {(stats.lowStockPreview || []).map((item, i) => (
                            <div key={i} className="low-stock-item">
                                <div className="item-main">
                                    <span className="item-name">{item.item_name}</span>
                                    <span className="item-sub">Restock protocol needed</span>
                                </div>
                                <span className="badge-low">{item.quantity} Unit</span>
                            </div>
                        ))}
                        {(!stats.lowStockPreview || stats.lowStockPreview.length === 0) && (
                            <div className="text-center py-10">
                                <CheckCircle size={32} color="#10b981" style={{marginBottom: '8px'}} />
                                <p style={{fontSize: '0.85rem', color: '#64748b'}}>Supply chain is secure</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;

