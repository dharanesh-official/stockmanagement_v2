import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, TextInput
} from 'react-native';
import api from '../services/api';
import { Search, Plus, Calendar, User, DollarSign, FileText } from 'lucide-react-native';
import { format } from 'date-fns'; // Ensure date-fns is installed, or use simple JS Date

const SalesScreen = ({ navigation }) => {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await api.get('/sales'); // Ensure this endpoint returns a list
            const data = res.data || [];
            // Sort by date desc
            data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setSales(data);
            setFilteredSales(data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load sales history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchSales);
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (!sales) return;
        const query = (search || '').toLowerCase();
        const filtered = sales.filter(s => {
            const idMatch = s.id ? s.id.toString().includes(query) : false;
            const shopMatch = s.shop_name ? s.shop_name.toLowerCase().includes(query) : false;
            const customerMatch = s.customer_name ? s.customer_name.toLowerCase().includes(query) : false;
            return idMatch || shopMatch || customerMatch;
        });
        setFilteredSales(filtered);
    }, [search, sales]);

    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return '#059669'; // Green
            case 'pending': return '#d97706'; // Amber
            case 'cancelled': return '#ef4444'; // Red
            default: return '#6b7280'; // Gray
        }
    };

    const renderItem = ({ item }) => {
        if (!item) return null;
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CreateOrder', { orderId: item.id })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.row}>
                        <FileText size={16} color="#4b5563" />
                        <Text style={styles.orderId}>Order #{item.id}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                            {item.status || 'Unknown'}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <User size={14} color="#6b7280" />
                    <Text style={styles.shopName} numberOfLines={1}>
                        {item.shop_name || item.customer_name || 'Unknown Shop'}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>₹{item.total_amount || '0'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <Search size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Order ID, Shop..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#059669" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredSales}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>No orders found</Text>}
                    refreshing={loading}
                    onRefresh={fetchSales}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateOrder')}
            >
                <Plus color="white" size={24} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, padding: 12, borderRadius: 12, elevation: 2 },
    searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: '#000000' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderId: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    shopName: { fontSize: 14, color: '#374151', fontWeight: '500' },
    dateText: { fontSize: 12, color: '#6b7280' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#f3f4f6' },
    totalLabel: { color: '#6b7280', fontSize: 14 },
    totalValue: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#059669', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af' }
});

export default SalesScreen;
