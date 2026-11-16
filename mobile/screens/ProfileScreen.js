import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function ProfileScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // MATCHED LOGIN KEY: Retrieve 'token' using SecureStore
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setError('No authentication token found. Please log in again.');
                setLoading(false);
                return;
            }

            const response = await axios.get('/api/Members/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProfile(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load profile. Ensure your backend is running.');
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        // MATCHED LOGIN KEY: Remove 'token' using SecureStore
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

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
                    <Text style={styles.buttonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isExpired = new Date(profile.endDate) < new Date();

    return (
        // Changed View to ScrollView here
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={{ paddingBottom: 40 }} // Adds space at the very bottom
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.headerCard}>
                <Text style={styles.nameText}>{profile.fullName}</Text>
                <Text style={styles.emailText}>{profile.email}</Text>
            </View>

            <View style={styles.detailsCard}>
                <View style={styles.row}>
                    <Text style={styles.label}>Plan:</Text>
                    <Text style={styles.value}>{profile.planName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Active Until:</Text>
                    <Text style={styles.value}>{new Date(profile.endDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={[styles.statusBadge, isExpired ? styles.statusExpired : styles.statusActive]}>
                        {isExpired ? 'OVERDUE' : 'ACTIVE'}
                    </Text>
                </View>
            </View>

            <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Your Access QR Code</Text>
                <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrText}>{profile.qrCodeContent.substring(0, 8)}...</Text>
                    <Text style={styles.qrSubText}>(QR Code renders here)</Text>
                </View>
            </View>

            {/* 1. BLUE BUTTON: View Attendance */}
            <TouchableOpacity 
                style={[styles.logoutButton, { backgroundColor: '#007bff', marginBottom: 15 }]} 
                onPress={() => navigation.navigate('AttendanceHistory')}
            >
                <Text style={styles.logoutButtonText}>View Attendance History</Text>
            </TouchableOpacity>

            {/* 2. YELLOW BUTTON: Book Trainer */}
            <TouchableOpacity 
                style={[styles.logoutButton, { backgroundColor: '#ffc107', marginBottom: 15 }]} 
                onPress={() => navigation.navigate('BookAppointment')}
            >
                <Text style={[styles.logoutButtonText, { color: '#000' }]}>Book Personal Trainer</Text>
            </TouchableOpacity>

            {/* 3. RED BUTTON: Log Out */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

            {/* NEW: Button to view appointments */}
            <TouchableOpacity 
                style={[styles.bookButton, { backgroundColor: '#17a2b8', marginTop: 10 }]} 
                onPress={() => navigation.navigate('MyAppointments')}
            ></TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerCard: { backgroundColor: '#343a40', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    nameText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    emailText: { color: '#adb5bd', fontSize: 16, marginTop: 5 },
    detailsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    label: { fontSize: 16, color: '#555', fontWeight: 'bold' },
    value: { fontSize: 16, color: '#333' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, color: '#fff', fontWeight: 'bold', overflow: 'hidden' },
    statusActive: { backgroundColor: '#28a745' },
    statusExpired: { backgroundColor: '#dc3545' },
    qrCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginBottom: 30 },
    qrTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    qrPlaceholder: { width: 150, height: 150, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    qrText: { color: '#6c757d', fontWeight: 'bold' },
    qrSubText: { color: '#adb5bd', fontSize: 12, marginTop: 5 },
    logoutButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 10, alignItems: 'center' },
    logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    errorText: { color: '#dc3545', fontSize: 16, marginBottom: 15 },
    retryButton: { backgroundColor: '#007bff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 },
    buttonText: { color: '#fff', fontWeight: 'bold' }
});