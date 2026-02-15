
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
    const [formData, setFormData] = useState({
        id: null,
        full_name: '',
        email: '',
        phone: '',
        address: ''
    });

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
            setFilteredCustomers(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const filtered = customers.filter(c =>
            c.full_name?.toLowerCase().includes(lowerSearch) ||
            (c.email && c.email.toLowerCase().includes(lowerSearch)) ||
            (c.phone && c.phone.includes(search))
        );
        setFilteredCustomers(filtered);
    }, [search, customers]);

    const handleCreateOrUpdate = async () => {
        if (!formData.full_name || !formData.phone) {
            Alert.alert('Validation', 'Name and Phone are required');
            return;
        }

        const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
        if (phoneDigits.length !== 10) {
            Alert.alert('Validation', 'Please enter a valid 10-digit phone number');
            return;
        }

        const finalData = {
            ...formData,
            phone: `+91 ${phoneDigits}`
        };

        try {
            if (formData.id) {
                await api.put(`/customers/${formData.id}`, finalData);
            } else {
                await api.post('/customers', finalData);
            }
            setModalVisible(false);
            fetchCustomers();
            resetForm();
        } catch (err) {
            Alert.alert('Error', err.response?.data || 'Failed to save customer');
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Customer',
            'Are you sure you want to delete this customer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/customers/${id}`);
                            fetchCustomers();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete customer');
                        }
                    }
                }
            ]
        );
    };

    const toggleLock = async (id, currentStatus) => {
        try {
            await api.put(`/customers/${id}/lock`, { is_locked: !currentStatus });
            fetchCustomers();
        } catch (err) {
            Alert.alert('Error', 'Failed to update lock status');
        }
    };

    const openEdit = (c) => {
        const rawPhone = c.phone ? c.phone.replace('+91 ', '') : '';
        setFormData({
            id: c.id,
            full_name: c.full_name,
            email: c.email || '',
            phone: rawPhone,
            address: c.address || ''
        });
        setModalVisible(true);
    };

    const resetForm = () => {
        setFormData({ id: null, full_name: '', email: '', phone: '', address: '' });
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.full_name}</Text>
                <View style={[styles.badge, item.is_locked ? styles.badgeLocked : styles.badgeActive]}>
                    <Text style={[styles.badgeText, item.is_locked ? styles.textLocked : styles.textActive]}>
                        {item.is_locked ? 'Locked' : 'Active'}
                    </Text>
                </View>
            </View>
            <View style={styles.infoRow}>
                <Phone size={14} color="#6b7280" />
                <Text style={styles.infoText}>{item.phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
                <Mail size={14} color="#6b7280" />
                <Text style={styles.infoText}>{item.email || 'N/A'}</Text>
            </View>
            {item.address && (
                <View style={styles.infoRow}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.infoText} numberOfLines={1}>{item.address}</Text>
                </View>
            )}
            <View style={styles.actions}>
                {hasPermission('customers', 'edit') && (
                    <>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                            <Edit size={18} color="#4b5563" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLock(item.id, item.is_locked)}>
                            {item.is_locked ? <Unlock size={18} color="#d97706" /> : <Lock size={18} color="#4b5563" />}
                        </TouchableOpacity>
                    </>
                )}
                {hasPermission('customers', 'delete') && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                        <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Search size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search customers..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#059669" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredCustomers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No customers found</Text>}
                />
            )}

            {hasPermission('customers', 'create') && (
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
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{formData.id ? 'Edit Customer' : 'New Customer'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.full_name}
                                    onChangeText={text => setFormData({ ...formData, full_name: text })}
                                    placeholder="Enter full name"
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Phone Number *</Text>
                                <View style={styles.phoneInputContainer}>
                                    <Text style={styles.prefix}>+91</Text>
                                    <TextInput
                                        style={styles.phoneInput}
                                        value={formData.phone}
                                        onChangeText={text => setFormData({ ...formData, phone: text })}
                                        placeholder="98765 43210"
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                    />
                                </View>
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.email}
                                    onChangeText={text => setFormData({ ...formData, email: text })}
                                    placeholder="customer@example.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Address</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.address}
                                    onChangeText={text => setFormData({ ...formData, address: text })}
                                    placeholder="Enter address"
                                    multiline
                                />
                            </View>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateOrUpdate}>
                                <Text style={styles.saveBtnText}>Save Customer</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    loader: {
        marginTop: 50,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeActive: { backgroundColor: '#dcfce7' },
    badgeLocked: { backgroundColor: '#fee2e2' },
    badgeText: { fontSize: 12, fontWeight: '600' },
    textActive: { color: '#166534' },
    textLocked: { color: '#991b1b' },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        marginLeft: 8,
        color: '#6b7280',
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    actionBtn: {
        padding: 6,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#059669',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
    },
    prefix: {
        padding: 12,
        backgroundColor: '#f3f4f6',
        color: '#374151',
        fontWeight: '600',
        borderRightWidth: 1,
        borderRightColor: '#d1d5db',
    },
    phoneInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    saveBtn: {
        backgroundColor: '#059669',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#9ca3af',
        fontSize: 16,
    },
});

export default CustomersScreen;
