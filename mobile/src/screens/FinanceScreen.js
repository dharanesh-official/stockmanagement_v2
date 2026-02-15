
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView, RefreshControl
} from 'react-native';
import api from '../services/api';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, CreditCard, X, Plus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const FinanceScreen = () => {
    const { user, hasPermission } = useAuth();
    const [dues, setDues] = useState([]);
    const [history, setHistory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dues');
    const [stats, setStats] = useState({ outstanding: 0, todayCollection: 0 });
    const [refreshing, setRefreshing] = useState(false);

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

            // Process History
            const paymentsOnly = saleRes.data.filter(t => t.type === 'payment');
            setHistory(paymentsOnly);

            // Process Credit Notes
            const orderList = saleRes.data.filter(t => t.type === 'order');
            setOrders(orderList);

            // Stats
            const totalOutstanding = sortedDues.reduce((sum, c) => sum + Number(c.balance), 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCollection = paymentsOnly
                .filter(h => {
                    const hDate = new Date(h.transaction_date);
                    hDate.setHours(0, 0, 0, 0);
                    return hDate.getTime() === today.getTime();
                })
                .reduce((sum, h) => sum + Number(h.total_amount), 0);

            setStats({ outstanding: totalOutstanding, todayCollection });

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

    // General Payment (Dues)
    const handleRecordPayment = async () => {
        if (!paymentAmount || isNaN(paymentAmount)) {
            Alert.alert('Validation', 'Please enter a valid amount');
            return;
        }

        try {
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
            Alert.alert('Success', 'Payment recorded successfully!');
        } catch (err) {
            Alert.alert('Error', 'Failed to record payment');
        }
    };

    // Specific Order Payment (Credit Note)
    const handleOrderPayment = async () => {
        if (!orderPaymentAmount || isNaN(orderPaymentAmount)) {
            Alert.alert('Validation', 'Please enter a valid amount');
            return;
        }

        try {
            await api.put(`/sales/payment/${selectedOrder.id}`, {
                amountPaid: parseFloat(orderPaymentAmount)
            });
            setOrderPaymentModalVisible(false);
            setOrderPaymentAmount('');
            setSelectedOrder(null);
            fetchAllData();
            Alert.alert('Success', 'Order payment updated successfully!');
        } catch (err) {
            Alert.alert('Error', 'Failed to update order payment');
        }
    };

    const renderDueItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.dueAmount}>₹{Number(item.balance).toLocaleString()}</Text>
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.infoText}>{item.phone}</Text>
                <View style={[styles.badge, styles.badgePending]}>
                    <Clock size={12} color="#9a3412" />
                    <Text style={[styles.badgeText, { color: '#9a3412' }]}>{item.is_locked ? 'Locked' : 'Overdue'}</Text>
                </View>
            </View>
            {hasPermission('sales', 'create') && (
                <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => {
                        setSelectedCustomer(item);
                        setPaymentModalVisible(true);
                    }}
                >
                    <CreditCard size={16} color="white" />
                    <Text style={styles.payBtnText}>Record Payment</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderHistoryItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.customer_name}</Text>
                <Text style={[styles.amount, { color: '#059669' }]}>+₹{Number(item.total_amount).toLocaleString()}</Text>
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.date}>{new Date(item.transaction_date).toLocaleDateString()} {new Date(item.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                {item.shop_name && <Text style={styles.infoText}>{item.shop_name}</Text>}
            </View>
        </View>
    );

    const renderCreditItem = ({ item }) => {
        const balance = Number(item.total_amount) - Number(item.paid_amount);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.name}>{item.shop_name}</Text>
                        <Text style={styles.subText}>{item.customer_name}</Text>
                    </View>
                    <Text style={[styles.dueAmount, { color: '#dc2626' }]}>Due: ₹{balance.toLocaleString()}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.infoText}>Total: ₹{Number(item.total_amount).toLocaleString()}</Text>
                    <Text style={[styles.infoText, { color: '#059669' }]}>Paid: ₹{Number(item.paid_amount || 0).toLocaleString()}</Text>
                </View>
                {balance > 0 && hasPermission('sales', 'edit') && (
                    <TouchableOpacity
                        style={[styles.payBtn, { marginTop: 8 }]}
                        onPress={() => {
                            setSelectedOrder(item);
                            setOrderPaymentModalVisible(true);
                        }}
                    >
                        <CreditCard size={16} color="white" />
                        <Text style={styles.payBtnText}>Pay Balance</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

    return (
        <View style={styles.container}>
            {/* Stats Header */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Outstanding</Text>
                    <Text style={[styles.statValue, { color: '#dc2626' }]}>₹{stats.outstanding.toLocaleString()}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Today's Collection</Text>
                    <Text style={[styles.statValue, { color: '#059669' }]}>₹{stats.todayCollection.toLocaleString()}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, activeTab === 'dues' && styles.activeTab]} onPress={() => setActiveTab('dues')}>
                    <Text style={[styles.tabText, activeTab === 'dues' && styles.activeTabText]}>Dues</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'credit' && styles.activeTab]} onPress={() => setActiveTab('credit')}>
                    <Text style={[styles.tabText, activeTab === 'credit' && styles.activeTabText]}>Credit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => setActiveTab('history')}>
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <FlatList
                data={activeTab === 'dues' ? dues : activeTab === 'history' ? history : orders}
                keyExtractor={item => item.id.toString()}
                renderItem={activeTab === 'dues' ? renderDueItem : activeTab === 'history' ? renderHistoryItem : renderCreditItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No records found</Text>}
            />

            {/* Dues Payment Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={paymentModalVisible}
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Record Payment</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>For: {selectedCustomer?.full_name}</Text>

                        <Text style={styles.label}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={paymentAmount}
                            onChangeText={setPaymentAmount}
                            placeholder="0.00"
                            autoFocus
                        />

                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={styles.input}
                            value={paymentNotes}
                            onChangeText={setPaymentNotes}
                            placeholder="e.g. Cash, GPay"
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleRecordPayment}>
                            <Text style={styles.saveBtnText}>Confirm Payment</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Order Payment Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={orderPaymentModalVisible}
                onRequestClose={() => setOrderPaymentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order Payment</Text>
                            <TouchableOpacity onPress={() => setOrderPaymentModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        {selectedOrder && (
                            <>
                                <View style={styles.orderContext}>
                                    <Text style={styles.contextLabel}>Order #{selectedOrder.id}</Text>
                                    <View style={styles.contextRow}>
                                        <Text>Total: {Number(selectedOrder.total_amount).toLocaleString()}</Text>
                                        <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>
                                            Due: ₹{(Number(selectedOrder.total_amount) - Number(selectedOrder.paid_amount)).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.label}>Payment Amount (₹)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={orderPaymentAmount}
                                    onChangeText={setOrderPaymentAmount}
                                    placeholder="0.00"
                                    autoFocus
                                />

                                <TouchableOpacity
                                    style={styles.linkBtn}
                                    onPress={() => setOrderPaymentAmount((Number(selectedOrder.total_amount) - Number(selectedOrder.paid_amount)).toString())}
                                >
                                    <Text style={styles.linkText}>Settle Full Amount</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.saveBtn} onPress={handleOrderPayment}>
                                    <Text style={styles.saveBtnText}>Update Payment</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statsContainer: { flexDirection: 'row', backgroundColor: 'white', padding: 16, margin: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    statCard: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: '#e5e7eb' },
    statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
    tab: { marginRight: 16, paddingBottom: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#059669' },
    tabText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
    activeTabText: { color: '#059669', fontWeight: 'bold' },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    subText: { fontSize: 12, color: '#6b7280' },
    dueAmount: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },
    amount: { fontSize: 16, fontWeight: 'bold' },
    cardInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    infoText: { color: '#6b7280' },
    date: { color: '#6b7280' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
    badgePending: { backgroundColor: '#ffedd5' },
    badgeText: { fontSize: 12, fontWeight: '600' },
    payBtn: { flexDirection: 'row', backgroundColor: '#059669', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8 },
    payBtnText: { color: 'white', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    modalSubtitle: { marginBottom: 20, color: '#4b5563', fontWeight: '500' },
    label: { fontWeight: '600', marginBottom: 8, color: '#374151' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
    saveBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 24 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
    orderContext: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 },
    contextLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginBottom: 4 },
    contextRow: { flexDirection: 'row', justifyContent: 'space-between' },
    linkBtn: { marginBottom: 16, alignSelf: 'flex-start' },
    linkText: { color: '#059669', fontWeight: '600' }
});

export default FinanceScreen;
