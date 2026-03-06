import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Store, User, ShoppingCart, ArrowRight, CheckCircle, Search, ArrowLeft, Package, Check, ChevronRight, Trash2, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CreateOrder.css';

const CreateOrder = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState({
        id: location.state?.editOrder?.id || '',
        shop_id: location.state?.editOrder?.shop_id || '',
        customer_id: location.state?.editOrder?.customer_id || '',
        items: [],
        notes: location.state?.editOrder?.notes || '',
        paid_amount: location.state?.editOrder?.paid_amount || 0,
        order_type: location.state?.editOrder?.order_type || 'Shop Order',
        gst_amount: location.state?.editOrder?.gst_amount || 0,
        discount_amount: location.state?.editOrder?.discount_amount || 0,
        shipping_charge: location.state?.editOrder?.shipping_charge || 0,
        payment_method: location.state?.editOrder?.payment_method || 'Cash'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isEdit, setIsEdit] = useState(!!location.state?.editOrder);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchShops(), fetchProducts()]);
                if (isEdit) {
                    const res = await api.get(`/sales/items/${orderData.id}`);
                    setOrderData(prev => ({ ...prev, items: res.data }));
                    setStep(3); // Go to summary for edit
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [isEdit, orderData.id]);

    const fetchShops = async () => {
        const res = await api.get('/shops');
        setShops(res.data);
    };

    const fetchProducts = async () => {
        const res = await api.get('/stock');
        setProducts(res.data);
    };

    const handleShopSelect = (shop) => {
        setOrderData({ 
            ...orderData, 
            shop_id: shop.id, 
            customer_id: shop.customer_id,
            order_type: 'Shop Order'
        });
        setStep(2);
    };

    const handleDirectSale = () => {
        // Find a default "General Customer" or just navigate to customer select if needed
        // For now, let's assume we need a shop/customer
        alert('Please select a customer via shop list for now. Custom direct sales UI coming soon.');
    };

    const toggleProduct = (product) => {
        if (product.quantity <= 0 && !orderData.items.some(item => item.stock_id === product.id)) {
            alert('This product is out of stock.');
            return;
        }
        const index = orderData.items.findIndex(item => item.stock_id === product.id);
        if (index > -1) {
            const newItems = [...orderData.items];
            newItems.splice(index, 1);
            setOrderData({ ...orderData, items: newItems });
        } else {
            setOrderData({
                ...orderData,
                items: [...orderData.items, {
                    stock_id: product.id,
                    name: product.item_name,
                    quantity: 1,
                    price: product.price,
                    sku: product.sku
                }]
            });
        }
    };

    const updateQuantity = (stockId, qty) => {
        const value = parseInt(qty);
        const newItems = orderData.items.map(item =>
            item.stock_id === stockId ? { ...item, quantity: isNaN(value) ? 0 : Math.max(1, value) } : item
        );
        setOrderData({ ...orderData, items: newItems });
    };

    const submitOrder = async () => {
        try {
            if (isEdit) {
                await api.put(`/sales/${orderData.id}`, {
                    ...orderData,
                    type: 'order'
                });
            } else {
                const res = await api.post('/sales', {
                    ...orderData,
                    type: 'order'
                });
                if (res.data.transaction_id) {
                    setOrderData(prev => ({ ...prev, id: res.data.transaction_id, invoice_number: res.data.invoice_number }));
                }
            }
            setShowSuccess(true);
        } catch (err) {
            console.error(err);
            alert(`Error: ${err.response?.data?.error || 'Failed to process transaction'}`);
        }
    };

    const filteredShops = shops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        shop.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalAmount = subtotal + Number(orderData.gst_amount) + Number(orderData.shipping_charge) - Number(orderData.discount_amount);
    const selectedShop = shops.find(s => s.id === orderData.shop_id);

    if (loading) return <div className="loading-container">Synchronizing warehouse data...</div>;

    return (
        <div className="create-order-page">
            <button onClick={() => navigate('/dashboard/sales')} className="btn-back">
                <ArrowLeft size={18} /> Exit Console
            </button>

            <header className="page-header">
                <div>
                    <h1 className="page-title">{isEdit ? 'Re-configure Order' : 'Precision Dispatch Terminal'}</h1>
                    <p className="page-subtitle">{isEdit ? `Modifying audit record #${orderData.id}` : 'Create comprehensive sales orders with real-time stock management.'}</p>
                </div>
            </header>

            <div className="order-stepper">
                <div className={`step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 1 ? <Check size={20} /> : '1'}</div>
                    <span className="step-label">Destination</span>
                </div>
                <div className={`step-line ${step > 1 ? 'filled' : ''}`}></div>
                <div className={`step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 2 ? <Check size={20} /> : '2'}</div>
                    <span className="step-label">Inventory</span>
                </div>
                <div className={`step-line ${step > 2 ? 'filled' : ''}`}></div>
                <div className={`step-item ${step === 3 ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <span className="step-label">Fiscal Review</span>
                </div>
            </div>

            <div className="order-container">
                {step === 1 && (
                    <div style={{ padding: '2rem' }}>
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Select Client Destination</h2>
                                <p className="section-subtitle">Review credit status and outstanding balances before selection.</p>
                            </div>
                            <div className="search-container">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by Shop, Client or ID..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="shop-grid">
                            {filteredShops.length === 0 ? (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    textAlign: 'center',
                                    padding: '5rem 2rem',
                                    background: '#f9fafb',
                                    borderRadius: '24px',
                                    border: '1px dashed #e5e7eb'
                                }}>
                                    <Store size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                                    <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Destination not listed in directory</p>
                                </div>
                            ) : (
                                filteredShops.map(shop => (
                                    <div key={shop.id} onClick={() => handleShopSelect(shop)} className="shop-card">
                                        <div className="shop-icon-wrapper">
                                            <Store size={24} />
                                        </div>
                                        <div className="shop-status-tag" style={{ background: Number(shop.balance) > Number(shop.credit_limit) ? '#fee2e2' : '#f0fdf4', color: Number(shop.balance) > Number(shop.credit_limit) ? '#dc2626' : '#166534' }}>
                                            {Number(shop.balance) > 0 ? `₹${Number(shop.balance).toLocaleString('en-IN')} Due` : 'Healthy Account'}
                                        </div>
                                        <h3 className="shop-name">{shop.name}</h3>
                                        <div className="shop-customer">
                                            <User size={14} style={{ color: '#10b981' }} /> {shop.customer_name}
                                        </div>
                                        <div className="shop-metrics">
                                            <div className="metric">
                                                <span>Credit Limit</span>
                                                <strong>₹{Number(shop.credit_limit).toLocaleString('en-IN')}</strong>
                                            </div>
                                            <div className="metric">
                                                <span>Availability</span>
                                                <strong>₹{Math.max(0, Number(shop.credit_limit) - Number(shop.balance)).toLocaleString('en-IN')}</strong>
                                            </div>
                                        </div>
                                        <div className="shop-action" style={{ marginTop: 'auto' }}>
                                            <span>Authorize Selection</span>
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <>
                        <div className="step-selection-info" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <div className="selection-details">
                                <div className="selection-icon" style={{ background: '#10b981', color: 'white' }}>
                                    <Store size={24} />
                                </div>
                                <div>
                                    <div className="selection-label">Dispatching To</div>
                                    <h2 className="selection-name" style={{ color: '#1e293b' }}>{selectedShop?.name}</h2>
                                    <small className="text-gray-500 font-bold">{selectedShop?.customer_name} • ID: {selectedShop?.id.slice(0, 8).toUpperCase()}</small>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700 }}>
                                Modify Route
                            </button>
                        </div>

                        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            <div className="product-grid">
                                {products.map(product => {
                                    const isSelected = orderData.items.some(item => item.stock_id === product.id);
                                    const currentItem = orderData.items.find(item => item.stock_id === product.id);

                                    return (
                                        <div
                                            key={product.id}
                                            className={`product-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleProduct(product)}
                                            style={{ border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0' }}
                                        >
                                            <div className="product-header">
                                                <div className="product-icon" style={{ background: isSelected ? '#ecfdf5' : '#f8fafc', color: isSelected ? '#10b981' : '#64748b' }}>
                                                    <Package size={22} />
                                                </div>
                                                {product.sku && <span className="product-sku-tag">{product.sku}</span>}
                                            </div>
                                            <div className="product-info">
                                                <h4>{product.item_name}</h4>
                                                <small style={{ color: product.quantity < 10 ? '#ef4444' : '#64748b', fontWeight: 700 }}>{product.quantity} Units Available</small>
                                            </div>

                                            <div className="product-footer" style={{ background: isSelected ? '#f0fdf4' : '#f8fafc' }}>
                                                <div className="product-price">₹{product.price}</div>
                                                {isSelected ? (
                                                    <div className="quantity-control" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() => currentItem.quantity > 1 ? updateQuantity(product.id, currentItem.quantity - 1) : toggleProduct(product)}
                                                        >
                                                            {currentItem.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : '-'}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={currentItem.quantity}
                                                            onChange={(e) => updateQuantity(product.id, e.target.value)}
                                                            className="qty-input"
                                                        />
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() => product.quantity > currentItem.quantity ? updateQuantity(product.id, currentItem.quantity + 1) : alert('Stock Limit Reached')}
                                                            disabled={currentItem.quantity >= product.quantity}
                                                        >+</button>
                                                    </div>
                                                ) : (
                                                    product.quantity <= 0 ? (
                                                        <div className="stock-alert">Unavailable</div>
                                                    ) : (
                                                        <div className="select-prompt">Select Item</div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="order-footer">
                            <div className="total-display">
                                <div className="total-label">Estimated Subtotal</div>
                                <div className="total-amount">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: '0.4rem' }}>
                                    {orderData.items.length} Component{orderData.items.length !== 1 ? 's' : ''} Staged
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(3)}
                                disabled={orderData.items.length === 0}
                                className="btn-continue"
                                style={{ padding: '1rem 2.5rem', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                                Continue to Fiscal Check <ChevronRight size={20} />
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <div className="confirmation-container" style={{ padding: '3rem 2rem' }}>
                        {showSuccess ? (
                            <div className="success-overlay" style={{ textAlign: 'center' }}>
                                <div style={{ width: '120px', height: '120px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 2.5rem', border: '4px solid #f0fdf4' }}>
                                    <CheckCircle size={64} style={{ color: '#10b981' }} />
                                </div>
                                <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>Transaction Authorized</h2>
                                <p style={{ color: '#64748b', fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>The order record has been successfully committed to the database. Reference: <strong>{orderData.invoice_number || 'STAGING'}</strong></p>
                                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => navigate(`/dashboard/invoice/${orderData.id}`)}
                                        className="btn-primary-confirm"
                                        style={{ background: '#10b981', padding: '1.25rem 2.5rem', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                    >
                                        <FileText size={20} /> Generate Invoice
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard/sales')}
                                        className="btn-outline"
                                        style={{ background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', padding: '1.25rem 2.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Return to Console
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
                                <div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', color: '#1e293b' }}>Order Validation</h2>
                                    
                                    <div className="summary-card" style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Breakdown</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>{orderData.items.length} Selected</span>
                                        </div>
                                        <div className="summary-items" style={{ padding: '0 2rem' }}>
                                            {orderData.items.map((item, idx) => (
                                                <div key={idx} className="item-row" style={{ padding: '1.25rem 0', borderBottom: idx === orderData.items.length - 1 ? 'none' : '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div className="flex items-center gap-4">
                                                        <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#10b981', fontSize: '0.9rem' }}>{item.quantity}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                                                            <small style={{ color: '#94a3b8', fontWeight: 700 }}>SKU: {item.sku || 'N/A'}</small>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                                                        <small style={{ color: '#94a3b8' }}>₹{item.price} x {item.quantity}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ padding: '2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                            <div className="flex justify-between mb-2">
                                                <span style={{ color: '#64748b', fontWeight: 600 }}>Net Subtotal</span>
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between mb-2">
                                                <span style={{ color: '#64748b', fontWeight: 600 }}>Taxes (GST)</span>
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>+ ₹{Number(orderData.gst_amount).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between mb-2">
                                                <span style={{ color: '#64748b', fontWeight: 600 }}>Logistics / Shipping</span>
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>+ ₹{Number(orderData.shipping_charge).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between mb-4">
                                                <span style={{ color: '#64748b', fontWeight: 600 }}>Discretionary Discount</span>
                                                <span style={{ fontWeight: 700, color: '#dc2626' }}>- ₹{Number(orderData.discount_amount).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Grand Total</span>
                                                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="side-controls">
                                    <div className="fiscal-inputs-card" style={{ background: '#f8fafc', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.5rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fiscal Adjustments</h3>
                                        
                                        <div className="form-group-v2">
                                            <label>Order Type</label>
                                            <select value={orderData.order_type} onChange={e => setOrderData({...orderData, order_type: e.target.value})} className="premium-input">
                                                <option value="Shop Order">Shop Order</option>
                                                <option value="Direct Sale">Direct Sale</option>
                                            </select>
                                        </div>

                                        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>
                                            <div className="form-group-v2">
                                                <label>GST Amount</label>
                                                <input type="number" value={orderData.gst_amount} onChange={e => setOrderData({...orderData, gst_amount: e.target.value})} className="premium-input" />
                                            </div>
                                            <div className="form-group-v2">
                                                <label>Shipping</label>
                                                <input type="number" value={orderData.shipping_charge} onChange={e => setOrderData({...orderData, shipping_charge: e.target.value})} className="premium-input" />
                                            </div>
                                        </div>

                                        <div className="form-group-v2">
                                            <label>Incentive Discount</label>
                                            <input type="number" value={orderData.discount_amount} onChange={e => setOrderData({...orderData, discount_amount: e.target.value})} className="premium-input" style={{ color: '#dc2626' }} />
                                        </div>

                                        <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

                                        <div className="form-group-v2">
                                            <label>Advance Payment Captured (₹)</label>
                                            <input type="number" className="premium-input highlight" placeholder="0.00" value={orderData.paid_amount || ''} onChange={e => setOrderData({ ...orderData, paid_amount: e.target.value })} />
                                        </div>

                                        <div className="form-group-v2">
                                            <label>Payment Method</label>
                                            <select value={orderData.payment_method} onChange={e => setOrderData({...orderData, payment_method: e.target.value})} className="premium-input">
                                                <option value="Cash">Physical Cash</option>
                                                <option value="UPI">Digital UPI</option>
                                                <option value="Bank">Bank Transfer</option>
                                                <option value="Credit">Store Credit</option>
                                            </select>
                                        </div>

                                        <div className="form-group-v2">
                                            <label>Administrative Notes</label>
                                            <textarea className="premium-textarea" placeholder="Internal logistics or shop instructions..." value={orderData.notes} onChange={e => setOrderData({ ...orderData, notes: e.target.value })}></textarea>
                                        </div>

                                        <div className="action-buttons-stack" style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <button onClick={submitOrder} className="btn-primary-confirm" style={{ padding: '1.25rem', width: '100%', borderRadius: '14px', border: 'none', background: '#10b981', color: 'white', fontWeight: 900, cursor: 'pointer', fontSize: '1.1rem' }}>
                                                Authorize & Dispatch
                                            </button>
                                            <button onClick={() => setStep(2)} className="btn-outline" style={{ padding: '1.25rem', width: '100%', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: 800, cursor: 'pointer' }}>
                                                Adjust Inventory
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateOrder;
