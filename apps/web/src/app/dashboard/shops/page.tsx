'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Store, Phone, Mail, MapPin, User, Search } from 'lucide-react';
import { api, Shop, Brand } from '@/services/api';

export default function ShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phoneNumber: '',
        email: '',
        managerName: '',
        brandIds: [] as string[],
    });

    useEffect(() => {
        fetchShops();
        fetchBrands();
    }, [selectedBrand]);

    async function fetchShops() {
        try {
            setLoading(true);
            const endpoint = selectedBrand ? `/shops?brandId=${selectedBrand}` : '/shops';
            const data = await api.get<Shop[]>(endpoint);
            setShops(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch shops');
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
        if (formData.brandIds.length === 0) {
            alert('Please select at least one brand');
            return;
        }
        try {
            if (editingShop) {
                await api.patch(`/shops/${editingShop.id}`, formData);
            } else {
                await api.post('/shops', formData);
            }
            closeModal();
            fetchShops();
        } catch (err: any) {
            alert(err.message || `Failed to ${editingShop ? 'update' : 'create'} shop`);
        }
    }

    function openCreateModal() {
        setEditingShop(null);
        setFormData({ name: '', address: '', phoneNumber: '', email: '', managerName: '', brandIds: [] });
        setShowModal(true);
    }

    function openEditModal(shop: Shop) {
        setEditingShop(shop);
        setFormData({
            name: shop.name,
            address: shop.address || '',
            phoneNumber: shop.phoneNumber || '',
            email: shop.email || '',
            managerName: shop.managerName || '',
            brandIds: shop.brands ? shop.brands.map(b => b.id) : [],
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingShop(null);
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this shop?')) return;

        try {
            await api.delete(`/shops/${id}`);
            fetchShops();
        } catch (err: any) {
            alert(err.message || 'Failed to delete shop');
        }
    }

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.managerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && shops.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading shops...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Shop Management</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manage retail locations and contact details.</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add Shop
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search shops..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Shop Name</th>
                            <th>Location</th>
                            <th>Contact</th>
                            <th>Manager</th>
                            <th>Brand</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredShops.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Store size={48} color="#e5e7eb" />
                                        <p>No shops found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredShops.map((shop) => (
                                <tr key={shop.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '8px', color: '#059669' }}>
                                                <Store size={18} />
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{shop.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {shop.address ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                <MapPin size={14} />
                                                <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={shop.address}>
                                                    {shop.address}
                                                </span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {shop.phoneNumber && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                                                    <Phone size={12} color="#6b7280" />
                                                    <span>{shop.phoneNumber}</span>
                                                </div>
                                            )}
                                            {shop.email && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                    <Mail size={12} />
                                                    <span>{shop.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {shop.managerName ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                                                <User size={14} color="#6b7280" />
                                                <span>{shop.managerName}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {shop.brands && shop.brands.length > 0 ? (
                                                shop.brands.map(b => (
                                                    <span key={b.id} className="status-badge status-active" style={{ fontSize: '0.75rem' }}>
                                                        {b.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="status-badge status-archived" style={{ fontSize: '0.75rem' }}>No Brand</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" title="Edit" onClick={() => openEditModal(shop)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon" title="Delete" onClick={() => handleDelete(shop.id)}>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="text-h3" style={{ marginBottom: '1.5rem' }}>
                            {editingShop ? 'Edit Shop' : 'Add New Shop'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Shop Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        className="form-input"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address *</label>
                                <textarea
                                    required
                                    className="form-input"
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Manager Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.managerName}
                                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Brands *</label>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#fff' }}>
                                    {brands.length === 0 && <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No brands available</p>}
                                    {brands.map(brand => (
                                        <label key={brand.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.brandIds.includes(brand.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        brandIds: checked
                                                            ? [...prev.brandIds, brand.id]
                                                            : prev.brandIds.filter(id => id !== brand.id)
                                                    }));
                                                }}
                                                style={{ marginRight: '0.5rem', width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                                            />
                                            {brand.name}
                                        </label>
                                    ))}
                                </div>
                                {formData.brandIds.length === 0 && (
                                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>Please select at least one brand</p>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal} style={{ flex: 1 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                                    {editingShop ? 'Update Shop' : 'Create Shop'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
