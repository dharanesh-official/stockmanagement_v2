
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, ScrollView, Modal, Share
} from 'react-native';
import api from '../services/api';
import { Search, Plus, Filter, FileText, Trash2, Edit, CheckCircle, Truck, Eye, Share2, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const OrdersScreen = ({ navigation }) => {
    const { hasPermission } = useAuth();
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales');
            setSales(res.data);
            filterSales(res.data, statusFilter);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch sales');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchSales();
        });
        return unsubscribe;
    }, [navigation]);

    const filterSales = (data, status) => {
        if (status === 'All') {
            setFilteredSales(data);
        } else {
            setFilteredSales(data.filter(s => s.status === status));
        }
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        filterSales(sales, status);
    };

    const handleStatusUpdate = async (id, nextStatus) => {
        setUpdatingId(id);
        try {
            await api.put(`/sales/${id}`, { status: nextStatus });
            fetchSales();
        } catch (err) {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/sales/${id}`);
                            fetchSales();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete order');
                        }
                    }
                }
            ]
        );
    };

    const openInvoice = (item) => {
        navigation.navigate('Invoice', { orderId: item.id });
    };

    const handleEdit = (item) => {
        navigation.navigate('CreateOrder', { orderId: item.id });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return '#10b981';
            case 'Dispatched': return '#3b82f6';
            case 'Ordered': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.date}>{new Date(item.transaction_date).toLocaleDateString()}</Text>
                    <Text style={styles.customer}>{item.customer_name}</Text>
                </View>
                <Text style={styles.amount}>₹{Number(item.total_amount).toLocaleString()}</Text>
            </View>

            <View style={styles.detailsRow}>
                <Text style={styles.shop}>{item.shop_name || 'Direct Sale'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openInvoice(item)}>
                        <FileText size={20} color="#4b5563" />
                    </TouchableOpacity>
                    {hasPermission('sales', 'edit') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                            <Edit size={20} color="#2563eb" />
                        </TouchableOpacity>
                    )}
                    {hasPermission('sales', 'delete') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>

                {hasPermission('sales', 'edit') && (
                    <View style={styles.statusActions}>
                        {item.status === 'Ordered' && (
                            <TouchableOpacity
                                style={[styles.statusBtn, { backgroundColor: '#3b82f6' }]}
                                onPress={() => handleStatusUpdate(item.id, 'Dispatched')}
                                disabled={updatingId === item.id}
                            >
                                <Truck size={16} color="white" />
                                <Text style={styles.statusBtnText}>Dispatch</Text>
                            </TouchableOpacity>
                        )}
                        {item.status === 'Dispatched' && (
                            <TouchableOpacity
                                style={[styles.statusBtn, { backgroundColor: '#10b981' }]}
                                onPress={() => handleStatusUpdate(item.id, 'Delivered')}
                                disabled={updatingId === item.id}
                            >
                                <CheckCircle size={16} color="white" />
                                <Text style={styles.statusBtnText}>Deliver</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
            {updatingId === item.id && <ActivityIndicator size="small" color="#059669" style={{ marginTop: 8 }} />}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['All', 'Ordered', 'Dispatched', 'Delivered'].map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                            onPress={() => handleStatusFilter(status)}
                        >
                            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#059669" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredSales}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No orders found</Text>}
                />
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    filterBar: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#059669',
    },
    filterText: {
        color: '#374151',
        fontWeight: '500',
    },
    filterTextActive: {
        color: 'white',
    },
    list: {
        padding: 16,
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
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    customer: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    amount: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    shop: {
        fontSize: 14,
        color: '#4b5563',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    leftActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        padding: 8,
    },
    statusActions: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    statusBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#9ca3af',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    invoiceBody: { gap: 8 },
    invoiceLabel: { fontSize: 14, color: '#6b7280' },
    invoiceValue: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    shareBtn: { flexDirection: 'row', backgroundColor: '#059669', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 },
    shareBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default OrdersScreen;
