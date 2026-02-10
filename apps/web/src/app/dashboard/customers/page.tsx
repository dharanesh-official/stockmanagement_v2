'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import { api, Customer, Brand } from '@/services/api';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        address: '',
        brandId: '',
    });

    useEffect(() => {
        fetchCustomers();
        fetchBrands();
    }, [selectedBrand]);

    async function fetchCustomers() {
        try {
            setLoading(true);
            const endpoint = selectedBrand ? `/customers?brandId=${selectedBrand}` : '/customers';
            const data = await api.get<Customer[]>(endpoint);
            setCustomers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch customers');
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
            if (editingCustomer) {
                await api.patch(`/customers/${editingCustomer.id}`, formData);
            } else {
                await api.post('/customers', formData);
            }
            closeModal();
            fetchCustomers();
        } catch (err: any) {
            alert(err.message || `Failed to ${editingCustomer ? 'update' : 'create'} customer`);
        }
    }

    function openCreateModal() {
        setEditingCustomer(null);
        setFormData({ fullName: '', phoneNumber: '', email: '', address: '', brandId: '' });
        setShowModal(true);
    }

    function openEditModal(customer: Customer) {
        setEditingCustomer(customer);
        setFormData({
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber || '',
            email: customer.email || '',
            address: customer.address || '',
            brandId: customer.brandId,
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({ fullName: '', phoneNumber: '', email: '', address: '', brandId: '' });
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        } catch (err: any) {
            alert(err.message || 'Failed to delete customer');
        }
    }

    if (loading && customers.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <p style={{ color: '#6b7280' }}>Loading customers...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Customer Management</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Manage customer information and purchase history.</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add Customer
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
                            <th>Customer Name</th>
                            <th>Contact</th>
                            <th>Address</th>
                            <th>Brand</th>
                            <th>Total Orders</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Users size={48} color="#e5e7eb" />
                                        <p>No customers found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Users size={16} color="#6b7280" />
                                            <strong>{customer.fullName}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {customer.phoneNumber && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                                                    <Phone size={12} color="#6b7280" />
                                                    <span>{customer.phoneNumber}</span>
                                                </div>
                                            )}
                                            {customer.email && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                    <Mail size={12} />
                                                    <span>{customer.email}</span>
                                                </div>
                                            )}
                                            {!customer.phoneNumber && !customer.email && '-'}
                                        </div>
                                    </td>
                                    <td>
                                        {customer.address ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                <MapPin size={12} />
                                                <span>{customer.address}</span>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td>{customer.brand?.name || '-'}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: '#dbeafe',
                                            color: '#1e40af',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {customer._count?.orders || 0}
                                        </span>
                                    </td>
                                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" title="Edit" onClick={() => openEditModal(customer)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon" title="Delete" onClick={() => handleDelete(customer.id)}>
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

            {/* Create/Edit Customer Modal */}
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
                            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="+91 98765 43210"
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="customer@example.com"
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        resize: 'vertical',
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
                                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
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
