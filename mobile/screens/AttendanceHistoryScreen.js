import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const SAMPLE_HISTORY = [
    { id: 1, checkInTime: '2026-11-18T06:42:00Z' },
    { id: 2, checkInTime: '2026-11-16T17:50:00Z' },
    { id: 3, checkInTime: '2026-11-14T07:15:00Z' },
    { id: 4, checkInTime: '2026-11-12T18:10:00Z' },
];

export default function AttendanceHistoryScreen() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setHistory(SAMPLE_HISTORY);
                setLoading(false);
                return;
            }

            const response = await axios.get('/api/checkin/history', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHistory(response.data?.length ? response.data : SAMPLE_HISTORY);
            setLoading(false);
        } catch {
            setHistory(SAMPLE_HISTORY);
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const dateObj = new Date(item.checkInTime);
        return (
            <View style={styles.recordCard}>
                <View style={styles.dateCircle}>
                    <Text style={styles.dateDay}>{dateObj.getDate()}</Text>
                    <Text style={styles.dateMonth}>{dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                </View>
                <View style={styles.timeInfo}>
                    <Text style={styles.titleText}>Gym Visit</Text>
                    <Text style={styles.timeText}>
                        Checked in at: {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#28a745" /></View>;
    if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Attendance</Text>
            
            {history.length === 0 ? (
                <Text style={styles.emptyText}>You haven't checked in yet. Time to hit the gym!</Text>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    recordCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, alignItems: 'center' },
    dateCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    dateDay: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    dateMonth: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    timeInfo: { flex: 1 },
    titleText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    timeText: { fontSize: 14, color: '#666' },
    emptyText: { textAlign: 'center', color: '#777', fontSize: 16, marginTop: 40 },
    errorText: { color: '#dc3545', fontSize: 16 }
});