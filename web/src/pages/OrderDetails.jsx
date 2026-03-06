import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Printer, Package, User, Store, 
    Calendar, CreditCard, ChevronRight, FileText,
    History, CheckCircle, Clock, AlertCircle, ShoppingCart, Truck
} from 'lucide-react';
import api from '../services/api';
import './OrderDetails.css';

const OrderDetails = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const [orderRes, itemsRes, paymentsRes] = await Promise.all([
                api.get(`/sales/${id}`),
                api.get(`/sales/items/${id}`),
                api.get(`/sales/payments/${id}`)
            ]);
            setOrder(orderRes.data);
            setItems(itemsRes.data);
            setPayments(paymentsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        navigate(`/dashboard/invoice/${id}`);
    };

    if (loading) return <div className="loading-container">Retrieving order dossier...</div>;
    if (!order) return <div className="error-message">Order record not found or access denied.</div>;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalAmount = subtotal + Number(order.gst_amount || 0) + Number(order.shipping_charge || 0) - Number(order.discount_amount || 0);
    const paidAmount = Number(order.paid_amount || 0);
    const balanceDue = totalAmount - paidAmount;

    return (
        <div className="order-details-page">
            <div className="breadcrumb-nav">
                <button onClick={() => navigate('/dashboard/sales')} className="btn-back">
                    <ArrowLeft size={16} /> Back to Audit Console
                </button>
                <div className="order-id-badge">
                    <span className="label">Order Reference</span>
                    <span className="value">#{order.invoice_number}</span>
                </div>
            </div>

            <div className="details-header">
                <div className="header-info">
                    <div className="status-indicator">
                        <span className={`status-dot ${order.status.toLowerCase()}`}></span>
                        <h1>{order.status} Order</h1>
                    </div>
                    <p className="subtitle">Committed on {new Date(order.transaction_date).toLocaleDateString()} at {new Date(order.transaction_date).toLocaleTimeString()}</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handlePrint}>
                        <Printer size={18} /> Print Invoice
                    </button>
                    {user.role === 'admin' && (
                        <button className="btn btn-primary" onClick={() => navigate('/dashboard/create-order', { state: { editOrder: order } })}>
                            Modify Record
                        </button>
                    )}
                </div>
            </div>

            <div className="details-grid">
                <div className="main-section">
                    <div className="card product-list-card">
                        <div className="card-header">
                            <div className="flex items-center gap-2">
                                <Package size={20} className="text-emerald-600" />
                                <h2>Inventory Breakdown</h2>
                            </div>
                            <span className="item-count">{items.length} Component{items.length !== 1 ? 's' : ''} Linked</span>
                        </div>
                        <div className="table-responsive">
                            <table className="details-table">
                                <thead>
                                    <tr>
                                        <th>PRODUCT & SKU</th>
                                        <th style={{ textAlign: 'right' }}>UNIT PRICE</th>
                                        <th style={{ textAlign: 'center' }}>QTY</th>
                                        <th style={{ textAlign: 'right' }}>SUBTOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="product-cell">
                                                    <div className="product-icon-sm">
                                                        <Package size={14} />
                                                    </div>
                                                    <div>
                                                        <span className="product-name">{item.item_name}</span>
                                                        <span className="product-sku">SKU: {item.sku || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>₹{Number(item.price).toLocaleString('en-IN')}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="qty-badge">×{item.quantity}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }} className="font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card payment-history-card">
                        <div className="card-header">
                            <div className="flex items-center gap-2">
                                <History size={20} className="text-blue-600" />
                                <h2>Payment Lifecycle</h2>
                            </div>
                            <button className="btn-text" onClick={() => navigate('/dashboard/finance')}>View Ledger</button>
                        </div>
                        <div className="payment-timeline">
                            {payments.length === 0 ? (
                                <div className="empty-state-sm">
                                    <Clock size={32} />
                                    <p>No transactions captured against this order.</p>
                                </div>
                            ) : (
                                payments.map((payment, idx) => (
                                    <div key={idx} className="payment-node">
                                        <div className="node-icon">
                                            <CreditCard size={16} />
                                        </div>
                                        <div className="node-content">
                                            <div className="node-main">
                                                <span className="node-amount">₹{Number(payment.amount).toLocaleString('en-IN')} via {payment.payment_method}</span>
                                                <span className="node-date">{new Date(payment.transaction_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="node-sub">
                                                <span>Ref: {payment.invoice_number || payment.id.slice(0, 8).toUpperCase()}</span>
                                                <span className={`badge-sm ${payment.type === 'payment' ? 'badge-blue' : 'badge-emerald'}`}>{payment.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="side-section">
                    <div className="card summary-card-premium">
                        <div className="card-header-dark">
                            <ShoppingCart size={20} />
                            <h2>Fiscal Summary</h2>
                        </div>
                        <div className="summary-body">
                            <div className="summary-row">
                                <span>Gross Items Total</span>
                                <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="summary-row">
                                <span>GST (Consolidated)</span>
                                <strong>+ ₹{Number(order.gst_amount || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Logistic Charges</span>
                                <strong>+ ₹{Number(order.shipping_charge || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="summary-row promo">
                                <span>Special Discount</span>
                                <strong className="text-red-500">- ₹{Number(order.discount_amount || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="divider-premium"></div>
                            <div className="summary-row total-row">
                                <span>Grand Total</span>
                                <span className="total-value">₹{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="balance-box">
                                <div className="balance-item">
                                    <span>Captured</span>
                                    <span className="val text-emerald-600">₹{paidAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="balance-item">
                                    <span>Outstanding</span>
                                    <span className={`val ${balanceDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>₹{balanceDue.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            {balanceDue > 0 && (
                                <button className="btn btn-primary btn-block" onClick={() => navigate('/dashboard/finance')}>
                                    Record Recovery Payment
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card destination-card">
                        <div className="card-header">
                            <Store size={20} />
                            <h2>Destination Details</h2>
                        </div>
                        <div className="destination-info">
                            <div className="destination-shop">
                                <h3>{order.shop_name || 'Direct Sale Terminal'}</h3>
                                <p>{order.shop_location || 'Address not listed'}</p>
                            </div>
                            <div className="divider"></div>
                            <div className="client-info">
                                <div className="info-group">
                                    <User size={14} />
                                    <span>Primary Client: <strong>{order.customer_name}</strong></span>
                                </div>
                                <div className="info-group">
                                    <Calendar size={14} />
                                    <span>Estimated Transit: <strong>2-3 Days</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="notes-display-card">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={18} className="text-gray-400" />
                            <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Administrative Logistics</h3>
                        </div>
                        <p className="notes-text">
                            {order.notes || "No additional logistics instructions or notes committed to this order dossier."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
