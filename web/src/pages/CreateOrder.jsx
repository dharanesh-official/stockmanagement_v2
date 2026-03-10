import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Store, User, ShoppingCart, ArrowRight, CheckCircle, Search, ArrowLeft, Package, Check, ChevronRight, Trash2, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CreateOrder.css';

const CreateOrder = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(location.state?.shopId ? 2 : 1);
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState({
        id: location.state?.editOrder?.id || '',
        shop_id: location.state?.shopId || location.state?.editOrder?.shop_id || '',
        customer_id: location.state?.editOrder?.customer_id || '',
        items: [],
        notes: location.state?.editOrder?.notes || '',
        paid_amount: location.state?.editOrder?.paid_amount || 0,
        order_type: location.state?.editOrder?.order_type || 'Shop Order',
        discount_amount: location.state?.editOrder?.discount_amount || 0,
        shipping_charge: location.state?.editOrder?.shipping_charge || 0,
        payment_method: location.state?.editOrder?.payment_method || 'Cash'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isEdit, setIsEdit] = useState(!!location.state?.editOrder);
    const [isSaving, setIsSaving] = useState(false);


    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [shopsRes, productsRes] = await Promise.all([fetchShops(), fetchProducts()]);
                
                if (isEdit) {
                    const res = await api.get(`/sales/items/${orderData.id}`);
                    setOrderData(prev => ({ ...prev, items: res.data }));
                    setStep(3); // Go to summary for edit
                } else if (location.state?.shopId) {
                    // Match the shop to get customer_id
                    const selectedShop = shopsRes.find(s => s.id === location.state.shopId);
                    if (selectedShop) {
                        setOrderData(prev => ({
                            ...prev,
                            customer_id: selectedShop.customer_id
                        }));
                    }
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [isEdit, orderData.id, location.state?.shopId]);

    const fetchShops = async () => {
        const res = await api.get('/shops');
        setShops(res.data);
        return res.data;
    };

    const fetchProducts = async () => {
        const res = await api.get('/stock');
        setProducts(res.data);
        return res.data;
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
            setIsSaving(true);
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
        } finally {
            setIsSaving(false);
        }
    };


    const filteredShops = shops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        shop.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalAmount = subtotal + Number(orderData.shipping_charge) - Number(orderData.discount_amount);
    const selectedShop = shops.find(s => s.id === orderData.shop_id);

    if (loading) return <div className="loading-container">Synchronizing inventory data...</div>;

    return (
        <div className="create-order-page">
            <button onClick={() => navigate('/dashboard/sales')} className="btn-back">
                <ArrowLeft size={18} /> Back
            </button>

            <header className="page-header">
                <div>
                    <h1 className="page-title">{isEdit ? 'Edit Order' : 'Create New Order'}</h1>
                    <p className="page-subtitle">{isEdit ? `Editing order #${orderData.id}` : 'Create new sales orders and manage stock.'}</p>
                </div>
            </header>

            <div className="order-stepper">
                <div className={`step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 1 ? <Check size={20} /> : '1'}</div>
                    <span className="step-label">Shop</span>
                </div>
                <div className={`step-line ${step > 1 ? 'filled' : ''}`}></div>
                <div className={`step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 2 ? <Check size={20} /> : '2'}</div>
                    <span className="step-label">Products</span>
                </div>
                <div className={`step-line ${step > 2 ? 'filled' : ''}`}></div>
                <div className={`step-item ${step === 3 ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <span className="step-label">Review</span>
                </div>
            </div>

            <div className="order-container">
                {step === 1 && (
                    <div style={{ padding: '2rem' }}>
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Select Shop</h2>
                                <p className="section-subtitle">Pick a shop to start the order.</p>
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
                                    <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Shop not found</p>
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
                                            <span>Select Shop</span>
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
                                    <div className="selection-label">Shop</div>
                                    <h2 className="selection-name" style={{ color: '#1e293b' }}>{selectedShop?.name}</h2>
                                    <small className="text-gray-500 font-bold">{selectedShop?.customer_name} • ID: {selectedShop?.id.slice(0, 8).toUpperCase()}</small>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700 }}>
                                Change Shop
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
                                <div className="total-label">Subtotal</div>
                                <div className="total-amount">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: '0.4rem' }}>
                                    {orderData.items.length} Product{orderData.items.length !== 1 ? 's' : ''} Selected
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(3)}
                                disabled={orderData.items.length === 0}
                                className="btn-continue"
                            >
                                Review Order <ChevronRight size={20} />
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <div className="confirmation-container">
                        {showSuccess ? (
                            <div className="success-overlay">
                                <div className="success-icon-wrapper">
                                    <CheckCircle size={64} style={{ color: '#10b981' }} />
                                </div>
                                <h2>Order Saved</h2>
                                <p className="success-msg">The order has been successfully created. Invoice No: <strong>{orderData.invoice_number || 'PENDING'}</strong></p>
                                <div className="success-actions">
                                    <button
                                        onClick={() => navigate(`/dashboard/invoice/${orderData.id}`)}
                                        className="btn-primary-confirm"
                                    >
                                        <FileText size={20} /> Generate Invoice
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard/sales')}
                                        className="btn-outline"
                                    >
                                        Back to History
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="review-grid">
                                <div className="review-main">
                                    <h2 className="step-title">Final Review</h2>
                                    
                                    <div className="review-card">
                                        <div className="review-card-header">
                                            <span className="label">Item Breakdown</span>
                                            <span className="count-pill">{orderData.items.length} Selected</span>
                                        </div>
                                        <div className="review-items">
                                            {orderData.items.map((item, idx) => (
                                                <div key={idx} className="review-item-row">
                                                    <div className="item-details">
                                                        <div className="item-qty-badge">{item.quantity}</div>
                                                        <div>
                                                            <div className="item-name">{item.name}</div>
                                                            <small className="item-sku">SKU: {item.sku || 'N/A'}</small>
                                                        </div>
                                                    </div>
                                                    <div className="item-pricing">
                                                        <div className="item-total-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                                                        <small className="item-unit-price">₹{item.price} x {item.quantity}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="review-summary-footer">
                                            <div className="summary-row">
                                                <span>Net Subtotal</span>
                                                <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
                                            </div>
                                            <div className="summary-row">
                                                <span>Logistics / Shipping</span>
                                                <strong>+ ₹{Number(orderData.shipping_charge).toLocaleString('en-IN')}</strong>
                                            </div>
                                            <div className="summary-row discount">
                                                <span>Discretionary Discount</span>
                                                <strong>- ₹{Number(orderData.discount_amount).toLocaleString('en-IN')}</strong>
                                            </div>
                                            <div className="summary-grand-total">
                                                <span className="label">Grand Total</span>
                                                <span className="value">₹{totalAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="review-sidebar">
                                    <div className="sidebar-card">
                                        <h3 className="sidebar-title">Order Logistics</h3>
                                        
                                        <div className="form-stack">
                                            <div className="form-group-v2">
                                                <label className="premium-label">Order Type</label>
                                                <select value={orderData.order_type} onChange={e => setOrderData({...orderData, order_type: e.target.value})} className="premium-input">
                                                    <option value="Shop Order">Shop Order</option>
                                                    <option value="Direct Sale">Direct Sale</option>
                                                </select>
                                            </div>

                                            <div className="grid-2">
                                                <div className="form-group-v2">
                                                    <label className="premium-label">Shipping</label>
                                                    <input type="number" value={orderData.shipping_charge} onChange={e => setOrderData({...orderData, shipping_charge: e.target.value})} className="premium-input" />
                                                </div>

                                                <div className="form-group-v2">
                                                    <label className="premium-label">Discount</label>
                                                    <input type="number" value={orderData.discount_amount} onChange={e => setOrderData({...orderData, discount_amount: e.target.value})} className="premium-input text-red-600" />
                                                </div>
                                            </div>

                                            <hr className="divider" />

                                            <div className="form-group-v2">
                                                <label className="premium-label">Advance Payment (₹)</label>
                                                <input type="number" className="premium-input highlight" placeholder="0.00" value={orderData.paid_amount || ''} onChange={e => setOrderData({ ...orderData, paid_amount: e.target.value })} />
                                            </div>

                                            <div className="form-group-v2">
                                                <label className="premium-label">Payment Method</label>
                                                <select value={orderData.payment_method} onChange={e => setOrderData({...orderData, payment_method: e.target.value})} className="premium-input">
                                                    <option value="Cash">Physical Cash</option>
                                                    <option value="UPI">Digital UPI</option>
                                                    <option value="Bank">Bank Transfer</option>
                                                    <option value="Credit">Store Credit</option>
                                                </select>
                                            </div>

                                            <div className="form-group-v2">
                                                <label className="premium-label">Internal Notes</label>
                                                <textarea className="premium-textarea" placeholder="Add specific order notes..." value={orderData.notes} onChange={e => setOrderData({ ...orderData, notes: e.target.value })}></textarea>
                                            </div>
                                        </div>

                                        <div className="review-actions">
                                            <button onClick={submitOrder} className="btn-save-order">
                                                {isEdit ? 'Update Order' : 'Complete & Save Order'}
                                            </button>
                                            <button onClick={() => setStep(2)} className="btn-back-to-products">
                                                <ArrowLeft size={16} /> Back to Products
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isSaving && (
                <div className="saving-overlay">
                    <div className="saving-card">
                        <div className="spinner-lg"></div>
                        <h3>Finalizing Order...</h3>
                        <p>Committing transaction to secure ledger. Please wait.</p>
                    </div>
                </div>
            )}
        </div>
    );
};


export default CreateOrder;
