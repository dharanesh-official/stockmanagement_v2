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
        paid_amount: location.state?.editOrder?.paid_amount || 0
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
                    setStep(2); // Start at products for edit
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
        setOrderData({ ...orderData, shop_id: shop.id, customer_id: shop.customer_id });
        setStep(2);
    };

    const toggleProduct = (product) => {
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
                    price: product.price
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
                    setOrderData(prev => ({ ...prev, id: res.data.transaction_id }));
                }
            }
            setShowSuccess(true);
        } catch (err) {
            console.error(err);
            alert(`Failed to ${isEdit ? 'update' : 'create'} order`);
        }
    };

    const filteredShops = shops.filter(shop => shop.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalAmount = orderData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const selectedShop = shops.find(s => s.id === orderData.shop_id);

    if (loading) return <div className="loading-container">Preparing your workspace...</div>;

    return (
        <div className="create-order-page">
            <button onClick={() => navigate('/dashboard/sales')} className="btn-back">
                <ArrowLeft size={18} /> Back to Orders
            </button>

            <header className="page-header">
                <h1 className="page-title">{isEdit ? 'Update Existing Order' : 'Create New Order'}</h1>
                <p className="page-subtitle">{isEdit ? `Modifying order #${orderData.id} details.` : 'Efficiently manage and dispatch items to your branch shops.'}</p>
            </header>

            <div className="order-stepper">
                <div className={`step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 1 ? <Check size={20} /> : '1'}</div>
                    <span className="step-label">Select Shop</span>
                </div>
                <div className={`step-line ${step > 1 ? 'filled' : ''}`}></div>
                <div className={`step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-circle">{step > 2 ? <Check size={20} /> : '2'}</div>
                    <span className="step-label">Add Products</span>
                </div>
                <div className={`step-line ${step > 2 ? 'filled' : ''}`}></div>
                <div className={`step-item ${step === 3 ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <span className="step-label">Confirmation</span>
                </div>
            </div>

            <div className="order-container">
                {step === 1 && (
                    <div style={{ padding: '2rem' }}>
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Where is this order going?</h2>
                                <p className="section-subtitle">Pick a registered shop from your directory</p>
                            </div>
                            <div className="search-container">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by shop name..."
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
                                    <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>No shops found matching your search</p>
                                </div>
                            ) : (
                                filteredShops.map(shop => (
                                    <div key={shop.id} onClick={() => handleShopSelect(shop)} className="shop-card">
                                        <div className="shop-icon-wrapper">
                                            <Store size={24} />
                                        </div>
                                        <h3 className="shop-name">{shop.name}</h3>
                                        <div className="shop-customer">
                                            <User size={14} style={{ color: '#10b981' }} /> {shop.customer_name}
                                        </div>
                                        <p className="shop-address">
                                            {shop.address || 'Address not listed'}
                                        </p>
                                        <div className="shop-action">
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
                        <div className="step-selection-info">
                            <div className="selection-details">
                                <div className="selection-icon">
                                    <Store size={24} />
                                </div>
                                <div>
                                    <div className="selection-label">Active Selection</div>
                                    <h2 className="selection-name">{selectedShop?.name}</h2>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="btn-secondary-outline" style={{ padding: '0.625rem 1.25rem' }}>
                                Change Shop
                            </button>
                        </div>

                        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                            <div className="product-grid">
                                {products.map(product => {
                                    const isSelected = orderData.items.some(item => item.stock_id === product.id);
                                    const currentItem = orderData.items.find(item => item.stock_id === product.id);

                                    return (
                                        <div
                                            key={product.id}
                                            className={`product-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleProduct(product)}
                                        >
                                            <div className="product-header">
                                                <div className="product-icon">
                                                    <Package size={22} />
                                                </div>
                                                <div
                                                    className="select-indicator"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleProduct(product);
                                                    }}
                                                >
                                                    {isSelected && <Check size={14} />}
                                                </div>
                                            </div>
                                            <div className="product-info">
                                                <h4>{product.item_name}</h4>
                                            </div>

                                            <div className="product-footer">
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
                                                        <button className="qty-btn" onClick={() => updateQuantity(product.id, currentItem.quantity + 1)}>+</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Select Item</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="order-footer">
                            <div className="total-display">
                                <div className="total-label">Total Order Value</div>
                                <div className="total-amount">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.5rem' }}>
                                    {orderData.items.length} Product{orderData.items.length !== 1 ? 's' : ''} in bucket
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(3)}
                                disabled={orderData.items.length === 0}
                                className="btn-continue"
                            >
                                Review Summary <ArrowRight size={20} />
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <div className="confirmation-container">
                        {showSuccess ? (
                            <div className="success-overlay">
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    background: '#ecfdf5',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 2rem'
                                }}>
                                    <CheckCircle size={56} style={{ color: '#10b981' }} />
                                </div>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Order Confirmed!</h2>
                                <p style={{ color: '#64748b', fontSize: '1.25rem', marginBottom: '2rem' }}>The transaction has been recorded successfully.</p>
                                <div className="flex gap-4" style={{ justifyContent: 'center' }}>
                                    <button
                                        onClick={() => navigate(`/dashboard/invoice/${orderData.id}`)}
                                        className="btn-primary-confirm"
                                        style={{ width: 'auto', padding: '1rem 2rem' }}
                                    >
                                        <FileText size={20} /> View Invoice
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard/sales')}
                                        className="btn-secondary-outline"
                                        style={{ width: 'auto', padding: '1rem 2rem', background: 'white' }}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ animation: 'fadeInScale 0.4s ease-out' }}>
                                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                    <ShoppingCart size={48} style={{ color: '#10b981', marginBottom: '1.5rem' }} />
                                    <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1e293b' }}>Order Finalization</h2>
                                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Please review your selection before placing the order.</p>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-header">
                                        <div>
                                            <div className="summary-label">Recipient Shop</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{selectedShop?.name}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="summary-label">Order Date</div>
                                            <div style={{ fontWeight: 700, color: '#475569' }}>{new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <div className="summary-items">
                                        {orderData.items.map((item, idx) => (
                                            <div key={idx} className="item-row">
                                                <div className="item-main">
                                                    <div className="item-qty">{item.quantity}</div>
                                                    <div>
                                                        <span className="item-name">{item.name}</span>
                                                        <span className="item-subtext">Unit: ₹{item.price}</span>
                                                    </div>
                                                </div>
                                                <div className="item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="summary-total">
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#64748b' }}>Total Payable</span>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="notes-group">
                                    <label className="label-premium">Initial Payment Received (₹)</label>
                                    <input
                                        type="number"
                                        className="notes-textarea"
                                        style={{ minHeight: 'auto', padding: '1rem', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}
                                        placeholder="0.00"
                                        value={orderData.paid_amount || ''}
                                        onChange={e => setOrderData({ ...orderData, paid_amount: e.target.value })}
                                    />

                                    <label className="label-premium">Order Notes & Logistics</label>
                                    <textarea
                                        className="notes-textarea"
                                        placeholder="Add any specific delivery logistics or special instructions..."
                                        value={orderData.notes}
                                        onChange={e => setOrderData({ ...orderData, notes: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="confirmation-actions">
                                    <button onClick={() => setStep(2)} className="btn-secondary-outline">
                                        Edit Inventory
                                    </button>
                                    <button onClick={submitOrder} className="btn-primary-confirm">
                                        Place Transaction
                                    </button>
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
