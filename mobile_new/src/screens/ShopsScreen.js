import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, Modal, ScrollView, Linking
} from 'react-native';
import api from '../services/api';
import { 
    Store, User, Phone, MapPin, Plus, Trash2, Edit, X, 
    Navigation, Map, ArrowLeft, CreditCard, Clock, Briefcase, Filter, AlertCircle 
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const ShopsScreen = ({ navigation }) => {
    const { user, hasPermission } = useAuth();
    const [shops, setShops] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [areas, setAreas] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        address: '',
        phone: '',
        email: '',
        customer_id: '',
        salesman_id: '',
        location: '',
        area_id: '',
        shop_code: '',
        shop_type: 'Retail',
        gst_number: '',
        city: '',
        state: '',
        pincode: '',
        credit_limit: 0,
        notes: '',
        status: 'Active',
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
            if (user?.role === 'admin') {
                const empRes = await api.get('/users');
                setEmployees(empRes.data);
            }
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

        const phoneDigits = formData.phone.replace(/[^0-9]/g, "");
        if (phoneDigits.length !== 10) {
            Alert.alert("Validation", "Please enter a valid 10-digit phone number");
            return;
        }

        const finalData = {
            ...formData,
            phone: `+91 ${phoneDigits}`,
        };

        try {
            setSaving(true);
            if (formData.id) {
                await api.put(`/shops/${formData.id}`, finalData);
            } else {
                await api.post('/shops', finalData);
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
        setFormData({
            id: null,
            name: '',
            address: '',
            phone: '',
            email: '',
            customer_id: '',
            salesman_id: user?.role === 'admin' ? '' : user?.id,
            location: '',
            area_id: selectedArea ? selectedArea.id : '',
            shop_code: '',
            shop_type: 'Retail',
            gst_number: '',
            city: '',
            state: '',
            pincode: '',
            credit_limit: 0,
            notes: '',
            status: 'Active',
        });
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
            fetchShops();
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
        const rawPhone = shop.phone ? shop.phone.replace("+91 ", "") : "";
        setFormData({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            phone: rawPhone,
            email: shop.email || '',
            customer_id: shop.customer_id,
            salesman_id: shop.salesman_id || '',
            location: shop.location || '',
            area_id: shop.area_id || '',
            shop_code: shop.shop_code || '',
            shop_type: shop.shop_type || 'Retail',
            gst_number: shop.gst_number || '',
            city: shop.city || '',
            state: shop.state || '',
            pincode: shop.pincode || '',
            credit_limit: parseFloat(shop.credit_limit) || 0,
            notes: shop.notes || '',
            status: shop.status || 'Active',
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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return { bg: '#ecfdf5', text: '#059669' };
            case 'Inactive': return { bg: '#fef2f2', text: '#ef4444' };
            case 'Temporarily Closed': return { bg: '#fffbeb', text: '#d97706' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('Finance', { shopId: item.id })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerInfo}>
                        <View style={styles.headerTitle}>
                            <Store size={18} color="#059669" />
                            <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                        </View>
                        <View style={styles.idRow}>
                            <Text style={styles.idBadge}>ID: {item.shop_code || item.id}</Text>
                            <Text style={styles.typeBadge}>{item.shop_type}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.shopGrid}>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Outstanding Balance</Text>
                        <Text style={[styles.gridValue, parseFloat(item.outstanding_balance) > 0 ? { color: '#ef4444' } : { color: '#059669' }]}>
                            ₹{Number(item.outstanding_balance || 0).toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Total Orders</Text>
                        <Text style={styles.gridValue}>{item.total_orders || 0}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={[styles.infoRow, { justifyContent: 'space-between' }]}>
                    <View style={styles.infoGroup}>
                        <Clock size={12} color="#6b7280" />
                        <Text style={styles.footerText}>
                            {item.last_order_date ? new Date(item.last_order_date).toLocaleDateString() : 'No orders'}
                        </Text>
                    </View>
                    <View style={styles.infoGroup}>
                        <Briefcase size={12} color="#6b7280" />
                        <Text style={styles.footerText}>{item.salesman_name || 'Admin'}</Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    {item.location ? (
                        <TouchableOpacity style={styles.iconBtnAction} onPress={() => handleGetDirections(item.location)}>
                            <Navigation size={16} color="#3b82f6" />
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={[styles.iconBtnAction, { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }]} onPress={() => navigation.navigate('Finance', { shopId: item.id })}>
                        <CreditCard size={16} color="#059669" />
                    </TouchableOpacity>
                    {hasPermission('shops', 'edit') && (
                        <TouchableOpacity style={styles.iconBtnAction} onPress={() => openEdit(item)}>
                            <Edit size={16} color="#4b5563" />
                        </TouchableOpacity>
                    )}
                    {hasPermission('shops', 'delete') && (
                        <TouchableOpacity style={[styles.iconBtnAction, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderAreaItem = ({ item }) => {
        return (
            <TouchableOpacity style={styles.areaCard} onPress={() => setSelectedArea(item)}>
                <View style={styles.areaTop}>
                    <View style={styles.areaIconBox}>
                        <Map size={24} color="#059669" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.areaNameText}>{item.name}</Text>
                        <Text style={styles.areaShopCount}>{item.total_shops} Registered Shops</Text>
                    </View>
                </View>
                <View style={styles.areaMetrics}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Total Sales</Text>
                        <Text style={[styles.metricValue, { color: '#059669' }]}>₹{Number(item.total_sales || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Pending Dues</Text>
                        <Text style={[styles.metricValue, { color: '#ef4444' }]}>₹{Number(item.pending_payments || 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Low Stock</Text>
                        <Text style={[styles.metricValue, { color: '#d97706' }]}>{item.low_stock_shops || 0}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

    const filteredShops = shops.filter(shop => {
        const matchesArea = selectedArea ? shop.area_id === selectedArea.id : true;
        const matchesStatus = statusFilter === 'All' ? true : shop.status === statusFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            shop.name.toLowerCase().includes(query) || 
            (shop.shop_code && shop.shop_code.toLowerCase().includes(query)) ||
            (shop.phone && shop.phone.includes(searchQuery));
        return matchesArea && matchesStatus && matchesSearch;
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {selectedArea ? (
                    <TouchableOpacity onPress={() => setSelectedArea(null)} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#374151" />
                    </TouchableOpacity>
                ) : null}
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitleText}>{selectedArea ? selectedArea.name : 'Shop Management'}</Text>
                    <Text style={styles.headerSubtitleText}>
                        {selectedArea ? 'Manage branches in this area' : 'View all areas and financials'}
                    </Text>
                </View>
                {!selectedArea && (
                    <TouchableOpacity onPress={() => setAreaModalVisible(true)} style={styles.headerIconBtn}>
                        <Map size={24} color="#059669" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.searchBar}>
                <View style={styles.searchInputContainer}>
                    <Filter size={18} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search shops..."
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                    {['All', 'Active', 'Inactive', 'Temporarily Closed'].map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setStatusFilter(status)}
                            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                        >
                            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {!selectedArea ? (
                <FlatList
                    data={areas}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderAreaItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No areas found</Text>}
                />
            ) : (
                <FlatList
                    data={filteredShops}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AlertCircle size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>No shops found matching criteria</Text>
                        </View>
                    }
                />
            )}

            {hasPermission('shops', 'create') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => { resetForm(); setModalVisible(true); }}
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            )}

            {/* Shop Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <TouchableOpacity style={styles.backBtnModal} onPress={() => setModalVisible(false)}>
                                    <ArrowLeft size={20} color="#475569" />
                                </TouchableOpacity>
                                <View>
                                    <Text style={styles.modalTitle}>{formData.id ? 'Refine Shop Details' : 'Onboard New Shop'}</Text>
                                    <Text style={styles.modalSubtitle}>
                                        {formData.id ? 'Update location, credit limits and business info.' : 'Establish a new business profile in the distribution network.'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={styles.label}>Shop Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={t => setFormData({ ...formData, name: t })}
                                placeholder="Business Name"
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Shop Code / ID</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.shop_code}
                                        onChangeText={t => setFormData({ ...formData, shop_code: t })}
                                        placeholder="SH-001"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.label}>Shop Type</Text>
                                    <View style={styles.pickerContainer}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {['Retail', 'Distributor', 'Wholesale'].map(type => (
                                                <TouchableOpacity 
                                                    key={type}
                                                    style={[styles.typeSelection, formData.shop_type === type && styles.typeSelectionActive]}
                                                    onPress={() => setFormData({ ...formData, shop_type: type })}
                                                >
                                                    <Text style={[styles.typeText, formData.shop_type === type && styles.typeTextActive]}>{type}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.label}>Area</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
                                {areas.map(area => (
                                    <TouchableOpacity
                                        key={area.id}
                                        style={[styles.chip, formData.area_id == area.id && styles.chipActive]}
                                        onPress={() => setFormData({ ...formData, area_id: area.id })}
                                    >
                                        <Text style={[styles.chipText, formData.area_id == area.id && styles.chipTextActive]}>{area.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Customer Owner</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
                                {customers.map(cust => (
                                    <TouchableOpacity
                                        key={cust.id}
                                        style={[styles.chip, formData.customer_id == cust.id && styles.chipActive]}
                                        onPress={() => setFormData({ ...formData, customer_id: cust.id })}
                                    >
                                        <Text style={[styles.chipText, formData.customer_id == cust.id && styles.chipTextActive]}>{cust.full_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {user?.role === 'admin' && (
                                <>
                                    <Text style={styles.label}>Assigned Salesman</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
                                        <TouchableOpacity
                                            style={[styles.chip, !formData.salesman_id && styles.chipActive]}
                                            onPress={() => setFormData({ ...formData, salesman_id: '' })}
                                        >
                                            <Text style={[styles.chipText, !formData.salesman_id && styles.chipTextActive]}>Admin / Unassigned</Text>
                                        </TouchableOpacity>
                                        {employees.map(emp => (
                                            <TouchableOpacity
                                                key={emp.id}
                                                style={[styles.chip, formData.salesman_id == emp.id && styles.chipActive]}
                                                onPress={() => setFormData({ ...formData, salesman_id: emp.id })}
                                            >
                                                <Text style={[styles.chipText, formData.salesman_id == emp.id && styles.chipTextActive]}>{emp.full_name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            <Text style={styles.label}>Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
                                {['Active', 'Inactive', 'Temporarily Closed'].map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.chip, formData.status === s && styles.chipActive]}
                                        onPress={() => setFormData({ ...formData, status: s })}
                                    >
                                        <Text style={[styles.chipText, formData.status === s && styles.chipTextActive]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.phone}
                                        onChangeText={t => setFormData({ ...formData, phone: t.replace(/[^0-9]/g, "").slice(0, 10) })}
                                        placeholder="9876543210"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.label}>Credit Limit (₹)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(formData.credit_limit)}
                                        onChangeText={t => setFormData({ ...formData, credit_limit: t })}
                                        placeholder="0"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>GST Number (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.gst_number}
                                onChangeText={t => setFormData({ ...formData, gst_number: t })}
                                placeholder="Enter GSTIN"
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>City</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.city}
                                        onChangeText={t => setFormData({ ...formData, city: t })}
                                        placeholder="City"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.label}>State</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.state}
                                        onChangeText={t => setFormData({ ...formData, state: t })}
                                        placeholder="State"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>Physical Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.address}
                                onChangeText={t => setFormData({ ...formData, address: t })}
                                placeholder="Street, landmark, etc."
                                multiline={true}
                            />

                            <Text style={styles.label}>Google Maps Link</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.location}
                                onChangeText={t => setFormData({ ...formData, location: t })}
                                placeholder="https://maps.google.com/..."
                            />

                            <Text style={styles.label}>Internal Notes</Text>
                            <TextInput
                                style={[styles.input, { height: 60 }]}
                                value={formData.notes}
                                onChangeText={t => setFormData({ ...formData, notes: t })}
                                placeholder="Preferred hours, delivery notes, etc."
                                multiline={true}
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
                            {areas.map(area => (
                                <View key={area.id} style={styles.areaRow}>
                                    {editingAreaId === area.id ? (
                                        <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8, height: 40 }]}
                                                value={editAreaName}
                                                onChangeText={setEditAreaName}
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={() => handleUpdateArea(area.id)} style={styles.areaActionBtn}>
                                                <Text style={styles.areaActionText}>Save</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.areaRowName}>{area.name}</Text>
                                                <Text style={styles.areaRowSub}>{area.total_shops} Shops</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                                <TouchableOpacity onPress={() => { setEditingAreaId(area.id); setEditAreaName(area.name); }}>
                                                    <Edit size={20} color="#4b5563" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteArea(area.id, area.name)}>
                                                    <Trash2 size={20} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    )}
                                </View>
                            ))}
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
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, paddingTop: 20, elevation: 4 },
    backBtn: { padding: 8, marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
    headerTitleText: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    headerSubtitleText: { fontSize: 13, color: '#6b7280' },
    headerIconBtn: { padding: 8 },
    searchBar: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
    filterBar: { flexDirection: 'row', marginTop: 12 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    filterChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
    filterText: { fontSize: 12, color: '#4b5563' },
    filterTextActive: { color: 'white', fontWeight: 'bold' },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerInfo: { flex: 1 },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    shopName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    idBadge: { fontSize: 10, color: '#6b7280', backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontFamily: 'monospace' },
    typeBadge: { fontSize: 10, color: '#3b82f6', fontWeight: '600' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
    shopGrid: { flexDirection: 'row' },
    gridItem: { flex: 1 },
    gridLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
    gridValue: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11, color: '#6b7280' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    actionIconButton: { padding: 4 },
    iconBtnAction: { 
        padding: 8, 
        backgroundColor: '#f8fafc', 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: '#e2e8f0',
        minWidth: 36,
        alignItems: 'center',
        justifyContent: 'center'
    },
    deleteBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    backBtnModal: { 
        padding: 8, 
        backgroundColor: '#f1f5f9', 
        borderRadius: 50,
        marginRight: 4
    },
    modalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
    areaCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
    areaTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    areaIconBox: { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 12 },
    areaNameText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    areaShopCount: { fontSize: 13, color: '#6b7280' },
    areaMetrics: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fafafa', padding: 12, borderRadius: 12 },
    metricItem: { alignItems: 'center' },
    metricLabel: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
    metricValue: { fontSize: 13, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    row: { flexDirection: 'row', marginBottom: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 16, color: '#111827' },
    textArea: { height: 80, textAlignVertical: 'top' },
    pickerContainer: { flexDirection: 'row', height: 48 },
    typeSelection: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 6, justifyContent: 'center', height: 36, borderWidth: 1, borderColor: '#e5e7eb' },
    typeSelectionActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    typeText: { fontSize: 12, color: '#4b5563' },
    typeTextActive: { color: 'white', fontWeight: 'bold' },
    selectionScroll: { flexDirection: 'row', marginBottom: 20 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    chipActive: { backgroundColor: '#059669', borderColor: '#059669' },
    chipText: { fontSize: 13, color: '#4b5563' },
    chipTextActive: { color: 'white', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#059669', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    areaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    areaRowName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    areaRowSub: { fontSize: 12, color: '#6b7280' },
    areaActionBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
    areaActionText: { color: 'white', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#059669', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 12, fontSize: 16 }
});

export default ShopsScreen;
