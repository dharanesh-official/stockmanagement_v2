import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Printer, ArrowLeft, Download, Mail, Building2, Store, User, FileText } from 'lucide-react';
import './Invoice.css';

const Invoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [items, setItems] = useState([]);
    const [payments, setPayments] = useState([]);
    const [company, setCompany] = useState({ company_name: 'Secuvra Stock Manager', company_address: 'Enterprise Plaza, Tech Hub' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchCompanySettings();
    }, [id]);

    const fetchData = async () => {
        try {
            const [saleRes, itemsRes, paymentsRes] = await Promise.all([
                api.get(`/sales/${id}`),
                api.get(`/sales/items/${id}`),
                api.get(`/sales/payments/${id}`)
            ]);
            setSale(saleRes.data);
            setItems(itemsRes.data);
            setPayments(paymentsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanySettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data && res.data.company_name) {
                setCompany(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="loading-container">Generating Invoice...</div>;
    if (!sale) return <div className="error-container">Invoice not found.</div>;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return (
        <div className="invoice-page-container">
            <div className="invoice-actions no-print">
                <button onClick={() => navigate(-1)} className="btn-action">
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="btn-action btn-primary">
                        <Printer size={18} /> Print Invoice
                    </button>
                </div>
            </div>

            <div className="invoice-paper" id="invoice-content">
                <header className="invoice-header">
                    <div className="company-info">
                        <div className="company-logo">
                            <Building2 size={32} color="#10b981" />
                            <span>{company.company_name}</span>
                        </div>
                        <p className="company-address">{company.company_address}</p>
                    </div>
                    <div className="invoice-meta">
                        <h1>INVOICE</h1>
                        <div className="meta-row">
                            <span className="label">INVOICE ID</span>
                            <span className="value">: &nbsp;ORD-{sale.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="meta-row">
                            <span className="label">DATE</span>
                            <span className="value">: &nbsp;{new Date(sale.transaction_date).toLocaleDateString('en-GB').replace(/\//g, '.')}</span>
                        </div>
                        <div className="meta-row">
                            <span className="label">STATUS</span>
                            <span className="value status-badge">: &nbsp;{sale.type === 'order' ? 'ORDERED' : sale.type.toUpperCase()}</span>
                        </div>
                    </div>
                </header>

                <div className="invoice-billing">
                    <div className="billing-box">
                        <div className="section-title">TO:</div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{sale.shop_name}</h3>
                        <p style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.5rem', fontSize: '1rem' }}>{sale.customer_name}</p>
                        <p>{sale.shop_address}</p>
                        <p>Phone: {sale.shop_phone}</p>
                    </div>
                </div>

                <div className="invoice-table-container">
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item Description</th>
                                <th className="text-right">Qty</th>
                                <th className="text-right">Unit Price</th>
                                <th className="text-right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td className="font-bold">{item.name}</td>
                                    <td className="text-right">{item.quantity}</td>
                                    <td className="text-right">₹{parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right font-bold">₹{(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-summary">
                    <div className="notes-section">
                        <h4>Notes & Instructions</h4>
                        <p>{sale.notes || 'No additional notes provided for this transaction.'}</p>
                    </div>
                    <div className="totals-section">
                        <div className="total-row">
                            <span>Order Total</span>
                            <span>₹{parseFloat(sale.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="total-row">
                            <span>Amount Paid</span>
                            <span className="text-emerald-600">₹{parseFloat(sale.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="total-row grand-total">
                            <span>Balance Due</span>
                            <span className={parseFloat(sale.total_amount) - parseFloat(sale.paid_amount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                ₹{(parseFloat(sale.total_amount) - parseFloat(sale.paid_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="invoice-payments">
                <h4>Payment History</h4>
                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic', padding: '1rem' }}>No separate payment records. Initial payment is included in totals.</td>
                            </tr>
                        )}
                        {payments.map((p, i) => (
                            <tr key={i}>
                                <td>{new Date(p.transaction_date).toLocaleDateString()}</td>
                                <td>{p.notes}</td>
                                <td className="text-right">₹{parseFloat(p.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="invoice-footer">
                <p className="disclaimer">This is a computer-generated invoice and does not require a physical signature.</p>
                <div className="footer-bottom">
                    <p>Thank you for your business!</p>
                    <p>Salesman: {sale.salesman_name}</p>
                </div>
            </footer>
        </div>
        </div >
    );
};

export default Invoice;
