'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, CheckCircle, Clock, AlertCircle, Search, Calendar, DollarSign, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    paidAmount: number;
    status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    issuedAt: string;
    dueDate: string;
    order: {
        id: string;
        orderNumber: string;
        customer: {
            fullName: string;
        };
    };
}

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    async function fetchInvoices() {
        try {
            setLoading(true);
            const data = await api.get<Invoice[]>('/invoices');
            setInvoices(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    }

    const filteredInvoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.order.customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PARTIALLY_PAID': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'UNPAID': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'OVERDUE': return 'bg-gray-900 text-white border-gray-900';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    if (loading && invoices.length === 0) {
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
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Billing & Invoices</h2>
                    <p className="text-gray-500 mt-1">Track payments, issue receipts, and manage accounts receivable.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl mb-6 border border-rose-100">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Invoice #, Order # or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-4">Invoice Identification</th>
                                <th className="px-6 py-4">Client Holder</th>
                                <th className="px-6 py-4">Financial Status</th>
                                <th className="px-6 py-4">Amount Summary</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileText size={48} className="text-gray-100" />
                                            <p className="text-lg font-medium">No records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-black text-gray-900 tracking-tight">{invoice.invoiceNumber}</div>
                                            <div className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-tighter">Order: {invoice.order.orderNumber}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900">{invoice.order.customer?.fullName || 'Walk-in Client'}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 w-fit ${getStatusStyles(invoice.status)}`}>
                                                {invoice.status === 'PAID' && <CheckCircle size={10} />}
                                                {invoice.status === 'UNPAID' && <AlertCircle size={10} />}
                                                {invoice.status === 'PARTIALLY_PAID' && <Clock size={10} />}
                                                {invoice.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900">₹{Number(invoice.amount).toLocaleString()}</div>
                                            <div className="text-[10px] text-emerald-600 font-medium">Collected: ₹{Number(invoice.paidAmount).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                                                <Calendar size={12} className="text-gray-300" />
                                                {new Date(invoice.issuedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-rose-400 mt-1">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Collected</p>
                        <h4 className="text-xl font-black text-gray-900">₹{invoices.reduce((s, i) => s + Number(i.paidAmount), 0).toLocaleString()}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Outstanding</p>
                        <h4 className="text-xl font-black text-rose-600">₹{invoices.reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0).toLocaleString()}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Pending Invoices</p>
                        <h4 className="text-xl font-black text-gray-900">{invoices.filter(i => i.status !== 'PAID').length}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Average Deal</p>
                        <h4 className="text-xl font-black text-gray-900">₹{invoices.length > 0 ? (invoices.reduce((s, i) => s + Number(i.amount), 0) / invoices.length).toFixed(0) : 0}</h4>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendingUp({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
    );
}
