
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Users, Package, TrendingUp, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight, ShoppingBag, Briefcase } from 'lucide-react-native';
import api from '../services/api';

const DashboardHomeScreen = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalCustomers: 0,
        totalStockItems: 0,
        totalStockValue: 0,
        lowStockCount: 0,
        recentTransactions: [],
        monthlySales: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await api.get('/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const StatCard = ({ title, value, icon: Icon, trend, isPositive, color, colorBg }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colorBg }]}>
                    <Icon color={color} size={24} />
                </View>
                <View style={[styles.trendBox, isPositive ? styles.trendPositive : styles.trendNegative]}>
                    {isPositive ? <ArrowUpRight size={14} color={isPositive ? '#166534' : '#991b1b'} /> : <ArrowDownRight size={14} color={isPositive ? '#166534' : '#991b1b'} />}
                    <Text style={[styles.trendText, { color: isPositive ? '#166534' : '#991b1b' }]}>{trend}</Text>
                </View>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardValue}>{value}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        >
            <View style={styles.header}>
                <Text style={styles.welcomeText}>System Overview</Text>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Total Sales"
                    value={`₹${stats.totalSales?.toLocaleString() || '0'}`}
                    icon={DollarSign}
                    trend="+12.5%"
                    isPositive={true}
                    color="#2563eb"
                    colorBg="#dbeafe"
                />
                <StatCard
                    title="Customers"
                    value={stats.totalCustomers || 0}
                    icon={Users}
                    trend="+3.2%"
                    isPositive={true}
                    color="#9333ea"
                    colorBg="#f3e8ff"
                />
                <StatCard
                    title="Stock Items"
                    value={stats.totalStockItems || 0}
                    icon={Package}
                    trend="-2.4%"
                    isPositive={false}
                    color="#f59e0b"
                    colorBg="#fef3c7"
                />
                <StatCard
                    title="Low Stock"
                    value={stats.lowStockCount || 0}
                    icon={AlertTriangle}
                    trend="Alert"
                    isPositive={false}
                    color="#dc2626"
                    colorBg="#fee2e2"
                />
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>

            <View style={styles.transactionsList}>
                {stats.recentTransactions?.map((tx) => (
                    <View key={tx.id} style={styles.transactionItem}>
                        <View style={[styles.txIcon, { backgroundColor: tx.type === 'sale' ? '#dcfce7' : '#f3f4f6' }]}>
                            <ShoppingBag size={20} color={tx.type === 'sale' ? '#166534' : '#6b7280'} />
                        </View>
                        <View style={styles.txInfo}>
                            <Text style={styles.txCustomer}>{tx.customer_name || 'Walk-in Customer'}</Text>
                            <Text style={styles.txDate}>{new Date(tx.transaction_date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.txAmountBox}>
                            <Text style={[styles.txAmount, tx.type === 'sale' ? styles.textSuccess : styles.textNeutral]}>
                                {tx.type === 'sale' ? '+' : ''}₹{parseFloat(tx.total_amount).toLocaleString()}
                            </Text>
                            <Text style={styles.txType}>{tx.type}</Text>
                        </View>
                    </View>
                ))}
            </View>
            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    dateText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconBox: {
        padding: 10,
        borderRadius: 12,
    },
    trendBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 2,
    },
    trendPositive: {
        backgroundColor: '#dcfce7',
    },
    trendNegative: {
        backgroundColor: '#fee2e2',
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    transactionsList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txCustomer: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    txDate: {
        fontSize: 13,
        color: '#6b7280',
    },
    txAmountBox: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    textSuccess: {
        color: '#059669',
    },
    textNeutral: {
        color: '#374151',
    },
    txType: {
        fontSize: 12,
        color: '#9ca3af',
        textTransform: 'capitalize',
    },
});

export default DashboardHomeScreen;
