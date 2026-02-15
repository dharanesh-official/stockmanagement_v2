import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView
} from 'react-native';
import api from '../services/api';
import { Store, User, Phone, MapPin, Plus, Trash2, Edit, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const ShopsScreen = () => {
    const { user, hasPermission } = useAuth();
    const [shops, setShops] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        address: '',
        phone: '',
        email: '',
        customer_id: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchShops = async () => {
        try {
            const res = await api.get('/shops');
            setShops(res.data);
            const custRes = await api.get('/customers');
            setCustomers(custRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleCreateOrUpdate = async () => {
        if (!formData.name || !formData.customer_id) {
            Alert.alert('Validation', 'Shop Name and Customer are required');
            return;
        }

        try {
            setSaving(true);
            if (formData.id) {
                await api.put(`/shops/${formData.id}`, formData);
            } else {
                await api.post('/shops', formData);
            }
            setModalVisible(false);
            fetchShops();
            resetForm();
        } catch (err) {
            Alert.alert('Error', 'Failed to save shop');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this shop?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/shops/${id}`);
                        fetchShops();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete shop');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setFormData({ id: null, name: '', address: '', phone: '', email: '', customer_id: '' });
    };

    const openEdit = (shop) => {
        setFormData({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            phone: shop.phone || '',
            email: shop.email || '',
            customer_id: shop.customer_id
        });
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitle}>
                    <Store size={20} color="#059669" />
                    <Text style={styles.shopName}>{item.name}</Text>
                </View>
                <View style={styles.actions}>
                    {hasPermission('shops', 'edit') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                            <Edit size={18} color="#4b5563" />
                        </TouchableOpacity>
                    )}
                    {hasPermission('shops', 'delete') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View style={styles.infoRow}>
                <User size={14} color="#6b7280" />
                <Text style={styles.infoText}>{item.customer_name}</Text>
            </View>
            {item.phone && (
                <View style={styles.infoRow}>
                    <Phone size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.phone}</Text>
                </View>
            )}
            {item.address && (
                <View style={styles.infoRow}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.address}</Text>
                </View>
            )}
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

    return (
        <View style={styles.container}>
            <FlatList
                data={shops}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            {hasPermission('shops', 'create') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => { resetForm(); setModalVisible(true); }}
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{formData.id ? 'Edit Shop' : 'New Shop'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.label}>Shop Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={t => setFormData({ ...formData, name: t })}
                                placeholder="Enter shop name"
                            />

                            <Text style={styles.label}>Customer Owner</Text>
                            <ScrollView horizontal style={styles.customerScroll} showsHorizontalScrollIndicator={false}>
                                {customers.map(cust => (
                                    <TouchableOpacity
                                        key={cust.id}
                                        style={[styles.customerChip, formData.customer_id == cust.id && styles.customerChipActive]}
                                        onPress={() => setFormData({ ...formData, customer_id: cust.id })}
                                    >
                                        <Text style={[styles.customerText, formData.customer_id == cust.id && styles.customerTextActive]}>{cust.full_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={t => setFormData({ ...formData, phone: t })}
                                placeholder="Phone number"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.address}
                                onChangeText={t => setFormData({ ...formData, address: t })}
                                placeholder="Full address"
                                multiline
                            />

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                                onPress={handleCreateOrUpdate}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Shop'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    shopName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    infoText: { color: '#6b7280', fontSize: 14 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#059669', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontWeight: '600', marginBottom: 8, color: '#374151' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
    textArea: { height: 80, textAlignVertical: 'top' },
    customerScroll: { flexDirection: 'row', marginBottom: 16 },
    customerChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    customerChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
    customerText: { color: '#374151' },
    customerTextActive: { color: 'white', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 24 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default ShopsScreen;
