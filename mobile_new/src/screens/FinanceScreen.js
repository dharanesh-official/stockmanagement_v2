import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView, RefreshControl
} from 'react-native';
import api from '../services/api';
import { 
    DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, 
    CreditCard, X, Plus, ChevronRight, RotateCcw, 
    ArrowDownLeft, ArrowUpRight, Calendar, ArrowLeft
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const FinanceScreen = () => {
    const { user, hasPermission } = useAuth();
    const [dues, setDues] = useState([]);
    const [history, setHistory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dues');
    const [stats, setStats] = useState({ outstanding: 0, todayCollection: 0, totalReturns: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dues Payment Modal
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Order Credit Payment Modal
    const [orderPaymentModalVisible, setOrderPaymentModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderPaymentAmount, setOrderPaymentAmount] = useState('');

    const fetchAllData = async () => {
        try {
            const timestamp = Date.now();
            const [custRes, saleRes] = await Promise.all([
                api.get(`/customers?t=${timestamp}`),
                api.get(`/sales?t=${timestamp}`)
            ]);

            // Process Dues
            const allCustomers = custRes.data;
            const sortedDues = allCustomers
                .filter(c => Number(c.balance) > 0.01)
                .sort((a, b) => Number(b.balance) - Number(a.balance));
            setDues(sortedDues);

            // Process History (Payments and Returns)
            const transactions = saleRes.data.filter(t => t.type === 'payment' || t.type === 'return');
            setHistory(transactions);

            // Process Credit Notes (Orders with balance)
            const orderList = saleRes.data.filter(t => (t.type === 'order' || t.type === 'sale') && (Number(t.total_amount) - Number(t.paid_amount)) > 0.01);
            setOrders(orderList);

            // Stats
            const totalOutstanding = sortedDues.reduce((sum, c) => sum + Number(c.balance), 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCollection = transactions
                .filter(h => {
                    const hDate = new Date(h.transaction_date);
                    hDate.setHours(0, 0, 0, 0);
                    return hDate.getTime() === today.getTime() && h.type === 'payment';
                })
                .reduce((sum, h) => sum + Number(h.total_amount), 0);

            const totalReturns = transactions
                .filter(h => h.type === 'return')
                .reduce((sum, h) => sum + Number(h.total_amount), 0);

            setStats({ outstanding: totalOutstanding, todayCollection, totalReturns });

        } catch (err) {
            console.error('Finance sync error:', err);
            Alert.alert('Error', 'Failed to sync finance data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAllData();
    };

    const handleRecordPayment = async () => {
        if (!paymentAmount || isNaN(paymentAmount)) {
            Alert.alert('Validation', 'Please enter a valid amount');
            return;
        }

        try {
            setSaving(true);
            await api.post('/sales', {
                customer_id: selectedCustomer.id,
                type: 'payment',
                amount: parseFloat(paymentAmount),
                notes: paymentNotes
            });
            setPaymentModalVisible(false);
            setPaymentAmount('');
            setPaymentNotes('');
            setSelectedCustomer(null);
            fetchAllData();
            Alert.alert('Success', 'Payment recorded and balance updated!');
        } catch (err) {
            Alert.alert('Error', 'Failed to record payment');
        } finally {
            setSaving(false);
        }
    };

    const handleOrderPayment = async () => {
        if (!orderPaymentAmount || isNaN(orderPaymentAmount)) {
            Alert.alert('Validation', 'Please enter a valid amount');
            return;
        }

        try {
            setSaving(true);
            await api.put(`/sales/payment/${selectedOrder.id}`, {
                amountPaid: parseFloat(orderPaymentAmount)
            });
            setOrderPaymentModalVisible(false);
            setOrderPaymentAmount('');
            setSelectedOrder(null);
            fetchAllData();
            Alert.alert('Success', 'Order balance updated!');
        } catch (err) {
            Alert.alert('Error', 'Failed to update order payment');
        } finally {
            setSaving(false);
        }
    };

    const renderDueItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.customerName}>{item.full_name}</Text>
                    <Text style={styles.customerPhone}>{item.phone || 'No phone'}</Text>
                </View>
                <Text style={styles.dueAmount}>₹{Number(item.balance).toLocaleString()}</Text>
            </View>
            <View style={styles.cardInfo}>
                <View style={[styles.badge, item.is_locked ? styles.badgeLocked : styles.badgePending]}>
                    {item.is_locked ? <AlertCircle size={10} color="#b91c1c" /> : <Clock size={10} color="#9a3412" />}
                    <Text style={[styles.badgeText, { color: item.is_locked ? '#b91c1c' : '#9a3412' }]}>
                        {item.is_locked ? 'Credit Locked' : 'Payments Pending'}
                    </Text>
                </View>
                <Text style={styles.creditLimit}>Limit: ₹{Number(item.credit_limit || 0).toLocaleString()}</Text>
            </View>
            {hasPermission('sales', 'create') && (
                <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => {
                        setSelectedCustomer(item);
                        setPaymentModalVisible(true);
                    }}
                >
                    <ArrowDownLeft size={16} color="white" />
                    <Text style={styles.payBtnText}>Collect Payment</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderHistoryItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.historyTitleRow}>
                    <View style={[styles.historyIconBox, { backgroundColor: item.type === 'payment' ? '#f0fdf4' : '#fff1f2' }]}>
                        {item.type === 'payment' ? <ArrowDownLeft size={18} color="#059669" /> : <RotateCcw size={18} color="#e11d48" />}
                    </View>
                    <View>
                        <Text style={styles.customerName}>{item.customer_name}</Text>
                        <Text style={styles.historyType}>{item.type?.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={[styles.historyAmount, { color: item.type === 'payment' ? '#059669' : '#e11d48' }]}>
                    {item.type === 'payment' ? '+' : '-'}₹{Number(item.total_amount).toLocaleString()}
                </Text>
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Calendar size={12} color="#94a3b8" />
                    <Text style={styles.footerText}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
                </View>
                {item.notes ? <Text style={styles.notesText}>"{item.notes}"</Text> : null}
            </View>
        </View>
    );

    const renderCreditItem = ({ item }) => {
        const balance = Number(item.total_amount) - Number(item.paid_amount);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.customerName}>{item.shop_name || 'No Shop'}</Text>
                        <Text style={styles.subText}>{item.customer_name}</Text>
                        <Text style={styles.invoiceSmall}>{item.invoice_number}</Text>
                    </View>
                    <View style={styles.creditAmountBox}>
                        <Text style={styles.creditLabel}>DUE</Text>
                        <Text style={styles.creditValue}>₹{balance.toLocaleString()}</Text>
                    </View>
                </View>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(Number(item.paid_amount) / Number(item.total_amount)) * 100}%` }]} />
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progLabel}>Paid: ₹{Number(item.paid_amount).toLocaleString()}</Text>
                        <Text style={styles.progLabel}>Total: ₹{Number(item.total_amount).toLocaleString()}</Text>
                    </View>
                </View>
                {balance > 0 && hasPermission('sales', 'edit') && (
                    <TouchableOpacity
                        style={[styles.payBtn, { backgroundColor: '#4f46e5' }]}
                        onPress={() => {
                            setSelectedOrder(item);
                            setOrderPaymentModalVisible(true);
                        }}
                    >
                        <CreditCard size={16} color="white" />
                        <Text style={styles.payBtnText}>Clear Bill Balance</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Stats Dashboard */}
            <View style={styles.statsDashboard}>
                <View style={styles.statStat}>
                    <Text style={styles.statStatLabel}>Outstandings</Text>
                    <Text style={[styles.statStatValue, { color: '#e11d48' }]}>₹{stats.outstanding.toLocaleString()}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statStat}>
                    <Text style={styles.statStatLabel}>Today Collection</Text>
                    <Text style={[styles.statStatValue, { color: '#059669' }]}>₹{stats.todayCollection.toLocaleString()}</Text>
                </View>
            </View>

            {/* Tabs Navigation */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'dues' && styles.tabBtnActive]} onPress={() => setActiveTab('dues')}>
                    <Text style={[styles.tabBtnText, activeTab === 'dues' && styles.tabBtnTextActive]}>Customer Dues</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'credit' && styles.tabBtnActive]} onPress={() => setActiveTab('credit')}>
                    <Text style={[styles.tabBtnText, activeTab === 'credit' && styles.tabBtnTextActive]}>Credit Bills</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]} onPress={() => setActiveTab('history')}>
                    <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>History</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#4f46e5" /></View>
            ) : (
                <FlatList
                    data={activeTab === 'dues' ? dues : activeTab === 'history' ? history : orders}
                    keyExtractor={item => item.id.toString()}
                    renderItem={activeTab === 'dues' ? renderDueItem : activeTab === 'history' ? renderHistoryItem : renderCreditItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllData} />}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <AlertCircle size={40} color="#cbd5e1" />
                            <Text style={styles.emptyBoxText}>No transactions found for this category</Text>
                        </View>
                    }
                />
            )}

            {/* Payment Modals (Same implementation but styled improved) */}
            <Modal animationType="slide" transparent={true} visible={paymentModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <TouchableOpacity style={styles.backBtnModal} onPress={() => setPaymentModalVisible(false)}>
                                    <ArrowLeft size={20} color="#475569" />
                                </TouchableOpacity>
                                <View>
                                    <Text style={styles.modalTitle}>Receive Payment</Text>
                                    <Text style={styles.modalSubtitle}>Record a new cash or digital inflow from the client.</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.modalTarget}>{selectedCustomer?.full_name}</Text>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputLabel}>Collection Amount (₹)</Text>
                            <TextInput
                                style={styles.modalInput}
                                keyboardType="numeric"
                                value={paymentAmount}
                                onChangeText={setPaymentAmount}
                                placeholder="0.00"
                                autoFocus
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputLabel}>Reference / Method</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={paymentNotes}
                                onChangeText={setPaymentNotes}
                                placeholder="GPay, Cash, Bill #, etc."
                            />
                        </View>
                        <TouchableOpacity style={[styles.modalSubmit, saving && { opacity: 0.6 }]} onPress={handleRecordPayment} disabled={saving}>
                            <Text style={styles.modalSubmitText}>{saving ? 'Recording...' : 'Update Balance'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={orderPaymentModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <TouchableOpacity style={styles.backBtnModal} onPress={() => setOrderPaymentModalVisible(false)}>
                                    <ArrowLeft size={20} color="#475569" />
                                </TouchableOpacity>
                                <View>
                                    <Text style={styles.modalTitle}>Settle Credit Bill</Text>
                                    <Text style={styles.modalSubtitle}>Apply partial or full payment to a specific invoice.</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.billBrief}>
                            <Text style={styles.briefLabel}>Bill #{selectedOrder?.invoice_number}</Text>
                            <Text style={styles.briefVal}>Outstanding: ₹{selectedOrder ? (Number(selectedOrder.total_amount) - Number(selectedOrder.paid_amount)).toLocaleString() : '0'}</Text>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            value={orderPaymentAmount}
                            onChangeText={setOrderPaymentAmount}
                            placeholder="Enter payment amount"
                        />
                        <TouchableOpacity style={styles.quickSettle} onPress={() => setOrderPaymentAmount((Number(selectedOrder.total_amount) - Number(selectedOrder.paid_amount)).toString())}>
                            <Text style={styles.quickSettleText}>Pay Full Outstanding</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalSubmit} onPress={handleOrderPayment} disabled={saving}>
                            <Text style={styles.modalSubmitText}>Apply Payment</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fdfcfe' },
    statsDashboard: { flexDirection: 'row', backgroundColor: 'white', margin: 16, padding: 20, borderRadius: 24, elevation: 4, shadowColor: '#4f46e5', shadowOpacity: 0.1 },
    statStat: { flex: 1, alignItems: 'center' },
    statStatLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    statStatValue: { fontSize: 20, fontWeight: 'bold' },
    statDivider: { width: 1, backgroundColor: '#f1f5f9' },
    tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 10 },
    tabBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9' },
    tabBtnActive: { backgroundColor: '#4f46e5' },
    tabBtnText: { fontSize: 14, color: '#64748b', fontWeight: 'bold' },
    tabBtnTextActive: { color: 'white' },
    listContainer: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    customerName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    customerPhone: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    dueAmount: { fontSize: 18, fontWeight: 'bold', color: '#e11d48' },
    cardInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgePending: { backgroundColor: '#fff7ed' },
    badgeLocked: { backgroundColor: '#fef2f2' },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    creditLimit: { fontSize: 11, color: '#94a3b8' },
    payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', padding: 14, borderRadius: 12 },
    payBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    historyType: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 1 },
    historyAmount: { fontSize: 16, fontWeight: 'bold' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 11, color: '#94a3b8' },
    notesText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
    subText: { fontSize: 12, color: '#64748b' },
    invoiceSmall: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    creditAmountBox: { alignItems: 'flex-end' },
    creditLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
    creditValue: { fontSize: 18, fontWeight: 'bold', color: '#e11d48' },
    progressContainer: { marginVertical: 12 },
    progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#059669' },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    progLabel: { fontSize: 10, color: '#94a3b8' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyBoxText: { marginTop: 12, color: '#94a3b8', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    backBtnModal: { 
        padding: 8, 
        backgroundColor: '#f1f5f9', 
        borderRadius: 50,
        marginRight: 4
    },
    modalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
    modalTarget: { fontSize: 16, color: '#4f46e5', fontWeight: 'bold', marginBottom: 24 },
    inputBox: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
    modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 18, color: '#1e293b' },
    modalSubmit: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
    modalSubmitText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    billBrief: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20 },
    briefLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    briefVal: { fontSize: 18, fontWeight: 'bold', color: '#e11d48' },
    quickSettle: { marginVertical: 12, alignSelf: 'center' },
    quickSettleText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 14 }
});

export default FinanceScreen;
