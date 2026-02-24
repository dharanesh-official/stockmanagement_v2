

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, Platform, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Share2, Printer, Eye } from 'lucide-react-native';

const InvoiceScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [loading, setLoading] = useState(true);
    const [htmlContent, setHtmlContent] = useState('');
    const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'actions'


    useEffect(() => {
        fetchInvoiceData();
    }, [orderId]);

    const fetchInvoiceData = async () => {
        try {
            const [saleRes, itemsRes, paymentsRes, settingsRes] = await Promise.all([
                api.get(`/sales/${orderId}`),
                api.get(`/sales/items/${orderId}`),
                api.get(`/sales/payments/${orderId}`),
                api.get('/settings')
            ]);

            const sale = saleRes.data;
            const items = itemsRes.data;
            const payments = paymentsRes.data;
            const company = settingsRes.data || { company_name: 'Secuvra Stock Manager', company_address: 'Enterprise Plaza, Tech Hub' };

            const html = generateHtml(sale, items, payments, company);
            setHtmlContent(html);
            setLoading(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate invoice');
            navigation.goBack();
        }
    };

    const generateHtml = (sale, items, payments, company) => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalAmount = parseFloat(sale.total_amount);
        const paidAmount = parseFloat(sale.paid_amount || 0);
        const balanceDue = totalAmount - paidAmount;

        const itemsRows = items.map((item, index) => `
            <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${index + 1}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${item.name}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">${item.quantity}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">₹${parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold;">₹${(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        const paymentsRows = payments.length === 0 ?
            `<tr><td colspan="3" style="text-align: center; font-style: italic; padding: 1rem;">No separate payment records. Initial payment is included in totals.</td></tr>` :
            payments.map(p => `
                <tr>
                    <td style="padding: 8px;">${new Date(p.transaction_date).toLocaleDateString()}</td>
                    <td style="padding: 8px;">${p.notes || '-'}</td>
                    <td style="padding: 8px; text-align: right;">₹${parseFloat(p.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('');

        return `
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; -webkit-print-color-adjust: exact; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
                    .company-name { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 5px; }
                    .company-address { color: #64748b; font-size: 14px; max-width: 250px; line-height: 1.5; }
                    .invoice-title { font-size: 32px; font-weight: 900; color: #10b981; text-align: right; margin-bottom: 10px; }
                    .meta-row { display: flex; justify-content: flex-end; margin-bottom: 5px; font-size: 14px; }
                    .meta-label { color: #64748b; font-weight: 700; width: 100px; }
                    .meta-value { font-weight: 700; min-width: 120px; text-align: left; padding-left: 10px; }
                    .billing-section { margin-bottom: 30px; }
                    .section-title { font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em; }
                    .shop-name { font-size: 18px; font-weight: 800; margin-bottom: 5px; }
                    .customer-name { color: #10b981; font-weight: 700; margin-bottom: 5px; }
                    .shop-details { color: #64748b; font-size: 14px; line-height: 1.5; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: #f8fafc; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
                    .summary { display: flex; justify-content: flex-end; margin-bottom: 40px; }
                    .totals { width: 250px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #64748b; }
                    .grand-total { border-top: 2px solid #f1f5f9; paddingTop: 15px; marginTop: 10px; color: #1e293b; font-size: 18px; font-weight: 800; }
                    .footer { text-align: center; padding-top: 30px; border-top: 1px dashed #e2e8f0; font-size: 12px; color: #94a3b8; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="company-name">${company.company_name}</div>
                        <div class="company-address">${company.company_address}</div>
                    </div>
                    <div>
                        <div class="invoice-title">INVOICE</div>
                        <div class="meta-row">
                            <span class="meta-label">INVOICE ID</span>
                            <span class="meta-value">#${sale.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">DATE</span>
                            <span class="meta-value">${new Date(sale.transaction_date).toLocaleDateString()}</span>
                        </div>

                    </div>
                </div>

                <div class="billing-section">
                    <div class="section-title">BILL TO:</div>
                    <div class="shop-name">${sale.shop_name || 'Direct Sale'}</div>
                    <div class="customer-name">${sale.customer_name}</div>
                    <div class="shop-details">
                        ${sale.shop_address || ''}<br/>
                        Phone: ${sale.shop_phone || sale.customer_phone || 'N/A'}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">#</th>
                            <th>Item Description</th>
                            <th style="text-align: right;">Qty</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemsRows}</tbody>
                </table>

                <div class="summary">
                    <div class="totals">
                        <div class="total-row">
                            <span>Order Total</span>
                            <span>₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="total-row">
                            <span>${balanceDue < 0 ? 'Amount Received' : 'Amount Paid'}</span>
                            <span style="color: #059669;">₹${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        ${balanceDue < 0 ? `
                        <div class="total-row">
                            <span>Change Returned</span>
                            <span style="color: #f59e0b;">₹${Math.abs(balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        ` : balanceDue > 0 ? `
                        <div class="total-row grand-total">
                            <span>Balance Due</span>
                            <span style="color: #ef4444;">₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="billing-section">
                    <div class="section-title">PAYMENT HISTORY</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>${paymentsRows}</tbody>
                    </table>
                </div>

                <div class="footer">
                    This is a computer-generated invoice and does not require a physical signature.<br/>
                    Thank you for your business! Salesman: ${sale.salesman_name}
                </div>
            </body>
            </html>
        `;
    };

    const handleShare = async () => {
        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to share invoice');
        }
    };

    const handlePrint = async () => {
        try {
            await Print.printAsync({ html: htmlContent });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to print');
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#374151" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Invoice</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'preview' && styles.activeTab]}
                    onPress={() => setViewMode('preview')}
                >
                    <Eye size={20} color={viewMode === 'preview' ? '#059669' : '#6b7280'} />
                    <Text style={[styles.tabText, viewMode === 'preview' && styles.activeTabText]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'actions' && styles.activeTab]}
                    onPress={() => setViewMode('actions')}
                >
                    <Printer size={20} color={viewMode === 'actions' ? '#059669' : '#6b7280'} />
                    <Text style={[styles.tabText, viewMode === 'actions' && styles.activeTabText]}>Actions</Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'preview' ? (
                <View style={styles.webViewContainer}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: htmlContent }}
                        style={styles.webView}
                        scalesPageToFit={true}
                    />
                </View>
            ) : (
                <View style={styles.actionsContainer}>
                    <Text style={styles.previewText}>Invoice Actions</Text>
                    <Text style={styles.previewSub}>Print or share the invoice with your customer</Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.btn, styles.printBtn]} onPress={handlePrint}>
                            <Printer size={24} color="#374151" />
                            <Text style={styles.btnTextDark}>Print Invoice</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.shareBtn]} onPress={handleShare}>
                            <Share2 size={24} color="white" />
                            <Text style={styles.btnTextLight}>Share PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

};


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', elevation: 2 },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    backText: { fontSize: 16, color: '#374151', marginLeft: 8 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: '#e5e7eb', margin: 16, borderRadius: 8, padding: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 6, gap: 8 },
    activeTab: { backgroundColor: 'white', elevation: 2 },
    tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
    activeTabText: { color: '#059669' },

    // WebView Preview
    webViewContainer: { flex: 1, margin: 16, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', elevation: 2 },
    webView: { flex: 1 },

    // Actions Container
    actionsContainer: { flex: 1, padding: 24 },
    previewText: { fontSize: 24, fontWeight: 'bold', color: '#059669', marginBottom: 8, textAlign: 'center', marginTop: 40 },
    previewSub: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
    actions: { gap: 16 },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 12 },
    printBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db' },
    shareBtn: { backgroundColor: '#059669' },
    btnTextDark: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    btnTextLight: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});

export default InvoiceScreen;
