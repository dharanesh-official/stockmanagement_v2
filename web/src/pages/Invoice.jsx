import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Printer, ArrowLeft, Download, Mail, Building2, Store, User, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
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

    if (loading) return <LoadingSpinner fullScreen message="Generating Invoice..." />;
    if (!sale) return <div className="error-container">Invoice not found.</div>;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const finalTotal = subtotal + Number(sale.gst_amount || 0) + Number(sale.shipping_charge || 0) - Number(sale.discount_amount || 0);

    return (
        <div className="invoice-page-container">
            <div className="invoice-actions no-print">
                <button onClick={() => navigate(-1)} className="btn-action">
                    <ArrowLeft size={18} /> Exit Viewer
                </button>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="btn-action btn-primary">
                        <Printer size={18} /> Print Record
                    </button>
                </div>
            </div>

            <div className="invoice-paper" id="invoice-content">
                <header className="invoice-header">
                    <div className="company-info">
                        <div className="company-logo">
                            <div className="logo-box">
                                <Building2 size={32} />
                            </div>
                            <div className="info">
                                <h2>{company.company_name || 'Secuvra Enterprise'}</h2>
                                <p className="gst-text">GSTIN: {company.gst_number || '27AAACG0000A1Z5'}</p>
                            </div>
                        </div>
                        <p className="company-address">{company.company_address || '123 Business Avenue, Tech Park, Industrial Estate'}</p>
                        <p className="company-contact">Support: +91 98765 43210 • info@secuvra.io</p>
                    </div>
                    <div className="invoice-meta">
                        <h1>TAX INVOICE</h1>
                        <div className="meta-grid">
                            <div className="meta-item">
                                <span className="label">Invoice No</span>
                                <span className="value">{sale.invoice_number || `ORD-${sale.id.slice(0, 8).toUpperCase()}`}</span>
                            </div>
                            <div className="meta-item">
                                <span className="label">Issue Date</span>
                                <span className="value">{new Date(sale.transaction_date).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="meta-item">
                                <span className="label">Order Type</span>
                                <span className="value">{sale.order_type || 'Direct Sale'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="invoice-contacts">
                    <div className="contact-box billing">
                        <div className="section-hdr">BILLING ADDRESS</div>
                        <h3>{sale.customer_name}</h3>
                        <p>{sale.shop_name || 'Individual Client'}</p>
                        <p>{sale.shop_address || 'Registered address unavailable'}</p>
                        <div className="contact-sub">
                            <span>Phone: <strong>{sale.shop_phone || 'N/A'}</strong></span>
                        </div>
                    </div>
                    <div className="contact-box shipping">
                        <div className="section-hdr">SHIPPING / SITE ADDRESS</div>
                        <p><strong>{sale.shop_name || 'Direct Delivery'}</strong></p>
                        <p>{sale.shop_location || sale.shop_address || 'As per billing address'}</p>
                        <div className="delivery-method">
                            <Truck size={14} /> <span>Surface Logistics</span>
                        </div>
                    </div>
                </div>

                <div className="invoice-table-outer">
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th width="60">S.NO</th>
                                <th>DESCRIPTION OF GOODS / SERVICES</th>
                                <th width="100" className="text-center">QTY</th>
                                <th width="120" className="text-right">UNIT RATE</th>
                                <th width="140" className="text-right">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>
                                        <div className="item-main">
                                            <span className="item-name">{item.name}</span>
                                            {item.sku && <span className="item-sku">SKU: {item.sku}</span>}
                                        </div>
                                    </td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">₹{parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right font-black">₹{(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-lower">
                    <div className="lower-left">
                        <div className="qr-payment">
                            <div className="qr-container">
                                <div className="qr-box">
                                    {/* QR Code Placeholder UI */}
                                    <div style={{ width: '100%', height: '100%', background: '#fff', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '1px' }}>
                                        {Array(100).fill(0).map((_, i) => (
                                            <div key={i} style={{ background: Math.random() > 0.5 ? '#000' : 'transparent', height: '10px' }}></div>
                                        ))}
                                    </div>
                                    <div className="qr-overlay"><CreditCard size={20} /></div>
                                </div>
                                <div className="qr-info">
                                    <p className="qr-label">SCAN TO PAY VIA UPI</p>
                                    <p className="qr-address">secuvra@upi</p>
                                </div>
                            </div>
                        </div>

                        <div className="terms-section">
                            <h4>TERMS & CONDITIONS</h4>
                            <ul>
                                <li>Goods once sold will not be taken back.</li>
                                <li>Subject to local jurisdiction.</li>
                                <li>Please quote order reference in all communication.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="lower-right">
                        <div className="calculation-panel">
                            <div className="calc-row">
                                <span>TAXABLE VALUE (SUBTOTAL)</span>
                                <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            <div className="calc-row">
                                <span>GST (CONSOLIDATED)</span>
                                <strong>+ ₹{Number(sale.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            <div className="calc-row">
                                <span>LOGISTICS CHARGE</span>
                                <strong>+ ₹{Number(sale.shipping_charge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            <div className="calc-row discount">
                                <span>DISCRETIONARY DISCOUNT</span>
                                <strong className="text-red-500">- ₹{Number(sale.discount_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            <div className="calc-divider"></div>
                            <div className="calc-row total-row">
                                <div className="total-label">
                                    <span>GRAND TOTAL</span>
                                    <small>(INCLUSIVE OF ALL TAXES)</small>
                                </div>
                                <span className="total-value">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="payment-summary-box">
                                <div className="p-row">
                                    <span>Captured Amount</span>
                                    <strong>₹{parseFloat(sale.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                </div>
                                <div className="p-row balance">
                                    <span>Current Balance Due</span>
                                    <strong className={finalTotal - parseFloat(sale.paid_amount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                        ₹{Math.max(0, finalTotal - parseFloat(sale.paid_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="payment-history-segment">
                    <div className="hdr-flex">
                        <History size={16} /> <h3>TRANSACTION AUDIT LOG</h3>
                    </div>
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>Transaction Date</th>
                                <th>Description / Reference</th>
                                <th>Method</th>
                                <th className="text-right">Settled Amount</th>
                                <th className="text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-gray-400 py-4 italic">No secondary transactions recorded. Record recovery payments in financial module if balance remains.</td>
                                </tr>
                            ) : (
                                payments.map((p, i) => (
                                    <tr key={i}>
                                        <td>{new Date(p.transaction_date).toLocaleDateString()}</td>
                                        <td>{p.notes || 'Recovery Payment'}</td>
                                        <td className="text-capitalize">{p.payment_method || 'Unspecified'}</td>
                                        <td className="text-right font-bold">₹{parseFloat(p.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="text-right"><span className="badge-payment">SUCCESS</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="invoice-doc-footer">
                    <div className="footer-cols">
                        <div className="auth-box">
                            <div className="signature-line"></div>
                            <p>Customer Signature</p>
                        </div>
                        <div className="auth-box">
                            <p className="salesman-tag">Handled By: <strong>{sale.salesman_name}</strong></p>
                            <div className="signature-line primary"></div>
                            <p>Authorized Signatory</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Invoice;
