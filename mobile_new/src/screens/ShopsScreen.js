import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView, Linking
} from 'react-native';
import api from '../services/api';
import { Store, User, Phone, MapPin, Plus, Trash2, Edit, X, Navigation, Map, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const ShopsScreen = () => {
    const { user, hasPermission } = useAuth();
    const [shops, setShops] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        address: '',
        phone: '',
        email: '',
        customer_id: '',
        location: '',
        area_id: ''
    });
    const [saving, setSaving] = useState(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');
    const [editingAreaId, setEditingAreaId] = useState(null);
    const [editAreaName, setEditAreaName] = useState('');

    const fetchShops = async () => {
        try {
            const res = await api.get('/shops');
            setShops(res.data);
            const custRes = await api.get('/customers');
            setCustomers(custRes.data);
            const areaRes = await api.get('/areas');
            setAreas(areaRes.data);
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
        if (!formData.name || !formData.customer_id || !formData.area_id) {
            Alert.alert('Validation', 'Shop Name, Customer, and Area are required');
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
        setFormData({ id: null, name: '', address: '', phone: '', email: '', customer_id: '', location: '', area_id: selectedArea ? selectedArea.id : '' });
    };

    const handleCreateArea = async () => {
        if (!newAreaName.trim()) {
            Alert.alert('Validation', 'Area name is required');
            return;
        }
        try {
            setSaving(true);
            await api.post('/areas', { name: newAreaName.trim() });
            setNewAreaName('');
            fetchShops(); // re-fetches areas too
        } catch (err) {
            Alert.alert('Error', 'Failed to save Area. It might already exist.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateArea = async (areaId) => {
        if (!editAreaName.trim()) return;
        try {
            setSaving(true);
            await api.put(`/areas/${areaId}`, { name: editAreaName.trim() });
            setEditingAreaId(null);
            fetchShops();
        } catch (err) {
            Alert.alert('Error', 'Failed to update Area.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteArea = async (areaId, areaName) => {
        Alert.alert('Confirm Delete', `Are you sure you want to delete the Area "${areaName}"? Shops in this area will lose their area assignment.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/areas/${areaId}`);
                        if (selectedArea && selectedArea.id === areaId) setSelectedArea(null);
                        fetchShops();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete Area');
                    }
                }
            }
        ]);
    };

    const openEdit = (shop) => {
        setFormData({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            phone: shop.phone || '',
            email: shop.email || '',
            customer_id: shop.customer_id,
            location: shop.location || '',
            area_id: shop.area_id || ''
        });
        setModalVisible(true);
    };

    const handleGetDirections = (location) => {
        if (!location) return;
        let url = '';
        if (location.startsWith('http://') || location.startsWith('https://')) {
            url = location;
        } else {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        }

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert("Error", "Cannot open maps URL");
            }
        });
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitle}>
                    <Store size={20} color="#059669" />
                    <Text style={styles.shopName}>{item.name}</Text>
                </View>
                <View style={styles.actions}>
                    {item.location ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleGetDirections(item.location)}>
                            <Navigation size={18} color="#3b82f6" />
                        </TouchableOpacity>
                    ) : null}
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

    const renderAreaItem = ({ item }) => {
        const areaShops = shops.filter(s => s.area_id === item.id).length;
        return (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedArea(item)}>
                <View style={[styles.cardHeader, { marginBottom: 0 }]}>
                    <View style={styles.headerTitle}>
                        <View style={styles.iconBox}>
                            <Map size={24} color="#059669" />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.shopName}>{item.name}</Text>
                            <Text style={styles.infoText}>{areaShops} Shops</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

    const filteredShops = selectedArea ? shops.filter(s => s.area_id === selectedArea.id) : [];

    return (
        <View style={styles.container}>
            {selectedArea ? (
                <View style={styles.areaHeader}>
                    <TouchableOpacity onPress={() => setSelectedArea(null)} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#374151" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.areaHeaderTitle}>{selectedArea.name} - Shops</Text>
                        <Text style={styles.areaHeaderSubtitle}>Manage branches in this area</Text>
                    </View>
                </View>
            ) : null}

            {!selectedArea ? (
                <>
                    <FlatList
                        data={areas}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderAreaItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No areas found</Text>}
                    />
                    {hasPermission('shops', 'create') && (
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => { setNewAreaName(''); setAreaModalVisible(true); }}
                        >
                            <Map color="white" size={24} />
                        </TouchableOpacity>
                    )}
                </>
            ) : (
                <>
                    <FlatList
                        data={filteredShops}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No shops in this area</Text>}
                    />
                    {hasPermission('shops', 'create') && (
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => { resetForm(); setModalVisible(true); }}
                        >
                            <Plus color="white" size={24} />
                        </TouchableOpacity>
                    )}
                </>
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

                            <Text style={styles.label}>Area</Text>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.customerScroll}>
                                {areas.map(area => (
                                    <TouchableOpacity
                                        key={area.id}
                                        style={[styles.customerChip, formData.area_id == area.id && styles.customerChipActive]}
                                        onPress={() => setFormData({ ...formData, area_id: area.id })}
                                    >
                                        <Text style={[styles.customerText, formData.area_id == area.id && styles.customerTextActive]}>
                                            {area.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Customer Owner</Text>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.customerScroll}>
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
                                multiline={true}
                            />

                            <Text style={styles.label}>Location Link</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.location}
                                onChangeText={t => setFormData({ ...formData, location: t })}
                                placeholder="E.g., https://maps.google.com/..."
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

            {/* Area Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={areaModalVisible}
                onRequestClose={() => { setAreaModalVisible(false); setEditingAreaId(null); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage Areas</Text>
                            <TouchableOpacity onPress={() => { setAreaModalVisible(false); setEditingAreaId(null); }}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                                value={newAreaName}
                                onChangeText={setNewAreaName}
                                placeholder="Add New Area..."
                            />
                            <TouchableOpacity
                                style={{ backgroundColor: '#059669', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, opacity: saving ? 0.5 : 1 }}
                                onPress={handleCreateArea}
                                disabled={saving}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }}>
                            {areas.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#6b7280', marginVertical: 20 }}>No areas defined yet.</Text>
                            ) : (
                                areas.map(area => (
                                    <View key={area.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                                        {editingAreaId === area.id ? (
                                            <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                                                <TextInput
                                                    style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8, paddingVertical: 4, height: 36 }]}
                                                    value={editAreaName}
                                                    onChangeText={setEditAreaName}
                                                    autoFocus
                                                />
                                                <TouchableOpacity onPress={() => handleUpdateArea(area.id)} style={{ backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, opacity: saving ? 0.5 : 1 }} disabled={saving}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Save</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => setEditingAreaId(null)} style={{ backgroundColor: '#6b7280', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 4 }}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <>
                                                <Text style={{ fontWeight: '500', color: '#374151', flex: 1 }}>{area.name}</Text>
                                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                                    <TouchableOpacity onPress={() => { setEditingAreaId(area.id); setEditAreaName(area.name); }} style={{ padding: 4 }}>
                                                        <Edit size={16} color="#4b5563" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeleteArea(area.id, area.name)} style={{ padding: 4 }}>
                                                        <Trash2 size={16} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                ))
                            )}
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
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    areaHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, elevation: 2, zIndex: 10 },
    backBtn: { padding: 8, marginRight: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
    areaHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    areaHeaderSubtitle: { fontSize: 14, color: '#6b7280' },
    iconBox: { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 12 },
    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 16 }
});

export default ShopsScreen;
