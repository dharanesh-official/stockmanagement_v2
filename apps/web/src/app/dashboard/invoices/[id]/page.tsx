'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { api } from '@/services/api';

interface InvoiceItem {
    id: string;
    quantity: number;
    unitPrice: number;
    productName: string;
    sku: string;
}
// ...
// This edit is for the interface at line 6


interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    issuedAt: string;
    dueDate: string;
    status: string;
    order: {
        orderNumber: string;
        customer: {
            fullName: string;
            email: string;
            phone: string;
            address?: string;
        };
        shop?: {
            name: string;
            address?: string;
        };
        brand: {
            name: string;
            contactEmail?: string;
        };
        items: InvoiceItem[];
    };
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchInvoice();
    }, [id]);

    async function fetchInvoice() {
        try {
            setLoading(true);
            const data = await api.get<Invoice>(`/invoices/${id}`);
            setInvoice(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch invoice');
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoice...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
    if (!invoice) return <div style={{ padding: '2rem' }}>Invoice not found</div>;

    const { customer, shop, brand } = invoice.order;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', backgroundColor: 'white', minHeight: '100vh' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <button
                    onClick={() => router.back()}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handlePrint}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Printer size={16} /> Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '2px solid #f3f4f6' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>INVOICE</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>#{invoice.invoiceNumber}</p>
                    <div style={{ marginTop: '1rem' }}>
                        <span className={`status-badge status-${invoice.status.toLowerCase() === 'paid' ? 'active' : 'warning'}`}>
                            {invoice.status}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{brand.name}</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>{brand.contactEmail}</p>
                </div>
            </div>

            {/* Bill To / Ship To */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                <div style={{ width: '45%' }}>
                    <h4 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bill To:</h4>
                    <p style={{ fontWeight: 600, fontSize: '1.125rem', margin: 0 }}>{customer.fullName}</p>
                    <p style={{ color: '#4b5563', margin: '0.25rem 0' }}>{customer.email}</p>
                    <p style={{ color: '#4b5563', margin: 0 }}>{customer.phone}</p>
                    {customer.address && <p style={{ color: '#4b5563', marginTop: '0.25rem' }}>{customer.address}</p>}
                </div>
                <div style={{ width: '45%' }}>
                    <h4 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Shop Details:</h4>
                    {shop ? (
                        <>
                            <p style={{ fontWeight: 600, fontSize: '1.125rem', margin: 0 }}>{shop.name}</p>
                            {shop.address && <p style={{ color: '#4b5563', marginTop: '0.25rem' }}>{shop.address}</p>}
                        </>
                    ) : (
                        <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No shop associated</p>
                    )}

                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#6b7280' }}>Issued Date:</span>
                            <span style={{ fontWeight: 500 }}>{new Date(invoice.issuedAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6b7280' }}>Due Date:</span>
                            <span style={{ fontWeight: 500 }}>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', marginBottom: '2rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '1rem 0', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '1rem 0', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '1rem 0', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem' }}>Price</th>
                        <th style={{ textAlign: 'right', padding: '1rem 0', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.order.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '1rem 0' }}>
                                <div style={{ fontWeight: 600 }}>{item.productName || 'Unknown Product'}</div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>SKU: {item.sku || 'N/A'}</div>
                            </td>
                            <td style={{ textAlign: 'center', padding: '1rem 0' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '1rem 0' }}>₹{Number(item.unitPrice).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '1rem 0', fontWeight: 600 }}>
                                ₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '2px solid #111827' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Total</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4338ca' }}>₹{Number(invoice.amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                <p>Thank you for your business!</p>
                <p style={{ marginTop: '0.5rem' }}>Please make checks payable to {brand.name}</p>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background-color: white;
                    }
                    /* Ensure full width standard page */
                    @page {
                        margin: 0.5in;
                    }
                }
            `}</style>
        </div>
    );
}
