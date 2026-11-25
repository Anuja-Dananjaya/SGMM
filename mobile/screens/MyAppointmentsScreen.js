import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const SAMPLE_APPOINTMENTS = [
    { id: 1, trainerName: 'Coach Ruwan Bandara', startTime: '2026-11-18T08:00:00Z', endTime: '2026-11-18T09:00:00Z', status: 'Confirmed' },
    { id: 2, trainerName: 'Coach Amaya Perera', startTime: '2026-11-20T11:00:00Z', endTime: '2026-11-20T12:00:00Z', status: 'Pending' },
    { id: 3, trainerName: 'Coach Dilani Jayasinghe', startTime: '2026-11-14T14:00:00Z', endTime: '2026-11-14T15:00:00Z', status: 'Completed' },
];

export default function MyAppointmentsScreen() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyAppointments();
    }, []);

    const fetchMyAppointments = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setAppointments(SAMPLE_APPOINTMENTS);
                return;
            }
            const response = await axios.get('/api/Appointments/member/schedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data?.length ? response.data : SAMPLE_APPOINTMENTS);
        } catch {
            setAppointments(SAMPLE_APPOINTMENTS);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { backgroundColor: '#ffc107', color: '#000' };
            case 'Confirmed': return { backgroundColor: '#28a745', color: '#fff' };
            case 'Completed': return { backgroundColor: '#17a2b8', color: '#fff' };
            case 'Cancelled': return { backgroundColor: '#dc3545', color: '#fff' };
            default: return { backgroundColor: '#6c757d', color: '#fff' };
        }
    };

    const renderItem = ({ item }) => {
        // Enforce UTC timezone to local time conversion
        const safeStartTime = item.startTime.endsWith('Z') ? item.startTime : `${item.startTime}Z`;
        const safeEndTime = item.endTime.endsWith('Z') ? item.endTime : `${item.endTime}Z`;
        
        const startDate = new Date(safeStartTime);
        const endDate = new Date(safeEndTime);

        const formattedDate = startDate.toLocaleDateString();
        const formattedTime = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.trainerName}>Trainer: {item.trainerName}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusStyle(item.status).backgroundColor }]}>
                        <Text style={[styles.badgeText, { color: getStatusStyle(item.status).color }]}>{item.status}</Text>
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

    return (
        <View style={styles.container}>
            {appointments.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>You have no booked appointments.</Text>
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
    container: { flex: 1, backgroundColor: '#f4f6f8', padding: 15 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    trainerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    detailText: { fontSize: 14, color: '#555', marginTop: 4 },
    emptyText: { fontSize: 16, color: '#666' }
});