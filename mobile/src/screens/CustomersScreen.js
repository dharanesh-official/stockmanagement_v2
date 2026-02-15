
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform,
    ScrollView
} from 'react-native';
import api from '../services/api';
import { Search, Plus, Phone, Mail, MapPin, X, Lock, Unlock, Trash2, Edit } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const CustomersScreen = () => {
    const { hasPermission } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        full_name: '',
        email: '',
        phone: '',
        address: ''
    });

    const fetchCustomers = async () => {
        // Don't set loading to true if we already have data (prevents flush/flicker)
        if (customers.length === 0) setLoading(true);
        try {
            const res = await api.get('/customers');
            const data = res.data || [];
            setCustomers(data);
            setFilteredCustomers(data);
        } catch (err) {
            console.error(err);
            // Don't alert on background refresh failure to avoid annoyance
            if (customers.length === 0) Alert.alert('Error', 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (!customers) return;
        const query = (search || '').toLowerCase();
        const filtered = customers.filter(c => {
            if (!c) return false;
            return (
                (c.full_name && c.full_name.toLowerCase().includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query)) ||
                (c.phone && c.phone.includes(query))
            );
        });
        setFilteredCustomers(filtered);
    }, [search, customers]);

    const handleSave = async () => {
        if (!formData.full_name || !formData.phone) {
            Alert.alert('Validation', 'Name and Phone are required');
            return;
        }

        const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
        if (phoneDigits.length !== 10) {
            Alert.alert('Validation', 'Enter a valid 10-digit phone number');
            return;
        }

        const payload = { ...formData, phone: `+91 ${phoneDigits}` };
        setSaving(true);

        try {
            if (formData.id) {
                await api.put(`/customers/${formData.id}`, payload);
            } else {
                await api.post('/customers', payload);
            }
            // Success
            Alert.alert('Success', 'Customer saved successfully!');
            setModalVisible(false);
            resetForm();
            fetchCustomers();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to save customer';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/customers/${id}`);
                        fetchCustomers();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const toggleLock = async (id, currentStatus) => {
        if (processing) return;
        setProcessing(true);
        try {
            await api.put(`/customers/${id}/lock`, { is_locked: !currentStatus });
            fetchCustomers();
        } catch (err) {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setProcessing(false);
        }
    };

    const openEdit = (item) => {
        setFormData({
            id: item.id,
            full_name: item.full_name || '',
            email: item.email || '',
            phone: item.phone ? item.phone.replace('+91 ', '') : '',
            address: item.address || ''
        });
        setModalVisible(true);
    };

    const resetForm = () => {
        setFormData({ id: null, full_name: '', email: '', phone: '', address: '' });
    };

    const renderItem = ({ item }) => {
        if (!item) return null;
        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.name}>{item.full_name || 'Unknown'}</Text>
                    {item.is_locked ? <Lock size={16} color="#ef4444" /> : <Unlock size={16} color="#059669" />}
                </View>

                <View style={styles.infoRow}>
                    <Phone size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.phone || 'N/A'}</Text>
                </View>

                {item.email ? (
                    <View style={styles.infoRow}>
                        <Mail size={14} color="#6b7280" />
                        <Text style={styles.infoText}>{item.email}</Text>
                    </View>
                ) : null}

                <View style={styles.actions}>
                    {hasPermission('customers', 'edit') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                            <Edit size={18} color="#4b5563" />
                        </TouchableOpacity>
                    )}
                    {hasPermission('customers', 'edit') && (
                        <TouchableOpacity
                            style={[styles.actionBtn, processing && { opacity: 0.5 }]}
                            disabled={processing}
                            onPress={() => toggleLock(item.id, item.is_locked)}
                        >
                            {item.is_locked ? <Text style={styles.unlockText}>Unlock</Text> : <Text style={styles.lockText}>Lock</Text>}
                        </TouchableOpacity>
                    )}
                    {hasPermission('customers', 'delete') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <Search size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading && customers.length === 0 ? (
                <ActivityIndicator size="large" color="#059669" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredCustomers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No customers found</Text>}
                    refreshing={loading}
                    onRefresh={fetchCustomers}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}

            {/* REMOVED PLUS ICON AS REQUESTED */}

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                {/* ... Keep Modal for Edit if needed, or remove if "remove module" means all write access.
                    User said "remove that plus icon alone", so Edit might still be allowed.
                    I'll keep the modal logic but it won't be triggered by FAB.
                */}
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{formData.id ? 'Edit Customer' : 'New Customer'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.label}>Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.full_name}
                                onChangeText={t => setFormData({ ...formData, full_name: t })}
                            />

                            <Text style={styles.label}>Phone *</Text>
                            <View style={styles.phoneRow}>
                                <Text style={styles.prefix}>+91</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    value={formData.phone}
                                    onChangeText={t => setFormData({ ...formData, phone: t })}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={t => setFormData({ ...formData, email: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={formData.address}
                                onChangeText={t => setFormData({ ...formData, address: t })}
                                multiline
                            />

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { backgroundColor: '#9ca3af' }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Save Customer'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, padding: 12, borderRadius: 12, elevation: 2 },
    searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: '#000000' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    name: { fontSize: 18, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    infoText: { color: '#6b7280', fontSize: 14 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#f3f4f6' },
    actionBtn: { padding: 4 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#059669', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontWeight: '600', marginBottom: 6, color: '#374151' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: '#000000', backgroundColor: '#ffffff' },
    phoneRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 16, backgroundColor: '#ffffff' },
    prefix: { padding: 12, backgroundColor: '#f3f4f6', borderRightWidth: 1, borderColor: '#d1d5db', fontWeight: '600', color: '#000000' },
    phoneInput: { flex: 1, padding: 12, fontSize: 16, color: '#000000' },
    saveBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    lockText: { color: '#ef4444', fontWeight: 'bold' },
    unlockText: { color: '#059669', fontWeight: 'bold' }
});

export default CustomersScreen;
