
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView
} from 'react-native';
import api from '../services/api';
import { User, Mail, Phone, ShieldCheck, Briefcase, Plus, Trash2, Edit, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const EmployeesScreen = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'salesman'
    });

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchEmployees();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleCreateOrUpdate = async () => {
        if (!formData.full_name || !formData.email || !formData.role) {
            Alert.alert('Validation', 'Name, Email and Role are required');
            return;
        }

        try {
            if (formData.id) {
                await api.put(`/users/${formData.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setModalVisible(false);
            fetchEmployees();
            resetForm();
        } catch (err) {
            Alert.alert('Error', err.response?.data || 'Failed to save user');
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/users/${id}`);
                        fetchEmployees();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete user');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setFormData({ id: null, full_name: '', email: '', phone: '', password: '', role: 'salesman' });
    };

    const openEdit = (emp) => {
        setFormData({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            phone: emp.phone || '',
            password: '',
            role: emp.role
        });
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userRow}>
                    <View style={styles.avatar}>
                        <User size={20} color="#374151" />
                    </View>
                    <View>
                        <Text style={styles.name}>{item.full_name}</Text>
                        <View style={[styles.roleBadge, item.role === 'admin' ? styles.badgeAdmin : styles.badgeSales]}>
                            {item.role === 'admin' ? <ShieldCheck size={12} color="#166534" /> : <Briefcase size={12} color="#1d4ed8" />}
                            <Text style={[styles.roleText, item.role === 'admin' ? styles.textAdmin : styles.textSales]}>{item.role.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                        <Edit size={18} color="#4b5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                        <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.infoRow}>
                <Mail size={14} color="#6b7280" />
                <Text style={styles.infoText}>{item.email}</Text>
            </View>
            {item.phone && (
                <View style={styles.infoRow}>
                    <Phone size={14} color="#6b7280" />
                    <Text style={styles.infoText}>{item.phone}</Text>
                </View>
            )}
        </View>
    );

    if (user?.role !== 'admin') {
        return (
            <View style={styles.center}>
                <ShieldCheck size={48} color="#dc2626" />
                <Text style={styles.accessDenied}>Access Denied</Text>
                <Text style={styles.accessText}>Only administrators can manager employees.</Text>
            </View>
        );
    }

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

    return (
        <View style={styles.container}>
            <FlatList
                data={employees}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => { resetForm(); setModalVisible(true); }}
            >
                <Plus color="white" size={24} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{formData.id ? 'Edit Employee' : 'New Employee'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.full_name}
                                onChangeText={t => setFormData({ ...formData, full_name: t })}
                                placeholder="Enter name"
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={t => setFormData({ ...formData, email: t })}
                                placeholder="email@company.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={t => setFormData({ ...formData, phone: t })}
                                placeholder="Phone number"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleContainer}>
                                <TouchableOpacity
                                    style={[styles.roleOption, formData.role === 'salesman' && styles.roleActive]}
                                    onPress={() => setFormData({ ...formData, role: 'salesman' })}
                                >
                                    <Text style={[styles.roleOptionText, formData.role === 'salesman' && styles.roleActiveText]}>Salesman</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, formData.role === 'admin' && styles.roleActive]}
                                    onPress={() => setFormData({ ...formData, role: 'admin' })}
                                >
                                    <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleActiveText]}>Admin</Text>
                                </TouchableOpacity>
                            </View>

                            {!formData.id && (
                                <>
                                    <Text style={styles.label}>Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.password}
                                        onChangeText={t => setFormData({ ...formData, password: t })}
                                        placeholder="Set password"
                                        secureTextEntry
                                    />
                                </>
                            )}

                            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateOrUpdate}>
                                <Text style={styles.saveBtnText}>Save Employee</Text>
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
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
    badgeAdmin: { backgroundColor: '#dcfce7' },
    badgeSales: { backgroundColor: '#dbeafe' },
    roleText: { fontSize: 10, fontWeight: '700' },
    textAdmin: { color: '#166534' },
    textSales: { color: '#1d4ed8' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    infoText: { color: '#6b7280', fontSize: 14 },
    accessDenied: { fontSize: 20, fontWeight: 'bold', color: '#dc2626', marginTop: 16 },
    accessText: { color: '#6b7280', marginTop: 8 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#059669', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontWeight: '600', marginBottom: 8, color: '#374151' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
    roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    roleOption: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, alignItems: 'center' },
    roleActive: { backgroundColor: '#059669', borderColor: '#059669' },
    roleOptionText: { color: '#374151', fontWeight: 'bold' },
    roleActiveText: { color: 'white' },
    saveBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 24 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default EmployeesScreen;
