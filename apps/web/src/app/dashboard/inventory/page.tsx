'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search, DollarSign, Tag, Info } from 'lucide-react';
import { api, Product } from '@/services/api';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        basePrice: '',
        costPrice: '',
        unit: 'pcs',
        barcode: '',
        minStockLevel: '10',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            setLoading(true);
            const data = await api.get<Product[]>('/products');
            setProducts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                basePrice: parseFloat(formData.basePrice),
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
                minStockLevel: parseInt(formData.minStockLevel),
            };

            if (editingProduct) {
                await api.patch(`/products/${editingProduct.id}`, payload);
            } else {
                await api.post('/products', payload);
            }
            closeModal();
            fetchProducts();
        } catch (err: any) {
            alert(err.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
        }
    }

    function openCreateModal() {
        setEditingProduct(null);
        resetForm();
        setShowModal(true);
    }

    function openEditModal(product: Product) {
        setEditingProduct(product);
        setFormData({
            sku: product.sku,
            name: product.name,
            description: product.description || '',
            basePrice: product.basePrice.toString(),
            costPrice: product.costPrice?.toString() || '',
            unit: product.unit,
            barcode: product.barcode || '',
            minStockLevel: product.minStockLevel.toString(),
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (err: any) {
            alert(err.message || 'Failed to delete product');
        }
    }

    function resetForm() {
        setFormData({
            sku: '',
            name: '',
            description: '',
            basePrice: '',
            costPrice: '',
            unit: 'pcs',
            barcode: '',
            minStockLevel: '10',
        });
    }

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Products</h2>
                    <p className="text-gray-500 mt-1">Manage your catalog, pricing, and stock thresholds.</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 active:scale-95"
                    onClick={openCreateModal}
                >
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl mb-6 border border-rose-100 font-medium">
                    {error}
                </div>
            )}

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-600 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-4">Product Info</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Pricing</th>
                                <th className="px-6 py-4">Stock Info</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package size={48} className="text-gray-100" />
                                            <p className="text-lg font-medium">No products registered yet</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description || 'No description'}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">{product.sku}</code>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900">₹{Number(product.basePrice).toLocaleString()}</div>
                                            {product.costPrice && (
                                                <div className="text-[10px] text-gray-400 font-medium">Cost: ₹{Number(product.costPrice).toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-700">{product.quantity}</span>
                                                <span className="text-xs text-gray-400">{product.unit}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">Min: {product.minStockLevel}</div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => openEditModal(product)}>
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleDelete(product.id)}>
                                                    <Trash2 size={18} />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 bg-gray-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                                <p className="text-white/60 text-xs mt-1">Fill in the catalog details below</p>
                            </div>
                            <button onClick={closeModal} className="text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Product SKU *</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="e.g. SKU-101"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Display Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Product Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                    placeholder="Brief details about the product..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Listing Price (₹) *</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Unit Type</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50"
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="box">Box (box)</option>
                                        <option value="set">Set (set)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Low Stock Alert Level</label>
                                    <div className="relative">
                                        <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Barcode / EAN</label>
                                    <input
                                        type="text"
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button type="button" className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    {editingProduct ? 'Save Changes' : 'Register Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function X({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}
