'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Phone, Mail, MapPin, Search, X } from 'lucide-react';
import { api, Customer } from '@/services/api';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        try {
            setLoading(true);
            const data = await api.get<Customer[]>('/customers');
            setCustomers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch customers');
        } finally {
            setLoading(false);
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
        setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
        setShowModal(true);
    }

    function openEditModal(customer: Customer) {
        setEditingCustomer(customer);
        setFormData({
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber || '',
            email: customer.email || '',
            address: customer.address || '',
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({ fullName: '', phoneNumber: '', email: '', address: '' });
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

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phoneNumber?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && customers.length === 0) {
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
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Customer Directory</h2>
                    <p className="text-gray-500 mt-1">Manage client profiles and purchase relationships.</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 active:scale-95"
                    onClick={openCreateModal}
                >
                    <Plus size={20} />
                    New Customer
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl mb-6 border border-rose-100 font-medium">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Users size={64} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-lg font-medium">No customers found</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-14 w-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xl">
                                    {customer.fullName.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => openEditModal(customer)}>
                                        <Edit2 size={18} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleDelete(customer.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">{customer.fullName}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-4">
                                <Users size={12} className="text-primary" />
                                {customer._count?.orders || 0} Transactions
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                {customer.phoneNumber && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Phone size={14} /></div>
                                        {customer.phoneNumber}
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Mail size={14} /></div>
                                        <span className="truncate">{customer.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium h-10 overflow-hidden">
                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 shrink-0"><MapPin size={14} /></div>
                                    <span className="line-clamp-2">{customer.address || "No address provided"}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 bg-gray-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{editingCustomer ? 'Edit Client' : 'New Client'}</h3>
                                <p className="text-white/60 text-xs mt-1">Profile management and contact details</p>
                            </div>
                            <button onClick={closeModal} className="text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="space-y-2 mb-6">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Legal Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                        placeholder="user@domain.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Primary Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                                    placeholder="Street, City, State, ZIP..."
                                />
                            </div>

                            <div className="flex gap-4">
                                <button type="button" className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95" onClick={closeModal}>
                                    Discard
                                </button>
                                <button type="submit" className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    {editingCustomer ? 'Save Details' : 'Register Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
