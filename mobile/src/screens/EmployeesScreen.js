
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView, Switch
} from 'react-native';
import api from '../services/api';
import { User, Mail, Phone, ShieldCheck, Briefcase, Plus, Trash2, Edit, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const MODULES = ['stock', 'sales', 'customers', 'employees', 'finance', 'settings'];
const ACTIONS = ['view', 'create', 'edit', 'delete'];

const DEFAULT_PERMISSIONS = MODULES.reduce((acc, module) => {
    acc[module] = { view: false, create: false, edit: false, delete: false };
    return acc;
}, {});

const SALESMAN_PERMISSIONS = {
    stock: { view: true, create: false, edit: false, delete: false },
    sales: { view: true, create: true, edit: false, delete: false },
    customers: { view: true, create: true, edit: false, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    finance: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false }
};

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
        role: 'salesman',
        customRole: ''
    });
    const [permissions, setPermissions] = useState(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    const [saving, setSaving] = useState(false);

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
        const finalRole = formData.role === 'custom' ? formData.customRole : formData.role;

        if (!formData.full_name || !formData.email || !finalRole) {
            Alert.alert('Validation', 'Name, Email and Role are required');
            return;
        }

        // Determine permissions to send
        let finalPermissions = {};
        if (formData.role === 'salesman') {
            finalPermissions = SALESMAN_PERMISSIONS;
        } else if (formData.role === 'custom') {
            finalPermissions = permissions;
        }
        // Admin gets full access generally handled by backend/frontend checks via check 'role' === 'admin'

        const payload = {
            ...formData,
            role: finalRole,
            permissions: finalPermissions
        };
        delete payload.customRole;

        setSaving(true);
        try {
            if (formData.id) {
                await api.put(`/users/${formData.id}`, payload);
            } else {
                await api.post('/users', payload);
            }
            setModalVisible(false);
            fetchEmployees();
            resetForm();
            Alert.alert('Success', 'User saved successfully');
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Failed to save user';
            Alert.alert('Error', errMsg);
        } finally {
            setSaving(false);
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
        setFormData({ id: null, full_name: '', email: '', phone: '', password: '', role: 'salesman', customRole: '' });
        setPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    };

    const openEdit = (emp) => {
        const isStandard = emp.role === 'admin' || emp.role === 'salesman';
        const roleState = isStandard ? emp.role : 'custom';
        const customRoleState = isStandard ? '' : emp.role;

        setFormData({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            phone: emp.phone || '',
            password: '',
            role: roleState,
            customRole: customRoleState
        });

        if (emp.permissions && Object.keys(emp.permissions).length > 0) {
            setPermissions(emp.permissions);
        } else {
            // Fallback if no permissions saved, use default
            setPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
        }

        setModalVisible(true);
    };

    const togglePermission = (module, action) => {
        setPermissions(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: !prev[module]?.[action]
            }
        }));
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
                        <ScrollView showsVerticalScrollIndicator={false}>
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
                                <TouchableOpacity
                                    style={[styles.roleOption, formData.role === 'custom' && styles.roleActive]}
                                    onPress={() => {
                                        setFormData({ ...formData, role: 'custom', customRole: '' });
                                        // Reset to defaults if switching to custom so they can choose
                                        setPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
                                    }}
                                >
                                    <Text style={[styles.roleOptionText, formData.role === 'custom' && styles.roleActiveText]}>Custom</Text>
                                </TouchableOpacity>
                            </View>

                            {formData.role === 'custom' && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Custom Role Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.customRole}
                                        onChangeText={t => setFormData({ ...formData, customRole: t })}
                                        placeholder="Enter role name (e.g. Supervisor)"
                                    />

                                    <Text style={[styles.label, { marginTop: 12 }]}>Permissions</Text>
                                    {MODULES.map(module => (
                                        <View key={module} style={styles.permRow}>
                                            <Text style={styles.permModule}>{module.toUpperCase()}</Text>
                                            <View style={styles.permToggles}>
                                                {ACTIONS.map(action => (
                                                    <TouchableOpacity
                                                        key={action}
                                                        style={[styles.permBtn, permissions[module]?.[action] && styles.permBtnActive]}
                                                        onPress={() => togglePermission(module, action)}
                                                    >
                                                        <Text style={[styles.permBtnText, permissions[module]?.[action] && styles.permBtnTextActive]}>
                                                            {action.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

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

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                                onPress={handleCreateOrUpdate}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Employee'}</Text>
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
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
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
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    permRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    permModule: { fontSize: 14, fontWeight: 'bold', flex: 1 },
    permToggles: { flexDirection: 'row', gap: 8 },
    permBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
    permBtnActive: { backgroundColor: '#059669' },
    permBtnText: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
    permBtnTextActive: { color: 'white' }
});

export default EmployeesScreen;
