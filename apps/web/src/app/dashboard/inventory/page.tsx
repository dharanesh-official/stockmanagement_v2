'use client';

import { useState } from 'react';
import {
    Search,
    Plus,
    Filter,
    Download,
    MoreHorizontal,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Archive,
    AlertTriangle
} from 'lucide-react';

// Data cleared
const PRODUCTS: any[] = [];

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // Helper to determine stock status color and text
    const getStockStatus = (stock: number, threshold: number) => {
        if (stock <= 5) return { color: '#ef4444', label: 'Critical', bg: '#fee2e2' };
        if (stock <= threshold) return { color: '#f59e0b', label: 'Low Stock', bg: '#fef3c7' };
        return { color: '#10b981', label: 'In Stock', bg: '#d1fae5' };
    };

    const getStockPercentage = (stock: number) => {
        // Just for visual bar length, cap at 100
        return Math.min(stock, 100);
    };

    return (
        <div>
            {/* Header Section */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-h2">Product Management</h1>
                        <p className="text-gray-500">Centralized control for enterprise inventory across all regions.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn btn-outline">
                            <Download size={18} style={{ marginRight: '8px' }} />
                            Export CSV
                        </button>
                        <button className="btn btn-primary">
                            <Plus size={18} style={{ marginRight: '8px' }} />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="flex-1" style={{ position: 'relative', minWidth: '240px' }}>
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by SKU, Product Name or Tags..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="select-wrapper">
                            <select className="custom-select" style={{ paddingRight: '2rem' }}>
                                <option>All Categories</option>
                                <option>Electronics</option>
                                <option>Furniture</option>
                                <option>Apparel</option>
                            </select>
                        </div>

                        <div className="select-wrapper">
                            <select className="custom-select" style={{ paddingRight: '2rem' }}>
                                <option>All Warehouses</option>
                                <option>Main Hub</option>
                                <option>East Wing</option>
                            </select>
                        </div>

                        <div className="select-wrapper">
                            <select className="custom-select" style={{ paddingRight: '2rem' }}>
                                <option>Stock Status</option>
                                <option>In Stock</option>
                                <option>Low Stock</option>
                                <option>Out of Stock</option>
                            </select>
                        </div>

                        <button className="btn btn-outline text-gray-500">
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Table */}
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Batch / Expiry</th>
                                <th>Price</th>
                                <th style={{ width: '200px' }}>Stock Level</th>
                                <th>Tax</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PRODUCTS.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <Archive size={48} color="#e5e7eb" />
                                            <div>
                                                <p style={{ fontWeight: 500, color: '#374151' }}>No products found</p>
                                                <p style={{ fontSize: '0.875rem' }}>Add items to your inventory to get started.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                PRODUCTS.map((product) => {
                                    const status = getStockStatus(product.stock, product.threshold);
                                    return (
                                        <tr key={product.id}>
                                            <td className="font-semibold text-gray-500 text-xs">{product.sku}</td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div style={{
                                                        width: 40, height: 40,
                                                        borderRadius: 8,
                                                        background: '#f3f4f6',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#9ca3af'
                                                    }}>
                                                        {/* Placeholder icon based on category logic could go here */}
                                                        <Archive size={20} />
                                                    </div>
                                                    <span className="font-semibold">{product.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: '#f3f4f6',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    color: '#4b5563'
                                                }}>
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    <div><span style={{ fontWeight: 600 }}>B:</span> {product.batchNumber || 'N/A'}</div>
                                                    <div><span style={{ fontWeight: 600 }}>E:</span> {product.expiryDate || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="font-semibold">₹{product.price?.toFixed(2)}</td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span style={{ color: status.color === '#ef4444' ? status.color : 'inherit' }}>
                                                            {status.label === 'Critical' && 'Critical Low'}
                                                            {status.label === 'Low Stock' && 'Reorder Soon'}
                                                            {status.label === 'In Stock' && ''}
                                                        </span>
                                                        <span className="text-gray-900">{product.stock}</span>
                                                    </div>
                                                    <div style={{ height: 6, width: '100%', background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${getStockPercentage(product.stock)}%`,
                                                            height: '100%',
                                                            background: status.color,
                                                            borderRadius: 10
                                                        }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-gray-500">{product.tax}</td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <button className="action-btn" title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="action-btn" title="Delete" style={{ color: '#ef4444' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Only show if products exist) */}
                {PRODUCTS.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center" style={{ backgroundColor: '#fafafa' }}>
                        <div className="text-sm text-gray-500">
                            Showing 1-10 of {PRODUCTS.length} products
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled>
                                <ChevronLeft size={16} />
                            </button>
                            <button className="btn btn-primary" style={{ width: 32, height: 32, padding: 0 }}>1</button>
                            <button className="btn btn-outline" style={{ padding: '0.4rem' }} disabled>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
