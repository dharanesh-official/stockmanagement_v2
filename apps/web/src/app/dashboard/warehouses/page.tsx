'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Warehouse as WarehouseIcon, MapPin } from 'lucide-react';
import { api, Warehouse, Brand } from '@/services/api';

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        brandId: '',
    });

    useEffect(() => {
        fetchWarehouses();
        fetchBrands();
    }, [selectedBrand]);

    async function fetchWarehouses() {
        try {
            setLoading(true);
            const endpoint = selectedBrand ? `/warehouses?brandId=${selectedBrand}` : '/warehouses';
            const data = await api.get<Warehouse[]>(endpoint);
            setWarehouses(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch warehouses');
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
            if (editingWarehouse) {
                await api.patch(`/warehouses/${editingWarehouse.id}`, formData);
            } else {
                await api.post('/warehouses', formData);
            }
            closeModal();
            fetchWarehouses();
        } catch (err: any) {
            alert(err.message || `Failed to ${editingWarehouse ? 'update' : 'create'} warehouse`);
        }
    }

    function openCreateModal() {
        setEditingWarehouse(null);
        setFormData({ name: '', location: '', brandId: '' });
        setShowModal(true);
    }

    function openEditModal(warehouse: Warehouse) {
        setEditingWarehouse(warehouse);
        setFormData({
            name: warehouse.name,
            location: warehouse.location || '',
            brandId: warehouse.brandId,
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingWarehouse(null);
        setFormData({ name: '', location: '', brandId: '' });
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this warehouse?')) return;

        try {
            await api.delete(`/warehouses/${id}`);
            fetchWarehouses();
        } catch (err: any) {
            alert(err.message || 'Failed to delete warehouse');
        }
    }

    if (loading && warehouses.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading warehouses...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Warehouse Management</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manage warehouse locations and stock distribution.</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add Warehouse
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="form-select"
                    style={{ minWidth: '200px' }}
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
                            <th>Warehouse Name</th>
                            <th>Location</th>
                            <th>Brand</th>
                            <th>Stock Items</th>
                            <th>Managers</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {warehouses.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <WarehouseIcon size={48} color="#e5e7eb" />
                                        <p>No warehouses found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            warehouses.map((warehouse) => (
                                <tr key={warehouse.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <WarehouseIcon size={16} color="#6b7280" />
                                            <strong>{warehouse.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        {warehouse.location ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                                                <MapPin size={14} />
                                                <span>{warehouse.location}</span>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td>{warehouse.brand?.name || '-'}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: '#dbeafe',
                                            color: '#1e40af',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {warehouse._count?.stocks || 0}
                                        </span>
                                    </td>
                                    <td>{warehouse._count?.managers || 0}</td>
                                    <td>{new Date(warehouse.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" title="Edit" onClick={() => openEditModal(warehouse)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon" title="Delete" onClick={() => handleDelete(warehouse.id)}>
                                                <Trash2 size={16} color="#ef4444" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Warehouse Modal */}
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
                            {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Warehouse Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., Mumbai, Maharashtra"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Brand *</label>
                                <select
                                    required
                                    value={formData.brandId}
                                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                    className="form-select"
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Select Brand</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                    {editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={closeModal}
                                >
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
