'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';
import { api, Product, Brand } from '@/services/api';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        brandId: '',
        basePrice: '',
        costPrice: '',
        unit: 'pcs',
        barcode: '',
        minStockLevel: '10',
    });

    useEffect(() => {
        fetchProducts();
        fetchBrands();
    }, [selectedBrand]);

    async function fetchProducts() {
        try {
            setLoading(true);
            const endpoint = selectedBrand ? `/products?brandId=${selectedBrand}` : '/products';
            const data = await api.get<Product[]>(endpoint);
            setProducts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }

    async function fetchBrands() {
        try {
            const data = await api.get<Brand[]>('/brands');
            setBrands(data);
        } catch (err) {
            console.error('Failed to fetch brands:', err);
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
            brandId: product.brandId,
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
            brandId: '',
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading products...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 className="text-h2">Inventory Management</h2>
                    <p className="text-sm text-gray-500">Manage products, stock levels, and pricing.</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add Product
                </button>
            </div>

            {error && (
                <div className="p-4 bg-danger-bg text-danger rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="search-input">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                    />
                </div>
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="form-select"
                >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                </select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Brand</th>
                            <th>Price</th>
                            <th>Unit</th>
                            <th>Min Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Package size={48} color="#e5e7eb" />
                                        <p>No products found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td><code>{product.sku}</code></td>
                                    <td>
                                        <div>
                                            <strong>{product.name}</strong>
                                            {product.description && (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                                                    {product.description}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{product.brand?.name || '-'}</td>
                                    <td>
                                        <strong>₹{Number(product.basePrice).toFixed(2)}</strong>
                                        {product.costPrice && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                Cost: ₹{Number(product.costPrice).toFixed(2)}
                                            </div>
                                        )}
                                    </td>
                                    <td>{product.unit}</td>
                                    <td>{product.minStockLevel}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-icon" title="Edit" onClick={() => openEditModal(product)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon text-danger" title="Delete" onClick={() => handleDelete(product.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Product Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <h3 className="text-h3 mb-6">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">SKU *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Brand *</label>
                                    <select
                                        required
                                        value={formData.brandId}
                                        onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                        className="form-select"
                                    >
                                        <option value="">Select Brand</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Product Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="form-textarea"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Base Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cost Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="form-select"
                                    >
                                        <option value="pcs">Pieces</option>
                                        <option value="kg">Kilograms</option>
                                        <option value="ltr">Liters</option>
                                        <option value="box">Box</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Min Stock</label>
                                    <input
                                        type="number"
                                        value={formData.minStockLevel}
                                        onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Barcode</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
