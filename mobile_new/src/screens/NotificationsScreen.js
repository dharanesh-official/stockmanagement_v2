import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, 
    TouchableOpacity, RefreshControl
} from 'react-native';
import api from '../services/api';
import { 
    Bell, AlertTriangle, CheckCircle, Info, Clock, 
    TrendingUp, Package, X, CreditCard
} from 'lucide-react-native';

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'low_stock': return <Package size={20} color="#f97316" />;
            case 'big_order': return <TrendingUp size={20} color="#10b981" />;
            case 'payment_due': return <CreditCard size={20} color="#ef4444" />;
            default: return <Info size={20} color="#3b82f6" />;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={styles.iconContainer}>
                {getIcon(item.type)}
                {!item.is_read && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={[styles.notiTitle, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
                    <Text style={styles.timeText}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.notiMessage}>{item.message}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>System Alerts</Text>
                    <Text style={styles.subtitle}>{notifications.filter(n => !n.is_read).length} Unread Notifications</Text>
                </View>
                <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.markLabel}>Mark all as read</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Bell size={48} color="#e2e8f0" />
                            <Text style={styles.emptyText}>All caught up!</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    markLabel: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14 },
    list: { padding: 16 },
    notificationCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1 },
    unreadCard: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: 1 },
    iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    unreadDot: { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6', borderWidth: 2, borderColor: 'white' },
    content: { flex: 1, marginLeft: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notiTitle: { fontSize: 15, color: '#475569' },
    unreadTitle: { fontWeight: 'bold', color: '#1e293b' },
    notiMessage: { fontSize: 13, color: '#64748b', lineHeight: 18 },
    timeText: { fontSize: 11, color: '#94a3b8' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#94a3b8' }
});

export default NotificationsScreen;
