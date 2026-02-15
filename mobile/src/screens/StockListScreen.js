
import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView
} from 'react-native';
import api from '../services/api';
import { RefreshCcw, Search, Plus, Edit, Trash2, X, PlusCircle, MinusCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const StockListScreen = () => {
    const { hasPermission } = useAuth();
    const [stock, setStock] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // modal states
    const [modalVisible, setModalVisible] = useState(false); // Add/Edit
    const [adjustModalVisible, setAdjustModalVisible] = useState(false); // Increase/Reduce

    const [formData, setFormData] = useState({
        id: null,
        item_name: '',
        category_id: '',
        price: '',
        quantity: '',
        sku: '',
        description: ''
    });

    const [adjustData, setAdjustData] = useState({
        id: null,
        name: '',
        quantity: '1',
        type: 'increase' // or 'reduce'
    });

    const fetchData = async () => {
        try {
            const [stockRes, catRes] = await Promise.all([
                api.get('/stock'),
                api.get('/categories')
            ]);
            setStock(stockRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.item_name || !formData.category_id || !formData.price || !formData.quantity) {
            Alert.alert('Validation', 'Name, Category, Price and Quantity are required');
            return;
        }

        try {
            if (formData.id) {
                await api.put(`/stock/${formData.id}`, formData);
            } else {
                await api.post('/stock', formData);
            }
            setModalVisible(false);
            fetchData();
            resetForm();
        } catch (err) {
            Alert.alert('Error', 'Failed to save product');
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/stock/${id}`);
                        fetchData();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete product');
                    }
                }
            }
        ]);
    };

    const handleAdjustment = async () => {
        if (!adjustData.quantity || isNaN(adjustData.quantity) || Number(adjustData.quantity) <= 0) {
            Alert.alert('Invalid Quantity');
            return;
        }

        try {
            const endpoint = adjustData.type === 'increase'
                ? `/stock/increase/${adjustData.id}`
                : `/stock/reduce/${adjustData.id}`;

            await api.put(endpoint, { quantity: parseInt(adjustData.quantity) });
            setAdjustModalVisible(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Failed to adjust stock');
        }
    };

    const resetForm = () => {
        setFormData({ id: null, item_name: '', category_id: '', price: '', quantity: '', sku: '', description: '' });
    };

    const openEdit = (item) => {
        setFormData({
            id: item.id,
            item_name: item.item_name,
            category_id: item.category_id,
            price: item.price ? item.price.toString() : '',
            quantity: item.quantity ? item.quantity.toString() : '',
            sku: item.sku || '',
            description: item.description || ''
        });
        setModalVisible(true);
    };

    const openAdjust = (item, type) => {
        setAdjustData({
            id: item.id,
            name: item.item_name,
            quantity: '1',
            type: type
        });
        setAdjustModalVisible(true);
    };

    const filteredStock = stock.filter(item =>
        item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <View style={[styles.badge, item.quantity > 10 ? styles.badgeSuccess : styles.badgeDestructive]}>
                    <Text style={[styles.badgeText, item.quantity > 10 ? styles.textSuccess : styles.textDestructive]}>
                        {item.quantity <= 10 ? 'Low Stock' : 'In Stock'}
                    </Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.detailText}>SKU: {item.sku || 'N/A'}</Text>
                <Text style={styles.detailText}>Category: {item.category_name || 'Uncategorized'}</Text>
                <View style={styles.pricingRow}>
                    <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
                    <Text style={styles.qty}>Qty: {item.quantity}</Text>
                </View>
            </View>
            <View style={styles.actionsRow}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {hasPermission('stock', 'edit') && (
                        <>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => openAdjust(item, 'increase')}>
                                <PlusCircle size={20} color="#2563eb" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => openAdjust(item, 'reduce')}>
                                <MinusCircle size={20} color="#ea580c" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {hasPermission('stock', 'edit') && (
                        <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                            <Edit size={18} color="#4b5563" />
                        </TouchableOpacity>
                    )}
                    {hasPermission('stock', 'delete') && (
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Search size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Products..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filteredStock}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={<Text style={styles.emptyText}>No stock items found</Text>}
            />

            {hasPermission('stock', 'create') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => { resetForm(); setModalVisible(true); }}
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            )}

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{formData.id ? 'Edit Product' : 'New Product'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.label}>Product Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.item_name}
                                onChangeText={t => setFormData({ ...formData, item_name: t })}
                                placeholder="Enter product name"
                            />

                            <Text style={styles.label}>Category</Text>
                            <ScrollView horizontal style={styles.catScroll} showsHorizontalScrollIndicator={false}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.catChip, formData.category_id == cat.id && styles.catChipActive]}
                                        onPress={() => setFormData({ ...formData, category_id: cat.id })}
                                    >
                                        <Text style={[styles.catText, formData.category_id == cat.id && styles.catTextActive]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Price (₹)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.price}
                                        onChangeText={t => setFormData({ ...formData, price: t })}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Quantity</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.quantity}
                                        onChangeText={t => setFormData({ ...formData, quantity: t })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>SKU</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.sku}
                                onChangeText={t => setFormData({ ...formData, sku: t })}
                                placeholder="Optional SKU"
                            />

                            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateOrUpdate}>
                                <Text style={styles.saveBtnText}>Save Product</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Adjust Modal */}
            <Modal
                transparent={true}
                visible={adjustModalVisible}
                onRequestClose={() => setAdjustModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: 'auto' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {adjustData.type === 'increase' ? 'Increase Stock' : 'Reduce Stock'}
                            </Text>
                            <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.itemName}>{adjustData.name}</Text>

                        <Text style={[styles.label, { marginTop: 16 }]}>Quantity to {adjustData.type}</Text>
                        <TextInput
                            style={styles.qtyInput}
                            value={adjustData.quantity}
                            onChangeText={t => setAdjustData({ ...adjustData, quantity: t })}
                            keyboardType="numeric"
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, adjustData.type === 'reduce' && { backgroundColor: '#dc2626' }]}
                            onPress={handleAdjustment}
                        >
                            <Text style={styles.saveBtnText}>Confirm {adjustData.type === 'increase' ? 'Addition' : 'Reduction'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    badgeSuccess: { backgroundColor: '#d1fae5' },
    badgeDestructive: { backgroundColor: '#fee2e2' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    textSuccess: { color: '#065f46' },
    textDestructive: { color: '#991b1b' },
    cardBody: { marginTop: 8 },
    detailText: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
    pricingRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
    price: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
    qty: { fontSize: 14, fontWeight: '500' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    iconBtn: { padding: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, marginBottom: 0, paddingHorizontal: 12, borderRadius: 8, height: 48, elevation: 1 },
    searchInput: { flex: 1, marginLeft: 8 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#059669', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontWeight: '600', marginBottom: 8, color: '#374151' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    catScroll: { flexDirection: 'row', marginBottom: 16 },
    catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    catChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
    catText: { color: '#374151' },
    catTextActive: { color: 'white', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 24 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    qtyInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 16, fontSize: 24, textAlign: 'center', marginBottom: 24 },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af' }
});

export default StockListScreen;
