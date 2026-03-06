import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView
} from 'react-native';
import api from '../services/api';
import { 
    Package, Calendar, Truck, Plus, Trash2, Eye, X, 
    Search, CreditCard, ChevronRight, ShoppingBag, ShoppingCart
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const PurchasesScreen = () => {
    const { user, hasPermission } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [purchaseItems, setPurchaseItems] = useState([]); // items for viewing details

    // Form State
    const [formData, setFormData] = useState({
        supplier_id: '',
        reference_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
        paid_amount: '0',
        payment_method: 'Cash',
        items: [] // { stock_id, quantity, unit_cost }
    });

    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pRes, sRes, stRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/suppliers'),
                api.get('/stock')
            ]);
            setPurchases(pRes.data);
            setSuppliers(sRes.data);
            setStockItems(stRes.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { stock_id: '', quantity: '1', unit_cost: '0' }]
        });
    };

    const removeItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleCreatePurchase = async () => {
        if (!formData.supplier_id || formData.items.length === 0) {
            Alert.alert('Validation', 'Supplier and at least one item are required');
            return;
        }

        // Validate items
        for (const item of formData.items) {
            if (!item.stock_id || !item.quantity || parseFloat(item.quantity) <= 0) {
                Alert.alert('Validation', 'Please select a product and valid quantity for all items');
                return;
            }
        }

        try {
            setSaving(true);
            await api.post('/purchases', {
                ...formData,
                paid_amount: parseFloat(formData.paid_amount) || 0,
                items: formData.items.map(it => ({
                    ...it,
                    quantity: parseInt(it.quantity),
                    unit_cost: parseFloat(it.unit_cost)
                }))
            });
            setModalVisible(false);
            fetchData();
            resetForm();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to save purchase');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            supplier_id: '',
            reference_number: '',
            purchase_date: new Date().toISOString().split('T')[0],
            notes: '',
            paid_amount: '0',
            payment_method: 'Cash',
            items: []
        });
    };

    const openView = async (purchase) => {
        setSelectedPurchase(purchase);
        try {
            const res = await api.get(`/purchases/${purchase.id}/items`);
            setPurchaseItems(res.data);
            setViewModalVisible(true);
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch purchase details');
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openView(item)}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.refText}>Ref: {item.reference_number || 'N/A'}</Text>
                    <Text style={styles.dateText}>{new Date(item.purchase_date).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, item.payment_status === 'Paid' ? styles.statusPaid : styles.statusUnpaid]}>
                    <Text style={[styles.statusText, item.payment_status === 'Paid' ? styles.statusTextPaid : styles.statusTextUnpaid]}>
                        {item.payment_status}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Truck size={14} color="#64748b" />
                    <Text style={styles.supplierText}>{item.supplier_name || 'Direct Purchase'}</Text>
                </View>
                <View style={styles.amountRow}>
                    <View>
                        <Text style={styles.amountLabel}>Total</Text>
                        <Text style={styles.amountValue}>₹{Number(item.total_amount).toLocaleString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.amountLabel}>Paid</Text>
                        <Text style={[styles.amountValue, { color: '#059669' }]}>₹{Number(item.paid_amount).toLocaleString()}</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.cardFooter}>
                <View style={styles.userRow}>
                    <ShoppingBag size={12} color="#94a3b8" />
                    <Text style={styles.userText}>Recorded by {item.user_name}</Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Purchases</Text>
                <Text style={styles.headerSubtitle}>Manage stock intake from suppliers</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>
            ) : (
                <FlatList
                    data={purchases}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No purchases found</Text>}
                />
            )}

            {hasPermission('purchases', 'create') && (
                <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            )}

            {/* Create Purchase Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Purchase Order</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Supplier *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
                                {suppliers.map(s => (
                                    <TouchableOpacity 
                                        key={s.id} 
                                        style={[styles.chip, formData.supplier_id === s.id && styles.chipActive]}
                                        onPress={() => setFormData({ ...formData, supplier_id: s.id })}
                                    >
                                        <Text style={[styles.chipText, formData.supplier_id === s.id && styles.chipActiveText]}>{s.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Ref / Invoice #</Text>
                                    <TextInput style={styles.input} value={formData.reference_number} onChangeText={t => setFormData({ ...formData, reference_number: t })} placeholder="Optional" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.label}>Date</Text>
                                    <TextInput style={styles.input} value={formData.purchase_date} onChangeText={t => setFormData({ ...formData, purchase_date: t })} placeholder="YYYY-MM-DD" />
                                </View>
                            </View>

                            <View style={styles.divider} />
                            
                            <View style={styles.itemsHeader}>
                                <Text style={styles.label}>Items to Purchase</Text>
                                <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                                    <Text style={styles.addBtnText}>+ Add Item</Text>
                                </TouchableOpacity>
                            </View>

                            {formData.items.map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemLabel}>Product</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorShort}>
                                            {stockItems.map(s => (
                                                <TouchableOpacity 
                                                    key={s.id} 
                                                    style={[styles.smallChip, item.stock_id === s.id && styles.chipActive]}
                                                    onPress={() => updateItem(index, 'stock_id', s.id)}
                                                >
                                                    <Text style={[styles.smallChipText, item.stock_id === s.id && styles.chipActiveText]}>{s.item_name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                        <View style={styles.row}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.itemLabel}>Qty</Text>
                                                <TextInput style={styles.inputSmall} value={item.quantity} onChangeText={t => updateItem(index, 'quantity', t)} keyboardType="numeric" />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 8 }}>
                                                <Text style={styles.itemLabel}>Unit Cost</Text>
                                                <TextInput style={styles.inputSmall} value={item.unit_cost} onChangeText={t => updateItem(index, 'unit_cost', t)} keyboardType="numeric" />
                                            </View>
                                            <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(index)}>
                                                <Trash2 size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.divider} />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Paid Amount</Text>
                                    <TextInput style={styles.input} value={formData.paid_amount} onChangeText={t => setFormData({ ...formData, paid_amount: t })} keyboardType="numeric" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.label}>Payment Method</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {['Cash', 'Bank Transfer', 'UPI', 'Cheque'].map(m => (
                                            <TouchableOpacity 
                                                key={m} 
                                                style={[styles.smallChip, formData.payment_method === m && styles.chipActive]}
                                                onPress={() => setFormData({ ...formData, payment_method: m })}
                                            >
                                                <Text style={[styles.smallChipText, formData.payment_method === m && styles.chipActiveText]}>{m}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleCreatePurchase} disabled={saving}>
                                <Text style={styles.saveBtnText}>{saving ? 'Processing...' : 'Create Purchase'}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* View Purchase Modal */}
            <Modal visible={viewModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Purchase Details</Text>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        {selectedPurchase && (
                            <ScrollView>
                                <View style={styles.detailCard}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Supplier</Text>
                                        <Text style={styles.detailValue}>{selectedPurchase.supplier_name}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Date</Text>
                                        <Text style={styles.detailValue}>{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Total Amount</Text>
                                        <Text style={[styles.detailValue, { fontWeight: 'bold', color: '#0ea5e9' }]}>₹{Number(selectedPurchase.total_amount).toLocaleString()}</Text>
                                    </View>
                                </View>

                                <Text style={styles.sectionTitle}>Purchased Items</Text>
                                {purchaseItems.map((it, idx) => (
                                    <View key={idx} style={styles.detailItem}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailItemName}>{it.product_name}</Text>
                                            <Text style={styles.detailItemSub}>{it.quantity} units x ₹{it.unit_cost}</Text>
                                        </View>
                                        <Text style={styles.detailItemTotal}>₹{Number(it.total_cost).toLocaleString()}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f9ff' },
    header: { padding: 24, backgroundColor: 'white' },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#0c4a6e' },
    headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    refText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    dateText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusPaid: { backgroundColor: '#f0fdf4' },
    statusUnpaid: { backgroundColor: '#fff7ed' },
    statusText: { fontSize: 10, fontWeight: '700' },
    statusTextPaid: { color: '#166534' },
    statusTextUnpaid: { color: '#9a3412' },
    cardBody: { marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    supplierText: { fontSize: 14, color: '#475569', fontWeight: '500' },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
    amountLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2 },
    amountValue: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userText: { fontSize: 11, color: '#94a3b8' },
    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#0ea5e9', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#94a3b8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#0c4a6e' },
    label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 },
    selector: { flexDirection: 'row', marginBottom: 20 },
    selectorShort: { flexDirection: 'row', marginBottom: 10, height: 40 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, backgroundColor: '#f1f5f9', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
    chipText: { fontSize: 14, color: '#475569' },
    chipActiveText: { color: 'white', fontWeight: 'bold' },
    smallChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#f8fafc', marginRight: 8, borderWidth: 1, borderColor: '#f1f5f9' },
    smallChipText: { fontSize: 12, color: '#64748b' },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 16 },
    inputSmall: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, fontSize: 14, flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
    itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    addBtn: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addBtnText: { color: '#0ea5e9', fontWeight: 'bold', fontSize: 14 },
    itemRow: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12 },
    itemLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    removeBtn: { padding: 12, marginLeft: 8 },
    saveBtn: { backgroundColor: '#0ea5e9', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 24 },
    saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    detailCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 24 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    detailLabel: { color: '#64748b', fontSize: 14 },
    detailValue: { color: '#1e293b', fontSize: 14, fontWeight: '500' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 16 },
    detailItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    detailItemName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    detailItemSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    detailItemTotal: { fontSize: 15, fontWeight: 'bold', color: '#0ea5e9' }
});

export default PurchasesScreen;
