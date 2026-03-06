import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView
} from 'react-native';
import api from '../services/api';
import { 
    Users, Phone, Mail, MapPin, Plus, Trash2, Edit, X, 
    Search, Filter, Briefcase, CreditCard, AlertCircle
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const SuppliersScreen = () => {
    const { user, hasPermission } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        gst_number: '',
        payment_terms: '',
        status: 'Active',
    });
    
    const [saving, setSaving] = useState(false);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch suppliers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleCreateOrUpdate = async () => {
        if (!formData.name) {
            Alert.alert('Validation', 'Supplier Name is required');
            return;
        }

        try {
            setSaving(true);
            if (formData.id) {
                await api.put(`/suppliers/${formData.id}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            setModalVisible(false);
            fetchSuppliers();
            resetForm();
        } catch (err) {
            Alert.alert('Error', 'Failed to save supplier');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this supplier?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/suppliers/${id}`);
                        fetchSuppliers();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete supplier');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: '',
            contact_person: '',
            phone: '',
            email: '',
            address: '',
            gst_number: '',
            payment_terms: '',
            status: 'Active',
        });
    };

    const openEdit = (supplier) => {
        setFormData({ ...supplier });
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                    <Briefcase size={20} color="#3b82f6" />
                    <Text style={styles.supplierName}>{item.name}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, item.status === 'Active' ? styles.statusTextActive : styles.statusTextInactive]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Users size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.contact_person || 'No Contact Person'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Phone size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.phone || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <CreditCard size={14} color="#6b7280" />
                    <Text style={styles.infoText}>Balance: <Text style={parseFloat(item.outstanding_balance) > 0 ? {color: '#ef4444', fontWeight: 'bold'} : {color: '#059669'}}>₹{Number(item.outstanding_balance || 0).toLocaleString()}</Text></Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.tags}>
                    {item.gst_number ? <Text style={styles.tag}>GST: {item.gst_number}</Text> : null}
                </View>
                <View style={styles.actions}>
                    {hasPermission('suppliers', 'edit') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                            <Edit size={18} color="#4b5563" />
                        </TouchableOpacity>
                    )}
                    {hasPermission('suppliers', 'delete') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.contact_person && s.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Suppliers</Text>
                <Text style={styles.subtitle}>Manage your product sources</Text>
            </View>

            <View style={styles.searchBar}>
                <Search size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
            ) : (
                <FlatList
                    data={filteredSuppliers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <AlertCircle size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>No suppliers found</Text>
                        </View>
                    }
                />
            )}

            {hasPermission('suppliers', 'create') && (
                <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{formData.id ? 'Edit Supplier' : 'New Supplier'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Supplier Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={t => setFormData({ ...formData, name: t })}
                                placeholder="e.g. Acme Corp"
                            />

                            <Text style={styles.label}>Contact Person</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contact_person}
                                onChangeText={t => setFormData({ ...formData, contact_person: t })}
                                placeholder="Full Name"
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Phone</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.phone}
                                        onChangeText={t => setFormData({ ...formData, phone: t })}
                                        placeholder="Contact Number"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.email}
                                        onChangeText={t => setFormData({ ...formData, email: t })}
                                        placeholder="Email Address"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>GST Number</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.gst_number}
                                onChangeText={t => setFormData({ ...formData, gst_number: t })}
                                placeholder="GSTIN"
                            />

                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                value={formData.address}
                                onChangeText={t => setFormData({ ...formData, address: t })}
                                placeholder="Full Address"
                                multiline
                            />

                            <Text style={styles.label}>Payment Terms</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.payment_terms}
                                onChangeText={t => setFormData({ ...formData, payment_terms: t })}
                                placeholder="e.g. Net 30"
                            />

                            <TouchableOpacity 
                                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                                onPress={handleCreateOrUpdate}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Supplier'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 20, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, paddingHorizontal: 16, borderRadius: 12, height: 48, elevation: 1 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    supplierName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusActive: { backgroundColor: '#f0fdf4' },
    statusInactive: { backgroundColor: '#fef2f2' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    statusTextActive: { color: '#166534' },
    statusTextInactive: { color: '#991b1b' },
    cardBody: { gap: 8, marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 14, color: '#475569' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    tags: { flexDirection: 'row', gap: 8 },
    tag: { fontSize: 10, color: '#3b82f6', backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 16 },
    actionBtn: { padding: 4 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3b82f6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, color: '#94a3b8', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: '#1e293b' },
    row: { flexDirection: 'row' },
    saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default SuppliersScreen;
