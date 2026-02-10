'use client';

import { useState, useEffect } from 'react';
import { Package, ArrowRight, AlertTriangle, Plus, Minus } from 'lucide-react';
import { api, Stock, Product, Warehouse, Brand } from '@/services/api';

type OperationType = 'receive' | 'transfer' | 'adjust' | null;

export default function StockPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [operationType, setOperationType] = useState<OperationType>(null);

    const [receiveForm, setReceiveForm] = useState({
        productId: '',
        warehouseId: '',
        quantity: '',
        batchNumber: '',
    });

    const [transferForm, setTransferForm] = useState({
        productId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: '',
    });

    const [adjustForm, setAdjustForm] = useState({
        productId: '',
        warehouseId: '',
        quantity: '',
        reason: '',
    });

    useEffect(() => {
        fetchStocks();
        fetchProducts();
        fetchWarehouses();
    }, []);

    async function fetchStocks() {
        try {
            setLoading(true);
            const data = await api.get<Stock[]>('/stock');
            setStocks(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch stock');
        } finally {
            setLoading(false);
        }
    }

    async function fetchProducts() {
        try {
            const data = await api.get<Product[]>('/products');
            setProducts(data);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        }
    }

    async function fetchWarehouses() {
        try {
            const data = await api.get<Warehouse[]>('/warehouses');
            setWarehouses(data);
        } catch (err) {
            console.error('Failed to fetch warehouses:', err);
        }
    }

    async function handleReceiveStock(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.post('/stock/receive', {
                ...receiveForm,
                quantity: parseInt(receiveForm.quantity),
            });
            setShowModal(false);
            setReceiveForm({ productId: '', warehouseId: '', quantity: '', batchNumber: '' });
            fetchStocks();
        } catch (err: any) {
            alert(err.message || 'Failed to receive stock');
        }
    }

    async function handleTransferStock(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.post('/stock/transfer', {
                ...transferForm,
                quantity: parseInt(transferForm.quantity),
            });
            setShowModal(false);
            setTransferForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });
            fetchStocks();
        } catch (err: any) {
            alert(err.message || 'Failed to transfer stock');
        }
    }

    async function handleAdjustStock(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.post('/stock/adjust', {
                ...adjustForm,
                quantity: parseInt(adjustForm.quantity),
            });
            setShowModal(false);
            setAdjustForm({ productId: '', warehouseId: '', quantity: '', reason: '' });
            fetchStocks();
        } catch (err: any) {
            alert(err.message || 'Failed to adjust stock');
        }
    }

    function openModal(type: OperationType) {
        setOperationType(type);
        setShowModal(true);
    }

    if (loading && stocks.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading stock...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Stock Management</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Receive, transfer, and adjust inventory stock.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" onClick={() => openModal('receive')}>
                        <Plus size={16} />
                        Receive Stock
                    </button>
                    <button className="btn-secondary" onClick={() => openModal('transfer')}>
                        <ArrowRight size={16} />
                        Transfer
                    </button>
                    <button className="btn-secondary" onClick={() => openModal('adjust')}>
                        <Minus size={16} />
                        Adjust
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Warehouse</th>
                            <th>Quantity</th>
                            <th>Batch Number</th>
                            <th>Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Package size={48} color="#e5e7eb" />
                                        <p>No stock records found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            stocks.map((stock) => (
                                <tr key={stock.id}>
                                    <td><strong>{stock.product?.name}</strong></td>
                                    <td><code>{stock.product?.sku}</code></td>
                                    <td>{stock.warehouse?.name}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: stock.quantity > 50 ? '#d1fae5' : stock.quantity > 10 ? '#fef3c7' : '#fee2e2',
                                            color: stock.quantity > 50 ? '#065f46' : stock.quantity > 10 ? '#92400e' : '#991b1b',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                        }}>
                                            {stock.quantity}
                                        </span>
                                    </td>
                                    <td>{stock.batchNumber || '-'}</td>
                                    <td>{new Date(stock.updatedAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Stock Operations */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            {operationType === 'receive' && 'Receive Stock'}
                            {operationType === 'transfer' && 'Transfer Stock'}
                            {operationType === 'adjust' && 'Adjust Stock'}
                        </h3>

                        {/* Receive Stock Form */}
                        {operationType === 'receive' && (
                            <form onSubmit={handleReceiveStock}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Product *</label>
                                    <select
                                        required
                                        value={receiveForm.productId}
                                        onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })}
                                        className="form-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Warehouse *</label>
                                    <select
                                        required
                                        value={receiveForm.warehouseId}
                                        onChange={(e) => setReceiveForm({ ...receiveForm, warehouseId: e.target.value })}
                                        className="form-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={receiveForm.quantity}
                                        onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Batch Number</label>
                                    <input
                                        type="text"
                                        value={receiveForm.batchNumber}
                                        onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Receive</button>
                                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Transfer Stock Form */}
                        {operationType === 'transfer' && (
                            <form onSubmit={handleTransferStock}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Product *</label>
                                    <select
                                        required
                                        value={transferForm.productId}
                                        onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                                        className="form-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>From Warehouse *</label>
                                    <select
                                        required
                                        value={transferForm.fromWarehouseId}
                                        onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                                        className="form-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>To Warehouse *</label>
                                    <select
                                        required
                                        value={transferForm.toWarehouseId}
                                        onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
                                        className="form-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={transferForm.quantity}
                                        onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Transfer</button>
                                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Adjust Stock Form */}
                        {operationType === 'adjust' && (
                            <form onSubmit={handleAdjustStock}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Product *</label>
                                    <select
                                        required
                                        value={adjustForm.productId}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                                        className="form-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Warehouse *</label>
                                    <select
                                        required
                                        value={adjustForm.warehouseId}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
                                        className="form-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Adjustment Quantity * (use negative for reduction)</label>
                                    <input
                                        type="number"
                                        required
                                        value={adjustForm.quantity}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                                        placeholder="e.g., -5 for reduction, 10 for addition"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reason *</label>
                                    <textarea
                                        required
                                        value={adjustForm.reason}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                        rows={2}
                                        placeholder="e.g., Damaged goods, Inventory correction"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            resize: 'vertical',
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Adjust</button>
                                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
