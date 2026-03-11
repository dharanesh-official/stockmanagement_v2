import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Filter, Trash2, Edit, X, LayoutGrid, PlusCircle, MinusCircle, RefreshCw, History, ArrowLeft, Download } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { exportToExcel } from '../utils/exportExcel';

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
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedStockHistory, setSelectedStockHistory] = useState([]);
    const [adjustData, setAdjustData] = useState({ id: null, name: '', adjustment: 0, reason: 'Purchase' });
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    
    // Filters
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Category Management
    const [categories, setCategories] = useState([]);
    const [categoryFormData, setCategoryFormData] = useState({ id: null, name: '' });
    const [categoryEditMode, setCategoryEditMode] = useState(false);

    // Stock Form State
    const [formData, setFormData] = useState({
        id: null,
        item_name: '',
        category_id: '',
        sku: '',
        price: '',
        quantity: '',
        min_stock_level: 10,
        supplier: '',
        description: ''
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
        if ((user.role === 'admin' || user.role === 'super_admin') && (!user.permissions?.[module] || user.permissions[module][action] !== false)) return true;
        return user.permissions?.[module]?.[action] === true;
    };

    // Category CRUD
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
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
        } finally {
            setActionLoading(false);
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
        setActionLoading(true);
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
        } finally {
            setActionLoading(false);
        }
    };

    const resetStockForm = () => {
        setFormData({ id: null, item_name: '', category_id: '', sku: '', price: '', quantity: '', min_stock_level: 10, supplier: '', description: '' });
    };

    const openEditStock = (stock) => {
        setFormData({
            ...stock,
            price: Number(stock.price),
            quantity: Number(stock.quantity),
            min_stock_level: Number(stock.min_stock_level || 10)
        });
        setShowModal(true);
    };

    const fetchHistory = async (stockId) => {
        try {
            const res = await api.get(`/stock/${stockId}/history`);
            setSelectedStockHistory(res.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error(error);
        }
    };

    const getStockStatus = (qty, min) => {
        const m = min || 10;
        if (qty <= m) return { label: 'Critical', class: 'critical' };
        if (qty <= m + 20) return { label: 'Low Stock', class: 'low' };
        return { label: 'In Stock', class: 'good' };
    };

    const filteredStocks = stocks.filter(stock => {
        const matchesSearch = stock.item_name.toLowerCase().includes(search.toLowerCase()) || 
                             (stock.sku && stock.sku.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = filterCategory === 'All' || stock.category_id == filterCategory;
        
        const status = getStockStatus(stock.quantity, stock.min_stock_level);
        const matchesStatus = filterStatus === 'All' || status.label === filterStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => a.item_name.localeCompare(b.item_name));

    const handleAdjustment = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post(`/stock/${adjustData.id}/adjust`, { 
                adjustment: parseInt(adjustData.adjustment), 
                reason: adjustData.reason 
            });
            setShowAdjustModal(false);
            fetchStocks();
        } catch (error) {
            console.error(error);
            alert('Failed to adjust stock');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === filteredStocks.length) setSelectedItems([]);
        else setSelectedItems(filteredStocks.map(s => s.id));
    };

    const toggleSelectItem = (id) => {
        if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id));
        else setSelectedItems([...selectedItems, id]);
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

    const handleExportExcel = () => {
        const dataToExport = filteredStocks.map(stock => ({
            'Product Name': stock.item_name,
            'SKU': stock.sku || 'N/A',
            'Category': stock.category_name || 'General',
            'Supplier': stock.supplier || 'N/A',
            'Price (₹)': Number(stock.price).toLocaleString('en-IN'),
            'Current Stock': stock.quantity,
            'Min Stock Level': stock.min_stock_level,
            'Status': getStockStatus(stock.quantity, stock.min_stock_level).label,
            'Last Updated': new Date(stock.updated_at).toLocaleDateString() + ' ' + new Date(stock.updated_at).toLocaleTimeString()
        }));

        exportToExcel(dataToExport, 'Inventory_Report', 'StockDetails');
    };

    return (
        <>
            {loading && <LoadingSpinner fullScreen message="Loading inventory..." />}
            <div className="stock-page">
                <div className="page-header">
                    <div className="header-title">
                        <h1>Product Hub</h1>
                        <p className="subtitle">Enterprise inventory management with real-time tracking.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary" onClick={handleExportExcel}>
                            <Download size={18} /> Export Excel
                        </button>
                        {user?.role !== 'salesman' && (
                            <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
                                <LayoutGrid size={18} /> Categories
                            </button>
                        )}

                        {hasPermission('stock', 'create') && (
                            <button className="btn btn-primary" onClick={() => { resetStockForm(); setShowModal(true); }}>
                                <Plus size={18} /> New Product
                            </button>
                        )}
                    </div>
                </div>

                <div className="controls-bar">
                    <div className="search-box">
                        <Search size={18} color="#9ca3af" />
                        <input
                            type="text"
                            placeholder="Find by product name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filters-group">
                        <div className="filter-item">
                            <label className="filter-label">Category</label>
                            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select">
                                <option value="All">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label className="filter-label">Stock Status</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
                                <option value="All">All Status</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>PRODUCT / SKU</th>
                                <th>CATEGORY</th>
                                <th>SUPPLIER</th>
                                <th>PRICE</th>
                                <th>STOCK</th>
                                <th>STATUS</th>
                                <th>UPDATED</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStocks.length === 0 ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="empty-inventory">
                                            <RefreshCw size={48} className="empty-icon" />
                                            <h3>No Products Found</h3>
                                            <p>Try adjusting your search or filters to find what you're looking for.</p>
                                            <button className="btn btn-outline" onClick={() => { setSearch(''); setFilterCategory('All'); setFilterStatus('All'); }}>Clear All Filters</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStocks.map((stock) => {
                                const status = getStockStatus(stock.quantity, stock.min_stock_level);
                                return (
                                    <tr key={stock.id}>
                                        <td className="product-cell">
                                            <div className="product-info-cell">
                                                <span className="product-name" onClick={() => fetchHistory(stock.id)}>{stock.item_name}</span>
                                                <span className="product-sku">{stock.sku || 'NO-SKU'}</span>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-gray">{stock.category_name || 'General'}</span></td>
                                        <td><span className="supplier-name">{stock.supplier || 'Not set'}</span></td>
                                        <td className="price-cell">₹{Number(stock.price).toLocaleString()}</td>
                                        <td className="stock-cell">
                                            <span className={`stock-count ${status.class}`}>
                                                {stock.quantity} Units
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${status.class}`}>{status.label}</span>
                                        </td>
                                        <td className="updated-cell">
                                            <div className="date-display">
                                                <span>{new Date(stock.updated_at).toLocaleDateString()}</span>
                                                <small>{new Date(stock.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                            </div>
                                        </td>
                                        <td className="actions-cell">
                                            <div className="flex gap-1 justify-end">
                                                <button className="icon-btn-sm" title="Adjust Stock" onClick={() => {
                                                    setAdjustData({ id: stock.id, name: stock.item_name, adjustment: 0, reason: 'Manual adjustment' });
                                                    setShowAdjustModal(true);
                                                }}>
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button className="icon-btn-sm" title="Movement History" onClick={() => fetchHistory(stock.id)}>
                                                    <History size={16} />
                                                </button>
                                                <div className="separator"></div>
                                                {hasPermission('stock', 'edit') && (
                                                    <button className="icon-btn-sm" title="Edit Product" onClick={() => openEditStock(stock)}><Edit size={16} /></button>
                                                )}
                                                {hasPermission('stock', 'delete') && (
                                                    <button className="icon-btn-sm delete-btn" title="Delete Product" onClick={() => handleDeleteStock(stock.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                <div className="pagination-bar">
                    <p>Showing <strong>{filteredStocks.length}</strong> of <strong>{stocks.length}</strong> products</p>
                    <div className="pagination-btns">
                        <button className="btn-page disabled" disabled>Previous</button>
                        <button className="btn-page active">1</button>
                        <button className="btn-page disabled" disabled>Next</button>
                    </div>
                </div>

                {/* Category Management Modal */}
                {showCategoryModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <div className="flex items-center gap-3">
                                    <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowCategoryModal(false)}>
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h2>Manage Categories</h2>
                                </div>
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
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                style={{ height: '42px', minWidth: '100px', justifyContent: 'center' }}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? 'Saving...' : (categoryEditMode ? 'Update' : 'Add')}
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
                                    <h3 className="section-title">Established Categories</h3>
                                    <div className="modern-table-view">
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th className="text-center">Usage</th>
                                                    <th className="text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categories.map(cat => (
                                                    <tr key={cat.id}>
                                                        <td className="font-bold text-gray-800">{cat.name}</td>
                                                        <td className="text-center">
                                                             <span className="count-chip">{cat.product_count || 0} Items</span>
                                                        </td>
                                                        <td className="actions-cell justify-end">
                                                            <button className="icon-btn-sm" title="Edit" onClick={() => openEditCategory(cat)}><Edit size={14} /></button>
                                                            <button className="icon-btn-sm delete-btn" title="Delete" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={14} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {categories.length === 0 && (
                                                    <tr><td colSpan="3" className="text-center py-10 text-gray-400">No categories established.</td></tr>
                                                )}
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
                        <div className="modal-content wide-modal">
                            <div className="modal-header">
                                <div className="flex items-center gap-3">
                                    <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowModal(false)}>
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <h2>{formData.id ? 'Edit Product' : 'Add Product'}</h2>
                                        <p className="subtitle">{formData.id ? 'Update product details.' : 'Add a new product to inventory.'}</p>
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleCreateOrUpdateStock} className="modal-body-form">
                                <div className="managed-form">
                                    <div className="form-sections">
                                        <div className="form-section">
                                            <h3 className="section-title">Product Info</h3>
                                            <div className="grid-2">
                                                <div className="form-group">
                                                    <label>Product Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.item_name}
                                                        onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                                                        required
                                                        placeholder="e.g. Pilot V7 Hi-Tecpoint"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>SKU / Identifier (Unique)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.sku}
                                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                                        placeholder="PILOT-V7-BLK-001"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid-2">
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
                                                <div className="form-group">
                                                    <label>Supplier / Vendor</label>
                                                    <input
                                                        type="text"
                                                        value={formData.supplier}
                                                        onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                                        placeholder="e.g. ABC Distributors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h3 className="section-title">Price & Stock</h3>
                                            <div className="grid-3">
                                                <div className="form-group">
                                                    <label>Unit Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={formData.price}
                                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Initial Quantity</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.quantity}
                                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                                        required
                                                        disabled={formData.id !== null}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Alert Threshold (Min)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.min_stock_level}
                                                        onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Product Description / Notes</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Provide additional details about the product specifications, variants, or handling instructions..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-actions-alt">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={actionLoading}>Discard</button>
                                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                        {actionLoading ? 'Saving...' : (formData.id ? 'Save Product' : 'Add Product')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Adjustment Modal */}
                {showAdjustModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '420px' }}>
                            <div className="modal-header">
                                <div className="flex items-center gap-3">
                                    <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowAdjustModal(false)}>
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <h2>Adjust Stock</h2>
                                        <p className="subtitle">{adjustData.name}</p>
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleAdjustment} className="modal-body-form">
                                <div className="managed-form">
                                    <div className="form-group">
                                        <label>Adjustment Value (+/-)</label>
                                        <input
                                            type="number"
                                            value={adjustData.adjustment}
                                            onChange={e => setAdjustData({ ...adjustData, adjustment: e.target.value })}
                                            required
                                            autoFocus
                                            placeholder="e.g. 50 or -10"
                                        />
                                        <small className="help-text">Use positive values for re-stocking, negative for damage/loss.</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Reason for Adjustment</label>
                                        <select 
                                            value={adjustData.reason} 
                                            onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}
                                            required
                                        >
                                            <option value="Purchase">Inbound Purchase / Restock</option>
                                            <option value="Sale">Direct Sale / Correction</option>
                                            <option value="Return">Customer Return</option>
                                            <option value="Damage">Damage / Expiry</option>
                                            <option value="Inventory Count">Audit / Inventory Count</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)} disabled={actionLoading}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                        {actionLoading ? 'Saving...' : 'Save Adjustment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* History Modal */}
                {showHistoryModal && (
                    <div className="modal-overlay">
                        <div className="modal-content wide-modal" style={{ maxWidth: '700px' }}>
                            <div className="modal-header">
                                <div className="flex items-center gap-3">
                                    <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowHistoryModal(false)}>
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <h2>Product History</h2>
                                        <p className="subtitle">View stock movement for this product.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="history-table-container">
                                <table className="stock-table history-table">
                                    <thead>
                                         <tr>
                                             <th>DATE & TIME</th>
                                             <th style={{ textAlign: 'center' }}>CHANGE</th>
                                             <th>REASON</th>
                                             <th>ADJUSTED BY</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {selectedStockHistory.length === 0 ? (
                                             <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>No adjustment history found for this product.</td></tr>
                                         ) : selectedStockHistory.map(h => (
                                             <tr key={h.id}>
                                                 <td>
                                                     <div className="date-display">
                                                         <span>{new Date(h.transaction_date).toLocaleDateString()}</span>
                                                         <small>{new Date(h.transaction_date).toLocaleTimeString()}</small>
                                                     </div>
                                                 </td>
                                                 <td style={{ textAlign: 'center' }}>
                                                     <span className={`movement-chip ${h.change_amount > 0 ? 'plus' : 'minus'}`}>
                                                         {h.change_amount > 0 ? '+' : ''}{h.change_amount}
                                                     </span>
                                                 </td>
                                                 <td><span className="reason-text">{h.reason}</span></td>
                                                 <td>
                                                     <div className="user-ref">
                                                         <div className="avatar-sm">{h.user_name?.charAt(0)}</div>
                                                         <span>{h.user_name || 'System'}</span>
                                                     </div>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                </table>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close Archive</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default StockList;
