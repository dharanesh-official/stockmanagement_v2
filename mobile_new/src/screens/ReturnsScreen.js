import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView
} from 'react-native';
import api from '../services/api';
import { 
    RotateCcw, Search, Plus, X, ArrowLeft, History, 
    FileText, ShoppingBag, CreditCard, ChevronRight, CornerUpLeft
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const ReturnsScreen = ({ navigation }) => {
    const { user, hasPermission } = useAuth();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    
    // Form for new return
    const [formData, setFormData] = useState({
        transaction_id: '',
        customer_id: '',
        shop_id: '',
        reason: '',
        items: [] // { stock_id, product_name, quantity, refund_price }
    });

    const [availableSales, setAvailableSales] = useState([]);
    const [fetchingSales, setFetchingSales] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const res = await api.get('/returns');
            setReturns(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentSales = async () => {
        try {
            setFetchingSales(true);
            const res = await api.get('/sales?limit=20');
            // Filter only completed sales/orders
            setAvailableSales(res.data.filter(s => s.type === 'order' || s.type === 'sale'));
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingSales(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const openCreateModal = () => {
        resetForm();
        fetchRecentSales();
        setModalVisible(true);
    };

    const resetForm = () => {
        setFormData({
            transaction_id: '',
            customer_id: '',
            shop_id: '',
            reason: '',
            items: []
        });
    };

    const selectSale = async (sale) => {
        try {
            const res = await api.get(`/sales/${sale.id}/items`);
            const saleItems = res.data.map(it => ({
                stock_id: it.stock_id,
                product_name: it.name,
                quantity: '1',
                max_quantity: it.quantity,
                refund_price: String(it.price)
            }));
            
            setFormData({
                ...formData,
                transaction_id: sale.id,
                customer_id: sale.customer_id,
                shop_id: sale.shop_id,
                items: saleItems
            });
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch sale items');
        }
    };

    const handleCreateReturn = async () => {
        if (!formData.transaction_id || formData.items.length === 0) {
            Alert.alert('Validation', 'Please select a sale and items to return');
            return;
        }

        try {
            setSaving(true);
            await api.post('/returns', {
                ...formData,
                items: formData.items.map(it => ({
                    stock_id: it.stock_id,
                    quantity: parseInt(it.quantity),
                    refund_price: parseFloat(it.refund_price)
                }))
            });
            setModalVisible(false);
            fetchReturns();
            Alert.alert('Success', 'Return processed and stock adjusted');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to process return');
        } finally {
            setSaving(false);
        }
    };

    const openView = async (ret) => {
        setSelectedReturn(ret);
        try {
            const res = await api.get(`/returns/${ret.id}/items`);
            setReturnItems(res.data);
            setViewModalVisible(true);
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch return details');
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openView(item)}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.retNumber}>{item.return_number}</Text>
                    <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <CreditCard size={14} color="#64748b" />
                    <Text style={styles.infoText}>Ref: {item.original_invoice || 'Manual'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <ShoppingBag size={14} color="#64748b" />
                    <Text style={styles.infoText}>{item.shop_name}</Text>
                </View>
                <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Refund Amount</Text>
                    <Text style={styles.amountValue}>₹{Number(item.total_refund_amount).toLocaleString()}</Text>
                </View>
            </View>
            
            <View style={styles.cardFooter}>
                <Text style={styles.userText}>By {item.processed_by}</Text>
                <CornerUpLeft size={16} color="#cbd5e1" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Returns & Refunds</Text>
                    <Text style={styles.subtitle}>Inventory reversal and credit management</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#f43f5e" /></View>
            ) : (
                <FlatList
                    data={returns}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No return history found</Text>}
                />
            )}

            {hasPermission('sales', 'edit') && (
                <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            )}

            {/* Create Return Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Process Item Return</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {!formData.transaction_id ? (
                                <View>
                                    <Text style={styles.label}>Select Original Bill/Invoice</Text>
                                    {fetchingSales ? (
                                        <ActivityIndicator color="#f43f5e" />
                                    ) : (
                                        availableSales.map(sale => (
                                            <TouchableOpacity 
                                                key={sale.id} 
                                                style={styles.saleOption}
                                                onPress={() => selectSale(sale)}
                                            >
                                                <View>
                                                    <Text style={styles.saleMain}>{sale.invoice_number}</Text>
                                                    <Text style={styles.saleSub}>{sale.shop_name} • ₹{sale.total_amount}</Text>
                                                </View>
                                                <ChevronRight size={18} color="#cbd5e1" />
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            ) : (
                                <View>
                                    <View style={styles.selectedSaleBox}>
                                        <View>
                                            <Text style={styles.selectedLabel}>Returning Items for Bill:</Text>
                                            <Text style={styles.selectedVal}>{availableSales.find(s => s.id === formData.transaction_id)?.invoice_number}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setFormData({...formData, transaction_id: '', items: []})}>
                                            <Text style={styles.changeBtn}>Change</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.label}>Reason for Return</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={formData.reason} 
                                        onChangeText={t => setFormData({...formData, reason: t})}
                                        placeholder="Damaged, wrong item, customer request, etc."
                                    />

                                    <Text style={styles.label}>Returned Items</Text>
                                    {formData.items.map((item, idx) => (
                                        <View key={idx} style={styles.itemRow}>
                                            <Text style={styles.itemName}>{item.product_name}</Text>
                                            <View style={styles.row}>
                                                <View style={{ flex: 1, marginRight: 8 }}>
                                                    <Text style={styles.subLabel}>Qty (Max {item.max_quantity})</Text>
                                                    <TextInput 
                                                        style={styles.smallInput} 
                                                        value={String(item.quantity)}
                                                        onChangeText={t => {
                                                            const newItems = [...formData.items];
                                                            newItems[idx].quantity = t;
                                                            setFormData({...formData, items: newItems});
                                                        }}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.subLabel}>Refund Price</Text>
                                                    <TextInput 
                                                        style={styles.smallInput} 
                                                        value={item.refund_price}
                                                        onChangeText={t => {
                                                            const newItems = [...formData.items];
                                                            newItems[idx].refund_price = t;
                                                            setFormData({...formData, items: newItems});
                                                        }}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    <TouchableOpacity 
                                        style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                                        onPress={handleCreateReturn}
                                        disabled={saving}
                                    >
                                        <Text style={styles.saveBtnText}>{saving ? 'Processing...' : 'Confirm Return'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* View Return Modal */}
            <Modal visible={viewModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Return Receipt</Text>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        {selectedReturn && (
                            <ScrollView>
                                <View style={styles.receiptHeader}>
                                    <RotateCcw size={32} color="#f43f5e" />
                                    <Text style={styles.receiptTitle}>Adjustment Note</Text>
                                    <Text style={styles.receiptId}>{selectedReturn.return_number}</Text>
                                </View>

                                <View style={styles.receiptDetail}>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Original Invoice</Text>
                                        <Text style={styles.receiptValue}>{selectedReturn.original_invoice}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Customer</Text>
                                        <Text style={styles.receiptValue}>{selectedReturn.customer_name}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Reason</Text>
                                        <Text style={styles.receiptValue}>{selectedReturn.reason || 'Not specified'}</Text>
                                    </View>
                                </View>

                                <Text style={styles.sectionTitle}>Returned Inventory</Text>
                                {returnItems.map((it, idx) => (
                                    <View key={idx} style={styles.receiptItem}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.riName}>{it.product_name}</Text>
                                            <Text style={styles.riSub}>{it.quantity} items @ ₹{it.refund_price}</Text>
                                        </View>
                                        <Text style={styles.riTotal}>-₹{Number(it.total_refund_price).toLocaleString()}</Text>
                                    </View>
                                ))}

                                <View style={styles.grandTotal}>
                                    <Text style={styles.gtLabel}>Total Refund Credit</Text>
                                    <Text style={styles.gtValue}>₹{Number(selectedReturn.total_refund_amount).toLocaleString()}</Text>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff1f2' },
    header: { padding: 24, backgroundColor: 'white' },
    title: { fontSize: 26, fontWeight: 'bold', color: '#881337' },
    subtitle: { fontSize: 13, color: '#9f1239', marginTop: 4 },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    retNumber: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    dateText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    statusBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold', color: '#166534' },
    cardBody: { marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    infoText: { fontSize: 14, color: '#475569' },
    amountBox: { backgroundColor: '#fff1f2', padding: 12, borderRadius: 12, marginTop: 8 },
    amountLabel: { fontSize: 11, color: '#be123c', marginBottom: 2 },
    amountValue: { fontSize: 18, fontWeight: 'bold', color: '#9f1239' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    userText: { fontSize: 11, color: '#94a3b8' },
    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#f43f5e', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#94a3b8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#881337' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 12 },
    saleOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    saleMain: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    saleSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
    selectedSaleBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff1f2', padding: 16, borderRadius: 12, marginBottom: 20 },
    selectedLabel: { fontSize: 10, color: '#be123c' },
    selectedVal: { fontSize: 16, fontWeight: 'bold', color: '#9f1239' },
    changeBtn: { color: '#3b82f6', fontWeight: 'bold' },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 },
    itemRow: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12 },
    itemName: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
    subLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
    smallInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, fontSize: 14 },
    row: { flexDirection: 'row' },
    saveBtn: { backgroundColor: '#881337', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    receiptHeader: { alignItems: 'center', marginBottom: 24 },
    receiptTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 12 },
    receiptId: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
    receiptDetail: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 20 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    receiptLabel: { fontSize: 13, color: '#64748b' },
    receiptValue: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#881337', marginBottom: 12 },
    receiptItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    riName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    riSub: { fontSize: 12, color: '#94a3b8' },
    riTotal: { fontSize: 14, fontWeight: 'bold', color: '#f43f5e' },
    grandTotal: { marginTop: 20, padding: 16, backgroundColor: '#fff1f2', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    gtLabel: { fontSize: 15, fontWeight: 'bold', color: '#be123c' },
    gtValue: { fontSize: 20, fontWeight: 'bold', color: '#9f1239' }
});

export default ReturnsScreen;
