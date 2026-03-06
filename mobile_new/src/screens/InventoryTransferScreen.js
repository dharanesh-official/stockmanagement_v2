import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView
} from 'react-native';
import api from '../services/api';
import { 
    Move, ArrowRight, Plus, X, Search, 
    Calendar, User, Package, MapPin, CheckCircle2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const InventoryTransferScreen = () => {
    const { user, hasPermission } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    
    // Form for new transfer
    const [formData, setFormData] = useState({
        from_location: 'Main Warehouse',
        to_location: '',
        notes: '',
        items: [] // { stock_id, product_name, quantity }
    });

    const [stock, setStock] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transRes, stockRes] = await Promise.all([
                api.get('/transfers'),
                api.get('/stock')
            ]);
            setTransfers(transRes.data);
            setStock(stockRes.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load transfer history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({
            from_location: 'Main Warehouse',
            to_location: '',
            notes: '',
            items: []
        });
    };

    const addItem = (item) => {
        const existing = formData.items.find(it => it.stock_id === item.id);
        if (existing) return;
        setFormData({
            ...formData,
            items: [...formData.items, { stock_id: item.id, product_name: item.item_name, quantity: '1' }]
        });
    };

    const handleSave = async () => {
        if (!formData.to_location || formData.items.length === 0) {
            Alert.alert('Validation', 'Please provide a destination and at least one item');
            return;
        }

        try {
            setSaving(true);
            await api.post('/transfers', formData);
            setModalVisible(false);
            fetchData();
            resetForm();
            Alert.alert('Success', 'Transfer recorded successfully');
        } catch (err) {
            Alert.alert('Error', 'Failed to record transfer');
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitle}>
                    <Move size={18} color="#4f46e5" />
                    <Text style={styles.trfNumber}>{item.transfer_number}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <CheckCircle2 size={12} color="#059669" />
                    <Text style={styles.statusText}>{item.status || 'Completed'}</Text>
                </View>
            </View>

            <View style={styles.movementBox}>
                <View style={styles.locBox}>
                    <MapPin size={12} color="#64748b" />
                    <Text style={styles.locText}>{item.from_location}</Text>
                </View>
                <ArrowRight size={16} color="#cbd5e1" />
                <View style={styles.locBox}>
                    <MapPin size={12} color="#64748b" />
                    <Text style={[styles.locText, { color: '#4f46e5', fontWeight: 'bold' }]}>{item.to_location}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Calendar size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.metaItem}>
                    <User size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>{item.processed_by || 'Admin'}</Text>
                </View>
            </View>

            {item.notes ? (
                <View style={styles.notesBox}>
                    <Text style={styles.notesText}>"{item.notes}"</Text>
                </View>
            ) : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Inventory Movement</Text>
                <Text style={styles.subtitle}>Track inter-department or inter-warehouse transfers</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
            ) : (
                <FlatList
                    data={transfers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No transfer history found</Text>}
                />
            )}

            {hasPermission('stock', 'edit') && (
                <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Plus size={28} color="white" />
                </TouchableOpacity>
            )}

            {/* Create Transfer Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Initiate Movement</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Origin Location</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.from_location} 
                                onChangeText={t => setFormData({...formData, from_location: t})}
                            />

                            <Text style={styles.label}>Destination Warehouse / Shop</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.to_location} 
                                onChangeText={t => setFormData({...formData, to_location: t})}
                                placeholder="Main Warehouse"
                            />

                            <Text style={styles.label}>Movement Notes</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.notes} 
                                onChangeText={t => setFormData({...formData, notes: t})}
                                placeholder="Internal adjustment"
                            />

                            <Text style={styles.label}>Add Items</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stockScroll}>
                                {stock.map(s => (
                                    <TouchableOpacity 
                                        key={s.id} 
                                        style={styles.stockCard}
                                        onPress={() => addItem(s)}
                                    >
                                        <Package size={16} color="#64748b" />
                                        <Text style={styles.stockName}>{s.item_name}</Text>
                                        <Text style={styles.stockQty}>{s.quantity} available</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.label, { marginTop: 20 }]}>Selected Items</Text>
                            {formData.items.map((it, idx) => (
                                <View key={idx} style={styles.selectedItem}>
                                    <Text style={styles.siName}>{it.product_name}</Text>
                                    <View style={styles.siRight}>
                                        <TextInput 
                                            style={styles.siInput} 
                                            value={it.quantity} 
                                            onChangeText={t => {
                                                const newItems = [...formData.items];
                                                newItems[idx].quantity = t;
                                                setFormData({...formData, items: newItems});
                                            }}
                                            keyboardType="numeric"
                                        />
                                        <TouchableOpacity onPress={() => {
                                            const newItems = [...formData.items];
                                            newItems.splice(idx, 1);
                                            setFormData({...formData, items: newItems});
                                        }}>
                                            <X size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity 
                                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Processing...' : 'Confirm Movement'}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfaff' },
    header: { padding: 24, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e1b4b' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    trfNumber: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: 'bold', color: '#166534' },
    movementBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 16 },
    locBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    locText: { fontSize: 13, color: '#444' },
    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#94a3b8' },
    notesBox: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    notesText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4f46e5', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#94a3b8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e1b4b' },
    label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
    stockScroll: { marginBottom: 10 },
    stockCard: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginRight: 10, width: 140 },
    stockName: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginTop: 6 },
    stockQty: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
    selectedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fcfaff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    siName: { fontSize: 14, fontWeight: 'bold', color: '#1e1b4b' },
    siRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    siInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, width: 50, textAlign: 'center' },
    saveBtn: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default InventoryTransferScreen;
