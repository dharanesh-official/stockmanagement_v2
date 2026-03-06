import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView, Switch
} from 'react-native';
import api from '../services/api';
import { 
    Tag, Percent, Plus, X, Search, Filter, 
    Calendar, User, Layers, Trash2, Edit, CheckCircle2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const PricingRulesScreen = () => {
    const { user, hasPermission } = useAuth();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    
    // Form for new/edit rule
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        type: 'Global', // Category, Customer, Global
        target_id: null,
        discount_type: 'Percentage', // Percentage, Fixed
        discount_value: '',
        min_order_amount: '0',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true
    });

    const [saving, setSaving] = useState(false);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await api.get('/pricing');
            setRules(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load pricing rules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.discount_value) {
            Alert.alert('Validation', 'Rule Name and Discount Value are required');
            return;
        }

        try {
            setSaving(true);
            if (formData.id) {
                await api.put(`/pricing/${formData.id}`, formData);
            } else {
                await api.post('/pricing', formData);
            }
            setModalVisible(false);
            fetchRules();
            resetForm();
        } catch (err) {
            Alert.alert('Error', 'Failed to save pricing rule');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert('Confirm Delete', 'Remove this pricing rule?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/pricing/${id}`);
                        fetchRules();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete rule');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: '',
            type: 'Global',
            target_id: null,
            discount_type: 'Percentage',
            discount_value: '',
            min_order_amount: '0',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            is_active: true
        });
    };

    const openEdit = (rule) => {
        setFormData({ ...rule });
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Tag size={18} color="#4f46e5" />
                    <Text style={styles.ruleName}>{item.name}</Text>
                </View>
                <Switch
                    value={item.is_active}
                    onValueChange={async (val) => {
                        try {
                            await api.put(`/pricing/${item.id}`, { ...item, is_active: val });
                            fetchRules();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to update status');
                        }
                    }}
                    trackColor={{ true: '#4f46e5', false: '#e2e8f0' }}
                />
            </View>

            <View style={styles.badgeRow}>
                <View style={styles.typeBadge}>
                    <Layers size={12} color="#6366f1" />
                    <Text style={styles.typeText}>{item.type}</Text>
                </View>
                <View style={styles.discountBadge}>
                    <Percent size={12} color="#10b981" />
                    <Text style={styles.discountText}>
                        {item.discount_value}{item.discount_type === 'Percentage' ? '%' : ' OFF'}
                    </Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Calendar size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>Starts: {new Date(item.start_date).toLocaleDateString()}</Text>
                </View>
                {item.min_order_amount > 0 && (
                    <View style={styles.metaItem}>
                        <DollarSign size={12} color="#94a3b8" />
                        <Text style={styles.metaText}>Min: ₹{Number(item.min_order_amount).toLocaleString()}</Text>
                    </View>
                )}
            </View>

            {hasPermission('settings', 'edit') && (
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                        <Edit size={18} color="#475569" />
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                        <Trash2 size={18} color="#ef4444" />
                        <Text style={[styles.actionText, {color: '#ef4444'}]}>Remove</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Pricing & Discounts</Text>
                <Text style={styles.subtitle}>Manage automated trade discounts and offers</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
            ) : (
                <FlatList
                    data={rules}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pricing rules defined</Text>}
                />
            )}

            {hasPermission('settings', 'edit') && (
                <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Plus size={28} color="white" />
                </TouchableOpacity>
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{formData.id ? 'Modify Offer' : 'Create New Offer'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Rule/Offer Name</Text>
                            <TextInput 
                                style={styles.input} 
                                value={formData.name} 
                                onChangeText={t => setFormData({...formData, name: t})}
                                placeholder="e.g. Festival Season 10% Off"
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Offer Type</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {['Global', 'Category', 'Customer'].map(t => (
                                            <TouchableOpacity 
                                                key={t} 
                                                style={[styles.chip, formData.type === t && styles.chipActive]}
                                                onPress={() => setFormData({...formData, type: t})}
                                            >
                                                <Text style={[styles.chipText, formData.type === t && styles.chipActiveText]}>{t}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Discount Type</Text>
                                    <View style={styles.typeRow}>
                                        <TouchableOpacity 
                                            style={[styles.typeBtn, formData.discount_type === 'Percentage' && styles.typeBtnActive]}
                                            onPress={() => setFormData({...formData, discount_type: 'Percentage'})}
                                        >
                                            <Text style={[styles.typeBtnText, formData.discount_type === 'Percentage' && styles.typeBtnTextActive]}>% Percent</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.typeBtn, formData.discount_type === 'Fixed' && styles.typeBtnActive]}
                                            onPress={() => setFormData({...formData, discount_type: 'Fixed'})}
                                        >
                                            <Text style={[styles.typeBtnText, formData.discount_type === 'Fixed' && styles.typeBtnTextActive]}>Fixed Amt</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Discount Value</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={String(formData.discount_value)} 
                                        onChangeText={t => setFormData({...formData, discount_value: t})}
                                        keyboardType="numeric"
                                        placeholder="10"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.label}>Min Order (₹)</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={String(formData.min_order_amount)} 
                                        onChangeText={t => setFormData({...formData, min_order_amount: t})}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Expiry Date</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={formData.end_date} 
                                        onChangeText={t => setFormData({...formData, end_date: t})}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Apply Rule'}</Text>
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
    container: { flex: 1, backgroundColor: '#f5f7ff' },
    header: { padding: 24, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e1b4b' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ruleName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    typeText: { fontSize: 11, fontWeight: 'bold', color: '#6366f1' },
    discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    discountText: { fontSize: 11, fontWeight: 'bold', color: '#10b981' },
    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', pb: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#94a3b8' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4f46e5', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#94a3b8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
    row: { marginBottom: 16 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    chipText: { fontSize: 12, color: '#64748b' },
    chipActiveText: { color: 'white', fontWeight: 'bold' },
    typeRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
    typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    typeBtnActive: { backgroundColor: 'white', elevation: 2 },
    typeBtnText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
    typeBtnTextActive: { color: '#4f46e5' },
    saveBtn: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 12 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default PricingRulesScreen;
