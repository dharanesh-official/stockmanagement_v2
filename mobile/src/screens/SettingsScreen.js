
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ScrollView, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, User, ShieldCheck, Bell, Info, X, ChevronRight } from 'lucide-react-native';

const SettingsScreen = () => {
    const { user, logout } = useAuth();
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [aboutModalVisible, setAboutModalVisible] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);

    const handleUpdateProfile = async () => {
        if (!profileData.full_name) {
            Alert.alert('Validation', 'Name is required');
            return;
        }
        setLoading(true);
        try {
            await api.put(`/users/${user.id}`, { ...profileData, role: user.role });
            Alert.alert('Success', 'Profile updated successfully');
            setProfileModalVisible(false);
            // Ideally refresh user context here, but logout/login works for now or app reload
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            Alert.alert('Validation', 'All fields are required');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Alert.alert('Validation', 'New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api.put(`/users/${user.id}/change-password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            Alert.alert('Success', 'Password changed successfully');
            setPasswordModalVisible(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            const msg = err.response?.data || 'Failed to change password';
            Alert.alert('Error', typeof msg === 'string' ? msg : 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

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
                <TouchableOpacity style={styles.item} onPress={() => {
                    setProfileData({ ...profileData, full_name: user?.full_name, email: user?.email });
                    setProfileModalVisible(true);
                }}>
                    <View style={styles.itemLeft}>
                        <User size={20} color="#374151" />
                        <Text style={styles.itemText}>Edit Profile</Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.item} onPress={() => setPasswordModalVisible(true)}>
                    <View style={styles.itemLeft}>
                        <ShieldCheck size={20} color="#374151" />
                        <Text style={styles.itemText}>Change Password</Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>

                <View style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Bell size={20} color="#374151" />
                        <Text style={styles.itemText}>Notifications</Text>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ true: '#059669', false: '#d1d5db' }}
                    />
                </View>

                <TouchableOpacity style={styles.item} onPress={() => setAboutModalVisible(true)}>
                    <View style={styles.itemLeft}>
                        <Info size={20} color="#374151" />
                        <Text style={styles.itemText}>About App</Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>

            {/* Profile Modal */}
            <Modal visible={profileModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.full_name}
                            onChangeText={t => setProfileData({ ...profileData, full_name: t })}
                        />
                        <Text style={styles.label}>Email (Read Only)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#f3f4f6' }]}
                            value={profileData.email}
                            editable={false}
                        />
                        <TouchableOpacity style={styles.btn} onPress={handleUpdateProfile} disabled={loading}>
                            <Text style={styles.btnText}>{loading ? 'Updating...' : 'Update Profile'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Password Modal */}
            <Modal visible={passwordModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.label}>Current Password</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            value={passwordData.currentPassword}
                            onChangeText={t => setPasswordData({ ...passwordData, currentPassword: t })}
                        />
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            value={passwordData.newPassword}
                            onChangeText={t => setPasswordData({ ...passwordData, newPassword: t })}
                        />
                        <Text style={styles.label}>Confirm New Password</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            value={passwordData.confirmPassword}
                            onChangeText={t => setPasswordData({ ...passwordData, confirmPassword: t })}
                        />
                        <TouchableOpacity style={styles.btn} onPress={handleChangePassword} disabled={loading}>
                            <Text style={styles.btnText}>{loading ? 'Changing...' : 'Change Password'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* About Modal */}
            <Modal visible={aboutModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>About Stock Manager</Text>
                            <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.aboutText}>
                            Stock Manager App v1.0.0{'\n\n'}
                            Developed for efficient inventory and sales management.{'\n\n'}
                            &copy; 2026 Dharanesh
                        </Text>
                    </View>
                </View>
            </Modal>
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
    section: { backgroundColor: 'white', borderRadius: 12, marginBottom: 24, overflow: 'hidden' },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemText: { fontSize: 16, color: '#374151' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, gap: 8 },
    logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
    version: { textAlign: 'center', color: '#9ca3af', marginTop: 24, fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    label: { fontWeight: '600', marginBottom: 8, color: '#374151' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: '#111827' },
    btn: { backgroundColor: '#059669', padding: 14, borderRadius: 12, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    aboutText: { color: '#4b5563', lineHeight: 22 }
});

export default SettingsScreen;
