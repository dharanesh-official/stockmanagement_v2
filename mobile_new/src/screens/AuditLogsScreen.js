import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, 
    TouchableOpacity, TextInput
} from 'react-native';
import api from '../services/api';
import { 
    Activity, User, Clock, Search, Shield, 
    Database, Settings, Trash2, Edit, Plus, Smartphone
} from 'lucide-react-native';

const AuditLogsScreen = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = async () => {
        try {
            const res = await api.get('/settings/activity');
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getActionIcon = (action) => {
        if (action.includes('Created')) return <Plus size={16} color="#10b981" />;
        if (action.includes('Updated')) return <Edit size={16} color="#3b82f6" />;
        if (action.includes('Deleted')) return <Trash2 size={16} color="#ef4444" />;
        if (action.includes('System')) return <Settings size={16} color="#64748b" />;
        return <Activity size={16} color="#64748b" />;
    };

    const renderItem = ({ item }) => (
        <View style={styles.logCard}>
            <View style={styles.logHeader}>
                <View style={styles.actionRow}>
                    {getActionIcon(item.action)}
                    <Text style={styles.actionText}>{item.action}</Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>

            <View style={styles.logBody}>
                <View style={styles.userRow}>
                    <User size={12} color="#94a3b8" />
                    <Text style={styles.userName}>{item.full_name || 'System'}</Text>
                    <Text style={styles.userEmail}>({item.email || 'auto'})</Text>
                </View>
                {item.details ? (
                    <View style={styles.detailsBox}>
                        <Text style={styles.detailsText}>{JSON.stringify(item.details, null, 2)}</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.logFooter}>
                <Smartphone size={10} color="#cbd5e1" />
                <Text style={styles.ipText}>IP: {item.ip_address}</Text>
            </View>
        </View>
    );

    const filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.full_name && log.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Shield size={24} color="#6366f1" />
                    <Text style={styles.title}>Audit Logs</Text>
                </View>
                <Text style={styles.subtitle}>Security and Activity Monitoring</Text>
            </View>

            <View style={styles.searchBar}>
                <Search size={20} color="#94a3b8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search logs by action or user..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>
            ) : (
                <FlatList
                    data={filteredLogs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No activity logs found</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7ff' },
    header: { padding: 24, backgroundColor: 'white' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e1b4b' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, paddingHorizontal: 16, borderRadius: 12, height: 48, elevation: 1 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 14 },
    list: { padding: 16 },
    logCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    dateText: { fontSize: 11, color: '#94a3b8' },
    logBody: { marginBottom: 12 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    userName: { fontSize: 12, fontWeight: '600', color: '#475569' },
    userEmail: { fontSize: 11, color: '#94a3b8' },
    detailsBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#e2e8f0' },
    detailsText: { fontSize: 10, fontFamily: 'monospace', color: '#64748b' },
    logFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    ipText: { fontSize: 10, color: '#cbd5e1' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#94a3b8' }
});

export default AuditLogsScreen;
