import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const SAMPLE_PROFILE = {
    fullName: 'Kasun Perera',
    email: 'kasun@sgmm.lk',
    phone: '077-4582910',
    emergencyContact: 'Nimali Perera (071-8892310)',
    planName: 'Platinum Plan',
    startDate: '2026-01-15T00:00:00Z',
    endDate: '2027-01-15T00:00:00Z',
    qrCodeContent: 'SGMM-MBR-94827164-KASUN',
    isActive: true,
};

const SAMPLE_HISTORY = [
    { id: 1, plan: 'Platinum Plan', period: 'Jan 2026 – Jan 2027', status: 'Active' },
    { id: 2, plan: 'Gold Plan', period: 'Jan 2025 – Dec 2025', status: 'Expired' },
];

export default function ProfileScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        emergencyContact: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const applyProfile = (data) => {
        const merged = {
            ...SAMPLE_PROFILE,
            ...data,
            phone: data.phone || SAMPLE_PROFILE.phone,
            emergencyContact: data.emergencyContact || SAMPLE_PROFILE.emergencyContact,
            qrCodeContent: data.qrCodeContent || SAMPLE_PROFILE.qrCodeContent,
        };
        setProfile(merged);
        setForm({
            fullName: merged.fullName,
            phone: merged.phone,
            emergencyContact: merged.emergencyContact,
        });
    };

    const fetchProfile = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                applyProfile(SAMPLE_PROFILE);
                return;
            }

            const response = await axios.get('/api/Members/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            applyProfile(response.data);
        } catch {
            applyProfile(SAMPLE_PROFILE);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = () => {
        setProfile(prev => ({
            ...prev,
            fullName: form.fullName,
            phone: form.phone,
            emergencyContact: form.emergencyContact,
        }));
        setEditing(false);
        Alert.alert('Profile Updated', 'Your personal details have been saved.');
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('token');
        navigation.replace('Login');
    };

    if (loading || !profile) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#28a745" />
            </View>
        );
    }

    const isExpired = new Date(profile.endDate) < new Date();

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
                <Text style={styles.phoneText}>{profile.phone}</Text>

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
                        onChangeText={v => setForm(f => ({ ...f, fullName: v }))}
                    />

                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={form.phone}
                        keyboardType="phone-pad"
                        onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                    />

                    <Text style={styles.inputLabel}>Emergency Contact</Text>
                    <TextInput
                        style={styles.input}
                        value={form.emergencyContact}
                        onChangeText={v => setForm(f => ({ ...f, emergencyContact: v }))}
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                        <Text style={styles.btnText}>Save Changes</Text>
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
                    <Text style={[styles.statusBadge, isExpired ? styles.statusExpired : styles.statusActive]}>
                        {isExpired ? 'OVERDUE' : 'ACTIVE'}
                    </Text>
                </View>
            </View>

            <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Member Access QR Code</Text>
                <View style={styles.qrMatrix}>
                    <View style={styles.qrRow}>
                        <View style={styles.qrFinder} />
                        <View style={styles.qrDots} />
                        <View style={styles.qrFinder} />
                    </View>
                    <View style={styles.qrCenterRow}>
                        <View style={styles.qrBlock} />
                        <View style={[styles.qrBlock, { backgroundColor: '#28a745' }]} />
                        <View style={styles.qrBlock} />
                    </View>
                    <View style={styles.qrRow}>
                        <View style={styles.qrFinder} />
                        <View style={styles.qrDots} />
                        <View style={styles.qrBlock} />
                    </View>
                </View>
                <Text style={styles.qrCodeId}>{profile.qrCodeContent.substring(0, 16)}</Text>
                <Text style={styles.qrSubText}>Show at front desk or scan kiosk with Check-in tab</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Membership History</Text>
                {SAMPLE_HISTORY.map((item, idx) => (
                    <View
                        key={item.id}
                        style={[styles.row, idx === SAMPLE_HISTORY.length - 1 && { borderBottomWidth: 0 }]}
                    >
                        <View>
                            <Text style={styles.value}>{item.plan}</Text>
                            <Text style={styles.historyPeriod}>{item.period}</Text>
                        </View>
                        <Text style={[styles.statusBadge, item.status === 'Active' ? styles.statusActive : styles.statusExpired]}>
                            {item.status}
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
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
    qrTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#fff' },
    qrMatrix: { width: 132, height: 132, backgroundColor: '#fff', borderRadius: 10, padding: 12, justifyContent: 'space-between' },
    qrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qrCenterRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    qrFinder: { width: 28, height: 28, borderWidth: 5, borderColor: '#111', borderRadius: 4 },
    qrDots: { width: 22, height: 12, backgroundColor: '#111', borderRadius: 2 },
    qrBlock: { width: 20, height: 20, backgroundColor: '#111', borderRadius: 3 },
    qrCodeId: { color: '#28a745', fontWeight: 'bold', marginTop: 10, fontSize: 13 },
    qrSubText: { color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' },
    navButton: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
