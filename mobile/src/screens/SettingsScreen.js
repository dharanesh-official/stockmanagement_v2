
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react-native';

const SettingsScreen = () => {
    const { user, logout } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <User size={32} color="#4b5563" />
                </View>
                <Text style={styles.name}>{user?.full_name || 'User'}</Text>
                <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.item} onPress={() => Alert.alert('Coming Soon', 'Change Password will be available soon.')}>
                    <ShieldCheck size={20} color="#374151" />
                    <Text style={styles.itemText}>Change Password</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
    profileCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    name: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    role: { fontSize: 14, color: '#059669', fontWeight: 'bold', marginVertical: 4 },
    email: { fontSize: 14, color: '#6b7280' },
    section: { backgroundColor: 'white', borderRadius: 12, marginBottom: 24 },
    item: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    itemText: { fontSize: 16, color: '#374151' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, gap: 8 },
    logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
    version: { textAlign: 'center', color: '#9ca3af', marginTop: 24, fontSize: 12 }
});

export default SettingsScreen;
