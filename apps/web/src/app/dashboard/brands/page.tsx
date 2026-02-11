'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, Building2 } from 'lucide-react';
import { api, Brand } from '@/services/api';

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logoUrl: '',
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    async function fetchBrands() {
        try {
            setLoading(true);
            const data = await api.get<Brand[]>('/brands');
            setBrands(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch brands');
            console.error('Error fetching brands:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingBrand) {
                await api.patch(`/brands/${editingBrand.id}`, formData);
            } else {
                await api.post('/brands', formData);
            }
            closeModal();
            fetchBrands();
        } catch (err: any) {
            alert(err.message || `Failed to ${editingBrand ? 'update' : 'create'} brand`);
        }
    }

    function openCreateModal() {
        setEditingBrand(null);
        setFormData({ name: '', slug: '', logoUrl: '' });
        setShowModal(true);
    }

    function openEditModal(brand: Brand) {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            slug: brand.slug,
            logoUrl: brand.logoUrl || '',
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingBrand(null);
        setFormData({ name: '', slug: '', logoUrl: '' });
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this brand?')) return;

        try {
            await api.delete(`/brands/${id}`);
            fetchBrands();
        } catch (err: any) {
            alert(err.message || 'Failed to delete brand');
        }
    }

    function generateSlug(name: string) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading brands...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 className="text-h2">Brand Management</h2>
                    <p className="text-sm text-gray-500">Manage tenant brands and their configurations.</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Onboard New Brand
                </button>
            </div>

            {error && (
                <div className="p-4 mb-4" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Brand Name</th>
                            <th>Slug</th>
                            <th>Status</th>
                            <th>Products</th>
                            <th>Warehouses</th>
                            <th>Users</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Globe size={48} color="#e5e7eb" />
                                        <p>No brands onboarded yet.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            brands.map((brand) => (
                                <tr key={brand.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Building2 size={16} color="#6b7280" />
                                            <strong>{brand.name}</strong>
                                        </div>
                                    </td>
                                    <td><code>{brand.slug}</code></td>
                                    <td>
                                        <span className={`status-badge status-${brand.status.toLowerCase()}`}>
                                            {brand.status}
                                        </span>
                                    </td>
                                    <td>{brand._count?.products || 0}</td>
                                    <td>{brand._count?.warehouses || 0}</td>
                                    <td>{brand._count?.users || 0}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" title="Edit" onClick={() => openEditModal(brand)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon" title="Delete" onClick={() => handleDelete(brand.id)}>
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

            {/* Create Brand Modal */}
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
                            {editingBrand ? 'Edit Brand' : 'Create New Brand'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Brand Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                                    }}
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Slug *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                    {editingBrand ? 'Update Brand' : 'Create Brand'}
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
