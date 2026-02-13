'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Minus, Search } from 'lucide-react';
import { api, Product } from '@/services/api';

type OperationType = 'INCREASE' | 'REDUCE' | null;

export default function StockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [operationType, setOperationType] = useState<OperationType>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [adjustForm, setAdjustForm] = useState({
        productId: '',
        quantity: '',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            setLoading(true);
            // We use the /stock endpoint which returns products with stock info
            const data = await api.get<Product[]>('/stock');
            setProducts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    }

    async function handleAdjustStock(e: React.FormEvent) {
        e.preventDefault();
        if (!operationType) return;

        try {
            await api.patch('/stock/adjust', {
                productId: adjustForm.productId,
                quantity: parseInt(adjustForm.quantity),
                type: operationType
            });
            setShowModal(false);
            setAdjustForm({ productId: '', quantity: '' });
            fetchProducts();
        } catch (err: any) {
            alert(err.message || 'Failed to adjust stock');
        }
    }

    function openModal(type: OperationType, productId?: string) {
        setOperationType(type);
        setAdjustForm({ ...adjustForm, productId: productId || '' });
        setShowModal(true);
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && products.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory Stock</h2>
                    <p className="text-gray-500 mt-1">Manage product stock levels directly.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm" onClick={() => openModal('INCREASE')}>
                        <Plus size={18} />
                        <span className="font-semibold">Add Stock</span>
                    </button>
                    <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm" onClick={() => openModal('REDUCE')}>
                        <Minus size={18} />
                        <span className="font-semibold">Reduce Stock</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products or SKU..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-600 text-sm font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Current Stock</th>
                                <th className="px-6 py-4">Min Level</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package size={48} className="text-gray-200" />
                                            <p className="text-lg font-medium text-gray-400">No products found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{product.unit || 'units'}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{product.sku}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm ${product.quantity > (product.minStockLevel || 10)
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                {product.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{product.minStockLevel || 10}</td>
                                        <td className="px-6 py-4">
                                            {product.quantity <= (product.minStockLevel || 10) ? (
                                                <span className="flex items-center gap-1.5 text-rose-600 font-medium text-sm animate-pulse">
                                                    <AlertTriangle size={14} />
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 font-medium text-sm">Good</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openModal('INCREASE', product.id)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Quick Add"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openModal('REDUCE', product.id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Quick Reduce"
                                                >
                                                    <Minus size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className={`px-8 py-6 ${operationType === 'INCREASE' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {operationType === 'INCREASE' ? <Plus size={24} /> : <Minus size={24} />}
                                {operationType === 'INCREASE' ? 'Add Stock' : 'Reduce Stock'}
                            </h3>
                            <p className="text-white/80 text-sm mt-1">Manual inventory adjustment</p>
                        </div>

                        <form onSubmit={handleAdjustStock} className="p-8">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product *</label>
                                    <select
                                        required
                                        value={adjustForm.productId}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50"
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Enter amount"
                                        value={adjustForm.quantity}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${operationType === 'INCREASE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}>
                                    Confirm Update
                                </button>
                                <button type="button" className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
