'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Shield, User as UserIcon, Mail, Search, Edit2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api, User } from '@/services/api';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const data = await api.get<User[]>('/users');
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && users.length === 0) {
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
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Access Control</h2>
                    <p className="text-gray-500 mt-1">Manage administrative and field staff accounts.</p>
                </div>
                <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg active:scale-95">
                    <UserPlus size={20} />
                    Create Account
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl mb-6 border border-rose-100">
                    {error}
                </div>
            )}

            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Shield className="mx-auto text-gray-100 mb-4" size={64} />
                        <p className="text-lg font-medium">No system users found</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl ${user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {user.fullName.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">{user.fullName}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                {user.role === 'ADMIN' ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        <ShieldCheck size={10} /> Full Admin
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                        <UserIcon size={10} /> Sales Staff
                                    </span>
                                )}
                                {user.isActive ? (
                                    <span className="text-[10px] font-black uppercase text-emerald-500">Active</span>
                                ) : (
                                    <span className="text-[10px] font-black uppercase text-rose-500">Suspended</span>
                                )}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Mail size={14} /></div>
                                    <span className="truncate">{user.email}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Role Helper Info */}
            <div className="mt-12 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-amber-500" /> System Roles
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h5 className="font-bold text-gray-800 mb-1">Administrator (ADMIN)</h5>
                        <p className="text-xs text-gray-500 leading-relaxed">Full access to inventory management, financial reports, user permissions, and system settings. Can manage all facets of the operation.</p>
                    </div>
                    <div>
                        <h5 className="font-bold text-gray-800 mb-1">Sales Person (SALES_PERSON)</h5>
                        <p className="text-xs text-gray-500 leading-relaxed">Restricted access to customers, product catalog, and order creation. Focused on field operations and client management only.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
