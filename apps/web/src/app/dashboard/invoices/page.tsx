'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: 'DRAFT' | 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    issuedAt: string;
    dueDate: string;
    order: {
        id: string;
        orderNumber: string;
        customer: {
            fullName: string;
        };
        brand: {
            name: string;
        };
        shop?: {
            name: string;
        };
    };
}

import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID': return <span className="status-badge status-active"><CheckCircle size={14} /> Paid</span>;
            case 'UNPAID': return <span className="status-badge status-draft"><Clock size={14} /> Unpaid</span>;
            case 'OVERDUE': return <span className="status-badge status-archived"><AlertCircle size={14} /> Overdue</span>;
            case 'CANCELLED': return <span className="status-badge status-archived">Cancelled</span>;
            default: return <span className="status-badge status-draft">Draft</span>;
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoices...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 className="text-h2">Invoices</h2>
                    <p className="text-sm text-gray-500">Manage and view all generated invoices.</p>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer / Shop</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <FileText size={48} color="#e5e7eb" style={{ marginBottom: '1rem' }} />
                                    <p>No invoices found.</p>
                                </td>
                            </tr>
                        ) : (
                            invoices.map(invoice => (
                                <tr key={invoice.id}>
                                    <td style={{ fontWeight: 600 }}><code>{invoice.invoiceNumber}</code></td>
                                    <td>{new Date(invoice.issuedAt).toLocaleDateString()}</td>
                                    <td className="wrap">
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{invoice.order.customer?.fullName || 'Unknown Customer'}</div>
                                            {invoice.order.shop && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{invoice.order.shop.name}</div>}
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{invoice.order.brand?.name}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>₹{Number(invoice.amount).toFixed(2)}</td>
                                    <td>{getStatusBadge(invoice.status)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn-icon"
                                                title="View details"
                                                onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Download PDF"
                                                onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                                            >
                                                <Download size={16} />
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
    );
}
