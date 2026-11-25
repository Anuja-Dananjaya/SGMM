import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function ProfileScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
    });

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        setError('');
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setError('No authentication token found. Please log in again.');
                setLoading(false);
                return;
            }

            const response = await axios.get('/api/Members/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            setProfile(data);
            setForm({
                fullName: data.fullName || '',
                phone: data.phone || '',
            });
        } catch (err) {
            console.error('Error loading profile:', err);
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Failed to load profile. Ensure the backend is running and you have an assigned membership.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!form.fullName.trim()) {
            Alert.alert('Validation Error', 'Full name cannot be empty.');
            return;
        }

        setSaving(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            await axios.put(
                '/api/Members/me',
                {
                    fullName: form.fullName.trim(),
                    phone: form.phone.trim(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setEditing(false);
            Alert.alert('Success', 'Your personal profile has been updated.');
            fetchProfile();
        } catch (err) {
            console.error('Error updating profile:', err);
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Failed to update profile.';
            Alert.alert('Update Failed', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('token');
        navigation.replace('Login');
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#28a745" />
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error || 'Profile not available.'}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
                    <Text style={styles.btnText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#dc3545', marginTop: 12 }]} onPress={handleLogout}>
                    <Text style={styles.btnText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isActive = profile.isActive && new Date(profile.endDate) >= new Date();
    const history = Array.isArray(profile.membershipHistory) ? profile.membershipHistory : [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.headerCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'M'}
                    </Text>
                </View>
                <Text style={styles.nameText}>{profile.fullName}</Text>
                <Text style={styles.emailText}>{profile.email}</Text>
                <Text style={styles.phoneText}>{profile.phone || 'No phone number added'}</Text>

                <TouchableOpacity style={styles.editToggle} onPress={() => setEditing(e => !e)}>
                    <Text style={styles.editToggleText}>{editing ? 'Cancel Edit' : 'Edit Personal Profile'}</Text>
                </TouchableOpacity>
            </View>

            {editing && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Edit Personal Information</Text>

                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={form.fullName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#777"
                        onChangeText={v => setForm(f => ({ ...f, fullName: v }))}
                    />

                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={form.phone}
                        placeholder="e.g. 077-1234567"
                        placeholderTextColor="#777"
                        keyboardType="phone-pad"
                        onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                    />

                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={saving}>
                        <Text style={styles.btnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Current Membership</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Plan</Text>
                    <Text style={styles.value}>{profile.planName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Active Until</Text>
                    <Text style={styles.value}>{new Date(profile.endDate).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.row, { borderBottomWidth: 0 }]}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusExpired]}>
                        {isActive ? 'ACTIVE' : 'EXPIRED'}
                    </Text>
                </View>
            </View>

            <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Member Access ID</Text>
                <Text style={styles.qrCodeId}>
                    {profile.qrCodeContent ? profile.qrCodeContent.substring(0, 16) : 'N/A'}
                </Text>
                <Text style={styles.qrSubText}>Use the QR Check-in tab to scan the front-desk kiosk</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Membership History</Text>
                {history.length === 0 ? (
                    <Text style={styles.historyPeriod}>No membership history found.</Text>
                ) : history.map((item, idx) => (
                    <View
                        key={item.id}
                        style={[styles.row, idx === history.length - 1 && { borderBottomWidth: 0 }]}
                    >
                        <View>
                            <Text style={styles.value}>{item.planName}</Text>
                            <Text style={styles.historyPeriod}>
                                {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusExpired]}>
                            {item.isActive ? 'Active' : 'Expired'}
                        </Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.navButton, { backgroundColor: '#2563eb' }]}
                onPress={() => navigation.navigate('AttendanceHistory')}
            >
                <Text style={styles.btnText}>View Attendance History</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.navButton, { backgroundColor: '#28a745' }]}
                onPress={() => navigation.navigate('MyPayments')}
            >
                <Text style={styles.btnText}>My Payments &amp; Billing</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.navButton, { backgroundColor: '#d97706' }]}
                onPress={() => navigation.navigate('BookAppointment')}
            >
                <Text style={styles.btnText}>Book Personal Trainer</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.navButton, { backgroundColor: '#0f766e' }]}
                onPress={() => navigation.navigate('MyAppointments')}
            >
                <Text style={styles.btnText}>My Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.navButton, { backgroundColor: '#dc3545', marginTop: 6 }]}
                onPress={handleLogout}
            >
                <Text style={styles.btnText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 24 },
    errorText: { color: '#f87171', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#28a745', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    headerCard: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#2e2e2e' },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    nameText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    emailText: { color: '#bbb', fontSize: 14, marginTop: 3 },
    phoneText: { color: '#888', fontSize: 13, marginTop: 2 },
    editToggle: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#28a745' },
    editToggleText: { color: '#28a745', fontWeight: 'bold', fontSize: 13 },
    card: { backgroundColor: '#1e1e1e', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2e2e2e' },
    cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    inputLabel: { color: '#aaa', fontSize: 12, marginBottom: 4, marginTop: 8 },
    input: { backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#3a3a3a' },
    saveBtn: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2c2c2c' },
    label: { fontSize: 14, color: '#aaa', fontWeight: '600' },
    value: { fontSize: 14, color: '#fff', fontWeight: '600' },
    historyPeriod: { fontSize: 12, color: '#888', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, color: '#fff', fontWeight: 'bold', fontSize: 11, overflow: 'hidden' },
    statusActive: { backgroundColor: '#28a745' },
    statusExpired: { backgroundColor: '#dc3545' },
    qrCard: { backgroundColor: '#1e1e1e', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#2e2e2e' },
    qrTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#fff' },
    qrCodeId: { color: '#28a745', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
    qrSubText: { color: '#888', fontSize: 12, marginTop: 6, textAlign: 'center' },
    navButton: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
