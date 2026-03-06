import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator, 
    TouchableOpacity, Dimensions
} from 'react-native';
import api from '../services/api';
import { 
    TrendingUp, Users, Target, BarChart3, PieChart, 
    Calendar, Map, ArrowUpRight, Trophy, Package
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const AnalyticsScreen = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('This Month');

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [perfRes, leadRes] = await Promise.all([
                api.get(`/analytics/performance/${user.id}`),
                api.get('/analytics/leaderboard')
            ]);
            setData(perfRes.data);
            setLeaderboard(leadRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

    const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
        <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statLabel}>{title}</Text>
                <Text style={styles.statValue}>{value}</Text>
                {subValue ? <Text style={styles.statSub}>{subValue}</Text> : null}
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Performance Insights</Text>
                    <Text style={styles.subtitle}>Real-time sales tracking</Text>
                </View>
                <TouchableOpacity style={styles.rangeBtn}>
                    <Calendar size={16} color="#6366f1" />
                    <Text style={styles.rangeText}>{timeRange}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                StatCard 
                <StatCard 
                    title="Total Revenue" 
                    value={`₹${Number(data?.performance?.total_sales_value || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    color="#10b981"
                    subValue={`${data?.performance?.total_orders || 0} Orders placed`}
                />
                <StatCard 
                    title="Collection" 
                    value={`₹${Number(data?.performance?.total_collections || 0).toLocaleString()}`}
                    icon={Trophy}
                    color="#f59e0b"
                    subValue="Total cash collected"
                />
                <StatCard 
                    title="Customers" 
                    value={data?.acquisitions?.new_customers || 0}
                    icon={Users}
                    color="#3b82f6"
                    subValue="New clients acquired"
                />
                <StatCard 
                    title="Orders Target" 
                    value="84%"
                    icon={Target}
                    color="#6366f1"
                    subValue="Goal: 50 Orders/mo"
                />
            </View>

            <Text style={styles.sectionTitle}>Area Performance</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaRow}>
                {data?.area_breakdown?.map((area, idx) => (
                    <View key={idx} style={styles.areaCard}>
                        <Map size={20} color="#6366f1" />
                        <Text style={styles.areaName}>{area.area_name}</Text>
                        <Text style={styles.areaVal}>₹{Number(area.area_sales || 0).toLocaleString()}</Text>
                        <View style={styles.areaBar}>
                            <View style={[styles.areaProgress, { width: '65%' }]} />
                        </View>
                        <Text style={styles.areaShops}>{area.total_shops} Shops</Text>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Sales Leaderboard</Text>
            <View style={styles.leaderboard}>
                {leaderboard.map((item, idx) => (
                    <View key={idx} style={styles.leaderRow}>
                        <View style={styles.leaderLeft}>
                            <View style={[styles.rankCircle, idx < 3 && styles.topRank]}>
                                <Text style={[styles.rankText, idx < 3 && styles.topRankText]}>{idx + 1}</Text>
                            </View>
                            <View>
                                <Text style={styles.leaderName}>{item.full_name}</Text>
                                <Text style={styles.leaderOrders}>{item.order_count} Orders</Text>
                            </View>
                        </View>
                        <View style={styles.leaderRight}>
                            <Text style={styles.leaderAmount}>₹{Number(item.total_sales || 0).toLocaleString()}</Text>
                            <ArrowUpRight size={14} color="#10b981" />
                        </View>
                    </View>
                ))}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfaff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e1b4b' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    rangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    rangeText: { fontSize: 12, color: '#6366f1', fontWeight: 'bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
    statCard: { width: '48%', backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statContent: {},
    statLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    statSub: { fontSize: 10, color: '#64748b', marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', marginLeft: 24, marginTop: 10, marginBottom: 16 },
    areaRow: { paddingLeft: 24, marginBottom: 24 },
    areaCard: { width: 150, backgroundColor: 'white', borderRadius: 20, padding: 16, marginRight: 16, elevation: 1 },
    areaName: { fontSize: 14, fontWeight: 'bold', color: '#1e1b4b', marginTop: 12 },
    areaVal: { fontSize: 16, color: '#6366f1', fontWeight: 'bold', marginTop: 4 },
    areaBar: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, marginVertical: 10 },
    areaProgress: { height: 4, backgroundColor: '#6366f1', borderRadius: 2 },
    areaShops: { fontSize: 11, color: '#94a3b8' },
    leaderboard: { marginHorizontal: 24, backgroundColor: 'white', borderRadius: 24, padding: 12, elevation: 1 },
    leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    leaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rankCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    topRank: { backgroundColor: '#6366f1' },
    rankText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
    topRankText: { color: 'white' },
    leaderName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    leaderOrders: { fontSize: 11, color: '#94a3b8' },
    leaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    leaderAmount: { fontSize: 14, fontWeight: 'bold', color: '#10b981' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default AnalyticsScreen;
