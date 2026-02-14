import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Filter, Trash2, Edit, X, LayoutGrid, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';
import './StockList.css';
import './Employees.css';

const StockList = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustData, setAdjustData] = useState({ id: null, name: '', quantity: 1, type: 'increase' });

    // Category Management
    const [categories, setCategories] = useState([]);
    const [categoryFormData, setCategoryFormData] = useState({ id: null, name: '' });
    const [categoryEditMode, setCategoryEditMode] = useState(false);

    // Stock Form State
    const [formData, setFormData] = useState({
        id: null,
        item_name: '',
        category_id: '',
        price: '',
        quantity: ''
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);
        fetchStocks();
        fetchCategories();
    }, []);

    const fetchStocks = async () => {
        try {
            const response = await api.get('/stock');
            setStocks(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stock:', error);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const hasPermission = (module, action) => {
        if (!user) return false;
        if (user.role === 'admin' && (!user.permissions?.[module] || user.permissions[module][action] !== false)) return true;
        return user.permissions?.[module]?.[action] === true;
    };

    // Category CRUD
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (categoryEditMode) {
                await api.put(`/categories/${categoryFormData.id}`, { name: categoryFormData.name });
                // After updating, we refresh stocks to see name changes
                fetchStocks();
            } else {
                await api.post('/categories', { name: categoryFormData.name });
            }
            setShowCategoryModal(false);
            setCategoryFormData({ id: null, name: '' });
            setCategoryEditMode(false);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data || 'Failed to save category');
        }
    };

    const openEditCategory = (cat) => {
        setCategoryFormData({ id: cat.id, name: cat.name });
        setCategoryEditMode(true);
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category? This will fail if products are linked to it.')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data || 'Failed to delete category');
        }
    };

    // Stock CRUD
    const handleCreateOrUpdateStock = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.put(`/stock/${formData.id}`, formData);
            } else {
                await api.post('/stock', formData);
            }
            setShowModal(false);
            resetStockForm();
            fetchStocks();
        } catch (error) {
            alert('Failed to save product');
        }
    };

    const resetStockForm = () => {
        setFormData({ id: null, item_name: '', category_id: '', price: '', quantity: '' });
    };

    const openEditStock = (stock) => {
        setFormData({
            id: stock.id,
            item_name: stock.item_name,
            category_id: stock.category_id,
            price: stock.price,
            quantity: stock.quantity
        });
        setShowModal(true);
    };

    const handleDeleteStock = async (id) => {
        if (!window.confirm('Are you sure? This action cannot be undone.')) return;
        try {
            await api.delete(`/stock/${id}`);
            fetchStocks();
            alert('Product deleted successfully');
        } catch (error) {
            console.error(error);
            alert(error.response?.data || 'Failed to delete product');
        }
    };

    const filteredStocks = stocks.filter(stock =>
        stock.item_name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.item_name.localeCompare(b.item_name));

    const handleAdjustment = async (e) => {
        e.preventDefault();
        try {
            const endpoint = adjustData.type === 'increase' ? `/stock/increase/${adjustData.id}` : `/stock/reduce/${adjustData.id}`;
            await api.put(endpoint, { quantity: parseInt(adjustData.quantity) });
            setShowAdjustModal(false);
            fetchStocks();
        } catch (error) {
            console.error(error);
            alert('Failed to adjust stock');
        }
    };

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Product Management</h1>
                    <p className="subtitle">Centralized control for enterprise inventory across all regions.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
                        <LayoutGrid size={18} /> Manage Categories
                    </button>
                    {hasPermission('stock', 'create') && (
                        <button className="btn btn-primary" onClick={() => { resetStockForm(); setShowModal(true); }}>
                            <Plus size={18} /> Add Product
                        </button>
                    )}
                </div>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <Search size={18} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Search by Product Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>PRODUCT NAME</th>
                            <th>CATEGORY</th>
                            <th>PRICE</th>
                            <th>STOCK LEVEL</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="loading-cell">Loading inventory...</td></tr>
                        ) : filteredStocks.map((stock, index) => (
                            <tr key={stock.id}>
                                <td className="sno-cell">{index + 1}</td>
                                <td className="product-cell">
                                    <span className="product-name">{stock.item_name}</span>
                                </td>
                                <td><span className="badge badge-gray">{stock.category_name || 'General'}</span></td>
                                <td className="price-cell">₹{Number(stock.price).toFixed(2)}</td>
                                <td>
                                    <span className={`stock-count ${stock.quantity < 10 ? 'text-red' : ''}`}>
                                        {stock.quantity} Units
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <div className="flex gap-1">
                                        <button className="icon-btn text-blue-600" title="Increase Stock" onClick={() => {
                                            setAdjustData({ id: stock.id, name: stock.item_name, quantity: 1, type: 'increase' });
                                            setShowAdjustModal(true);
                                        }}>
                                            <PlusCircle size={18} />
                                        </button>
                                        <button className="icon-btn text-orange-600" title="Reduce Stock" onClick={() => {
                                            setAdjustData({ id: stock.id, name: stock.item_name, quantity: 1, type: 'reduce' });
                                            setShowAdjustModal(true);
                                        }}>
                                            <MinusCircle size={18} />
                                        </button>
                                        <div className="w-px h-4 bg-gray-200 mx-1 self-center"></div>
                                        {hasPermission('stock', 'edit') && (
                                            <button className="icon-btn" onClick={() => openEditStock(stock)}><Edit size={18} /></button>
                                        )}
                                        {hasPermission('stock', 'delete') && (
                                            <button className="icon-btn delete-btn" onClick={() => handleDeleteStock(stock.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>Manage Categories</h2>
                        </div>
                        <div className="managed-form">
                            <form onSubmit={handleCategorySubmit} className="category-inline-form">
                                <div className="form-group mb-4">
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                                        {categoryEditMode ? 'Edit Category' : 'Add New Category'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="category-input"
                                            value={categoryFormData.name}
                                            onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                            required
                                            placeholder="e.g. Mobile Phones"
                                            style={{ flex: 1, height: '42px' }}
                                        />
                                        <button type="submit" className="btn btn-primary" style={{ height: '42px', minWidth: '100px', justifyContent: 'center' }}>
                                            {categoryEditMode ? 'Update' : 'Add'}
                                        </button>
                                        {categoryEditMode && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => { setCategoryEditMode(false); setCategoryFormData({ id: null, name: '' }); }}
                                                style={{ height: '42px', width: '42px', padding: 0, justifyContent: 'center' }}
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>

                            <div className="categories-list-mini">
                                <h3 className="section-title">Existing Categories</h3>
                                <div className="table-container" style={{ border: '1px solid #f3f4f6', boxShadow: 'none' }}>
                                    <table className="stock-table" style={{ fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr>
                                                <th>Category Name</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map(cat => (
                                                <tr key={cat.id}>
                                                    <td>{cat.name}</td>
                                                    <td className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                                        <button className="icon-btn" onClick={() => openEditCategory(cat)}><Edit size={14} /></button>
                                                        <button className="icon-btn delete-btn" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{formData.id ? 'Edit Product' : 'Add New Product'}</h2>
                        </div>
                        <form onSubmit={handleCreateOrUpdateStock}>
                            <div className="managed-form">
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input
                                        type="text"
                                        value={formData.item_name}
                                        onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-4">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Price (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.quantity}
                                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {showAdjustModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>{adjustData.type === 'increase' ? 'Increase Stock' : 'Reduce Stock'}</h2>
                            <p className="text-secondary text-sm mt-1">{adjustData.name}</p>
                        </div>
                        <form onSubmit={handleAdjustment}>
                            <div className="managed-form">
                                <div className="form-group">
                                    <label>Adjustment Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={adjustData.quantity}
                                        onChange={e => setAdjustData({ ...adjustData, quantity: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                                <button type="submit" className={`btn ${adjustData.type === 'increase' ? 'btn-primary' : 'btn-danger'}`}>
                                    Confirm {adjustData.type === 'increase' ? 'Addition' : 'Reduction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockList;
