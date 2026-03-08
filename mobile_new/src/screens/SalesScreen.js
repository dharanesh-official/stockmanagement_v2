import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput, ScrollView, RefreshControl, Linking
} from 'react-native';
import api from '../services/api';
import { 
    Search, Plus, Calendar, User, DollarSign, FileText, 
    Filter, ChevronRight, ShoppingBag, CreditCard, 
    CheckCircle2, Clock, XCircle, MoreVertical, MapPin, Navigation, RotateCcw
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const SalesScreen = ({ navigation }) => {
    const { user, hasPermission } = useAuth();
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'order', 'sale', 'payment', 'return'];

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales');
            setSales(res.data || []);
            applyFilters(res.data || [], activeFilter, search);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load sales history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchSales);
        return unsubscribe;
    }, [navigation]);

    const applyFilters = (data, type, query) => {
        let filtered = [...data];
        
        if (type !== 'All') {
            filtered = filtered.filter(s => s.type === type);
        }

        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(s => 
                (s.invoice_number && s.invoice_number.toLowerCase().includes(q)) || 
                (s.shop_name && s.shop_name.toLowerCase().includes(q)) ||
                (s.customer_name && s.customer_name.toLowerCase().includes(q))
            );
        }

        setFilteredSales(filtered);
    };

    useEffect(() => {
        applyFilters(sales, activeFilter, search);
    }, [search, activeFilter, sales]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSales();
    };

    const getStatusIcon = (status, type) => {
        if (type === 'payment') return <CheckCircle2 size={16} color="#059669" />;
        if (type === 'return') return <RotateCcw size={16} color="#f43f5e" />;
        
        switch (status?.toLowerCase()) {
            case 'completed': return <CheckCircle2 size={16} color="#059669" />;
            case 'pending': return <Clock size={16} color="#d97706" />;
            case 'cancelled': return <XCircle size={16} color="#ef4444" />;
            default: return <Clock size={16} color="#6b7280" />;
        }
    };

    const getStatusColor = (status, type) => {
        if (type === 'payment') return '#059669';
        if (type === 'return') return '#f43f5e';
        
        switch (status?.toLowerCase()) {
            case 'completed': return '#059669';
            case 'pending': return '#d97706';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const renderItem = ({ item }) => {
        const isOrder = item.type === 'order' || item.type === 'sale';
        const balance = isOrder ? (Number(item.total_amount) - Number(item.paid_amount || 0)) : 0;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => isOrder ? navigation.navigate('CreateOrder', { orderId: item.id }) : null}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerTitle}>
                        <FileText size={18} color="#4b5563" />
                        <View>
                            <Text style={styles.orderId}>{item.invoice_number ? `#${item.invoice_number}` : `TXN-${item.id.slice(0,8)}`}</Text>
                            <View style={styles.originRow}>
                                <Text style={styles.txnType}>{item.type?.toUpperCase()}</Text>
                                <View style={styles.originDot} />
                                <Text style={styles.originText}>{item.order_type || 'Direct Sale'}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, item.type) + '15' }]}>
                        {getStatusIcon(item.status, item.type)}
                        <Text style={[styles.statusText, { color: getStatusColor(item.status, item.type) }]}>
                            {item.status || 'Active'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.shopRow}>
                        <TouchableOpacity 
                            style={styles.shopLink} 
                            onPress={() => item.shop_id ? navigation.navigate('Shops', { shopId: item.shop_id }) : null}
                        >
                            <ShoppingBag size={14} color="#6366f1" />
                            <Text style={styles.shopName} numberOfLines={1}>{item.shop_name || item.customer_name || 'Walking Customer'}</Text>
                            {item.shop_id && <ChevronRight size={12} color="#cbd5e1" />}
                        </TouchableOpacity>
                        
                        {item.shop_location && (
                            <TouchableOpacity 
                                style={styles.mapBtn}
                                onPress={() => {
                                    const url = item.shop_location.startsWith('http') 
                                        ? item.shop_location 
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.shop_location)}`;
                                    Linking.openURL(url);
                                }}
                            >
                                <MapPin size={14} color="#059669" />
                                <Text style={styles.mapBtnText}>Map</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Calendar size={12} color="#94a3b8" />
                            <Text style={styles.metaText}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <User size={12} color="#94a3b8" />
                            <Text style={styles.metaText}>{item.salesman_name || 'Admin'}</Text>
                        </View>
                    </View>

                    <View style={styles.financials}>
                        <View style={styles.amountCol}>
                            <Text style={styles.amountLabel}>{item.type === 'payment' ? 'Amount Paid' : 'Bill Total'}</Text>
                            <Text style={[styles.amountVal, item.type === 'payment' && {color: '#059669'}]}>₹{Number(item.total_amount).toLocaleString()}</Text>
                        </View>
                        {isOrder && balance > 0 && (
                            <View style={styles.amountCol}>
                                <Text style={styles.amountLabel}>Balance Due</Text>
                                <Text style={[styles.amountVal, {color: '#ef4444'}]}>₹{balance.toLocaleString()}</Text>
                            </View>
                        )}
                        <View style={styles.amountCol}>
                            <Text style={styles.amountLabel}>Method</Text>
                            <View style={styles.methodRow}>
                                <CreditCard size={12} color="#64748b" />
                                <Text style={styles.methodText}>{item.payment_method || 'Cash'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {item.notes ? (
                    <View style={styles.notesBox}>
                        <Text style={styles.notesText} numberOfLines={1}>"{item.notes}"</Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchBox}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search bills, shops or customers..."
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <XCircle size={18} color="#cbd5e1" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                    <View style={styles.filterIcon}>
                        <Filter size={16} color="#64748b" />
                    </View>
                    {filters.map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
            ) : (
                <FlatList
                    data={filteredSales}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <FileText size={48} color="#e2e8f0" />
                            <Text style={styles.emptyText}>No matching transactions</Text>
                        </View>
                    }
                />
            )}

            {hasPermission('sales', 'create') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateOrder')}
                >
                    <Plus color="white" size={28} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: 'white', paddingBottom: 12, elevation: 2 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', margin: 16, paddingHorizontal: 16, borderRadius: 14, height: 50 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b' },
    filterRow: { paddingHorizontal: 16, marginBottom: 4 },
    filterIcon: { marginRight: 12, justifyContent: 'center' },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    filterText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    filterTextActive: { color: 'white', fontWeight: 'bold' },
    list: { padding: 16 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 16, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    txnType: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 1 },
    originRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    originDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1', marginHorizontal: 6 },
    originText: { fontSize: 10, color: '#6366f1', fontWeight: '700' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardBody: { gap: 12 },
    shopRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fcfaff', borderRadius: 10, paddingRight: 8 },
    shopLink: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, flex: 1 },
    shopName: { fontSize: 14, fontWeight: '600', color: '#4338ca', flex: 1 },
    mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
    mapBtnText: { fontSize: 12, fontWeight: 'bold', color: '#059669' },
    metaRow: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#94a3b8' },
    financials: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 14 },
    amountCol: { flex: 1 },
    amountLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 4 },
    amountVal: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    methodRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    methodText: { fontSize: 12, color: '#64748b' },
    notesBox: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    notesText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4f46e5', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4f46e5', shadowOpacity: 0.4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: '#94a3b8', fontSize: 16 }
});

export default SalesScreen;
