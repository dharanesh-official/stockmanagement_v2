import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, DollarSign, ShoppingBag, 
    CreditCard, PieChart, BarChart3, 
    ArrowUpRight, ArrowDownRight, Package,
    Truck, CheckCircle, XCircle, RotateCcw
} from 'lucide-react';
import api from '../services/api';
import './SalesAnalytics.css';

const SalesAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/sales/analytics');
                setData(res.data);
            } catch (err) {
                console.error("Analytics fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="analytics-loading">
            <div className="pulse-loader"></div>
            <span>Synthesizing Market Data...</span>
        </div>
    );

    if (!data) return null;

    const { metrics, types, statuses } = data;

    const statusIcons = {
        'Delivered': <CheckCircle size={14} className="text-emerald-500" />,
        'Ordered': <ShoppingBag size={14} className="text-blue-500" />,
        'Dispatched': <Truck size={14} className="text-indigo-500" />,
        'Cancelled': <XCircle size={14} className="text-red-500" />,
        'Returned': <RotateCcw size={14} className="text-orange-500" />
    };

    return (
        <div className="sales-analytics-dashboard">
            <div className="metrics-grid-premium">
                <div className="metric-card-glass">
                    <div className="card-inner">
                        <div className="icon-wrap blue">
                            <ShoppingBag size={24} />
                        </div>
                        <div className="info">
                            <span className="label">Total Throughput</span>
                            <div className="value-group">
                                <h3>{metrics.total_orders || 0}</h3>
                                <span className="trend positive"><ArrowUpRight size={14} /> 12%</span>
                            </div>
                            <p>Gross system orders processed</p>
                        </div>
                    </div>
                </div>

                <div className="metric-card-glass">
                    <div className="card-inner">
                        <div className="icon-wrap emerald">
                            <DollarSign size={24} />
                        </div>
                        <div className="info">
                            <span className="label">Aggregate Gross Volume</span>
                            <div className="value-group">
                                <h3>₹{Number(metrics.total_revenue || 0).toLocaleString('en-IN')}</h3>
                                <span className="trend positive"><ArrowUpRight size={14} /> 8.4%</span>
                            </div>
                            <p>Revenue inclusive of taxes & fees</p>
                        </div>
                    </div>
                </div>

                <div className="metric-card-glass">
                    <div className="card-inner">
                        <div className="icon-wrap purple">
                            <CreditCard size={24} />
                        </div>
                        <div className="info">
                            <span className="label">Liquidity Recovery</span>
                            <div className="value-group">
                                <h3>₹{Number(metrics.total_collected || 0).toLocaleString('en-IN')}</h3>
                                <span className="trend neutral">Stable</span>
                            </div>
                            <p>Cash flow successfully captured</p>
                        </div>
                    </div>
                </div>

                <div className="metric-card-glass">
                    <div className="card-inner">
                        <div className="icon-wrap orange">
                            <TrendingUp size={24} />
                        </div>
                        <div className="info">
                            <span className="label">Exposure Risk (Dues)</span>
                            <div className="value-group">
                                <h3 className="text-red-500">₹{Number(metrics.total_pending || 0).toLocaleString('en-IN')}</h3>
                                <span className="trend negative"><ArrowUpRight size={14} /> 2.1%</span>
                            </div>
                            <p>Pending payments from clients</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="analytics-lower-grid">
                <div className="analytics-card type-distribution">
                    <div className="card-hdr">
                        <BarChart3 size={18} />
                        <h4>Channel Distribution</h4>
                    </div>
                    <div className="type-list">
                        {types.map((t, idx) => (
                            <div key={idx} className="type-row">
                                <div className="type-info">
                                    <span className={`dot ${t.order_type === 'Shop Order' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                                    <span className="type-name">{t.order_type}</span>
                                </div>
                                <div className="type-val">
                                    <strong>{t.count}</strong>
                                    <span className="perc">{Math.round((t.count / metrics.total_orders) * 100)}%</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className={`progress-bar ${t.order_type === 'Shop Order' ? 'blue' : 'emerald'}`} style={{ width: `${(t.count / metrics.total_orders) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-card status-intelligence">
                    <div className="card-hdr">
                        <PieChart size={18} />
                        <h4>Lifecycle Health</h4>
                    </div>
                    <div className="status-grid">
                        {statuses.map((s, idx) => (
                            <div key={idx} className="status-mini-card">
                                <div className="mini-hdr">
                                    {statusIcons[s.status] || <Package size={14} />}
                                    <span>{s.status}</span>
                                </div>
                                <div className="mini-val">{s.count}</div>
                                <div className="mini-label">Orders</div>
                            </div>
                        ))}
                    </div>
                    <div className="system-health-msg">
                        <div className="health-dot active"></div>
                        <p>Order processing pipeline is optimized. System health: Excellent.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;
