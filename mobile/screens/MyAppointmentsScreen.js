import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function MyAppointmentsScreen() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchMyAppointments();
        }, [])
    );

    const fetchMyAppointments = async () => {
        setError('');
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setError('Authentication missing. Please log in again.');
                return;
            }
            const response = await axios.get('/api/Appointments/member/schedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { backgroundColor: '#d97706', color: '#fff' };
            case 'Confirmed': return { backgroundColor: '#28a745', color: '#fff' };
            case 'Completed': return { backgroundColor: '#2563eb', color: '#fff' };
            case 'Cancelled': return { backgroundColor: '#dc3545', color: '#fff' };
            default: return { backgroundColor: '#6c757d', color: '#fff' };
        }
    };

    const renderItem = ({ item }) => {
        const safeStartTime = item.startTime.endsWith('Z') ? item.startTime : `${item.startTime}Z`;
        const safeEndTime = item.endTime.endsWith('Z') ? item.endTime : `${item.endTime}Z`;

        const startDate = new Date(safeStartTime);
        const endDate = new Date(safeEndTime);

        const formattedDate = startDate.toLocaleDateString();
        const formattedTime = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const badgeStyle = getStatusStyle(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.trainerName}>Trainer: {item.trainerName}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
                        <Text style={[styles.badgeText, { color: badgeStyle.color }]}>{item.status}</Text>
                    </View>
                </View>
                <Text style={styles.detailText}>Date: {formattedDate}</Text>
                <Text style={styles.detailText}>Time: {formattedTime}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#28a745" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchMyAppointments}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {appointments.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>You have no booked appointments yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 15 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 24 },
    card: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#2e2e2e' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    trainerName: { fontSize: 16, fontWeight: 'bold', color: '#fff', flexShrink: 1 },
    badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginLeft: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    detailText: { fontSize: 14, color: '#bbb', marginTop: 4 },
    emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
    errorText: { color: '#f87171', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#28a745', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: 'bold' },
});
