
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert,
    TouchableOpacity, ScrollView
} from 'react-native';
import api from '../services/api';
import { Search, Plus, Filter, FileText, Trash2, Edit, CheckCircle, Truck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const SalesScreen = ({ navigation }) => {
    const { hasPermission } = useAuth();
    const [sales, setSales] = useState([]);
    const [todaysSales, setTodaysSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales');
            const allSales = res.data;

            // Filter for today's sales only
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayData = allSales.filter(s => {
                const saleDate = new Date(s.transaction_date);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === today.getTime();
            });

            setSales(todayData);
            setTodaysSales(todayData);
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
                    <Text style={styles.date}>{new Date(item.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Invoice', { orderId: item.id })}>
                        <FileText size={20} color="#4b5563" />
                    </TouchableOpacity>
                    {hasPermission('sales', 'edit') && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateOrder', { orderId: item.id })}>
                            <Edit size={20} color="#2563eb" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Today's Sales</Text>
                <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#059669" style={styles.loader} />
            ) : (
                <FlatList
                    data={todaysSales}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No sales today</Text>}
                />
            )}

            {hasPermission('sales', 'create') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateOrder')}
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: 'white',
        padding: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
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
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#9ca3af',
    },
});

export default SalesScreen;
