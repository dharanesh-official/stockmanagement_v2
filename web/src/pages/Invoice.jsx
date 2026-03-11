import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Printer, ArrowLeft, Download, Mail, Building2, Store, User, FileText, Truck, History, CreditCard } from 'lucide-react';
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
    const finalTotal = subtotal + Number(sale.shipping_charge || 0) - Number(sale.discount_amount || 0);

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
                <div className="formal-invoice-header">
                    <div className="fi-top-row">
                        <div className="fi-company-details">
                            <h2 className="fi-company-name">{company.company_name || 'Secuvra Enterprise'}</h2>
                            <p className="fi-address">{company.company_address || '123 Business Avenue, Tech Park, Industrial Estate'}</p>
                            <p className="fi-contact">Mobile: +91 98765 43210 | Email: info@secuvra.io</p>
                            {company.gst_number && <p className="fi-gst">GSTIN: <strong>{company.gst_number}</strong></p>}
                        </div>
                        <div className="fi-invoice-title">
                            <h1>TAX INVOICE</h1>
                            <div className="fi-meta-box">
                                <div className="fi-meta-row">
                                    <span>Invoice No:</span>
                                    <strong>{sale.invoice_number}</strong>
                                </div>
                                <div className="fi-meta-row">
                                    <span>Invoice Date:</span>
                                    <strong>{new Date(sale.transaction_date).toLocaleDateString('en-GB')}</strong>
                                </div>
                                <div className="fi-meta-row">
                                    <span>Payment Method:</span>
                                    <strong>{sale.payment_method || 'N/A'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="fi-billing-row">
                        <div className="fi-bill-to">
                            <div className="fi-label">Bill To:</div>
                            <div className="fi-client-name">{sale.customer_name}</div>
                            <div className="fi-client-company">{sale.shop_name}</div>
                            <div className="fi-client-address">{sale.shop_address || 'N/A'}</div>
                            <div className="fi-client-phone">Phone: {sale.shop_phone || 'N/A'}</div>
                        </div>
                        <div className="fi-ship-to">
                            <div className="fi-label">Ship To / Place of Supply:</div>
                            <div className="fi-client-company">{sale.shop_name}</div>
                            <div className="fi-client-address">{sale.shop_location || sale.shop_address || 'As per billing'}</div>
                        </div>
                    </div>
                </div>

                <div className="fi-table-container">
                    <table className="fi-table">
                        <thead>
                            <tr>
                                <th width="5%">S.N.</th>
                                <th width="50%">Description of Goods</th>
                                <th width="10%">Qty</th>
                                <th width="15%">Unit Rate</th>
                                <th width="20%">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>
                                        <div className="fi-item-name">{item.name}</div>
                                        {item.sku && <div className="fi-item-sku">SKU: {item.sku}</div>}
                                    </td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">₹{parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-right">₹{(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                            {/* Empty rows to maintain professional length if needed */}
                            {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
                                <tr key={`empty-${i}`} className="empty-row">
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2" className="text-right no-border">Total Quantity: {items.reduce((s, i) => s + i.quantity, 0)}</td>
                                <td colSpan="2" className="fi-total-label">Subtotal</td>
                                <td className="text-right">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {Number(sale.shipping_charge) > 0 && (
                                <tr>
                                    <td colSpan="4" className="fi-total-label">Logistics/Shipping</td>
                                    <td className="text-right">+ ₹{Number(sale.shipping_charge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            {Number(sale.discount_amount) > 0 && (
                                <tr>
                                    <td colSpan="4" className="fi-total-label">Discount</td>
                                    <td className="text-right">- ₹{Number(sale.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            <tr className="grand-total-row">
                                <td colSpan="4" className="fi-grand-label">Grand Total (Inclusive of all taxes)</td>
                                <td className="fi-grand-value">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="fi-bottom-section">
                    <div className="fi-notes-area">
                        <div className="fi-section-title">Terms & Conditions:</div>
                        <ul className="fi-terms">
                            <li>Goods once sold will not be taken back or exchanged.</li>
                            <li>Payment should be made within 7 days of invoice date.</li>
                            <li>All disputes are subject to local jurisdiction.</li>
                        </ul>
                        
                        <div className="fi-bank-details" style={{ marginTop: '20px' }}>
                            <div className="fi-section-title">Bank Details:</div>
                            <p>Bank Name: <strong>Your Bank Name</strong></p>
                            <p>Account No: <strong>1234567890</strong></p>
                            <p>IFSC Code: <strong>BANK000123</strong></p>
                        </div>
                    </div>
                    
                    <div className="fi-sign-area">
                        <div className="fi-captured-info">
                            <p>Paid Amount: <strong>₹{parseFloat(sale.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                            <p>Balance Due: <strong>₹{Math.max(0, finalTotal - parseFloat(sale.paid_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                        </div>
                        <div className="fi-signatory-box">
                            <p className="fi-company-sign">For {company.company_name || 'Secuvra Enterprise'}</p>
                            <div className="fi-sign-space"></div>
                            <p className="fi-auth-label">Authorized Signatory</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Invoice;
