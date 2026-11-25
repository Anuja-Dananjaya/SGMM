import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function AttendanceHistoryScreen() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const fetchHistory = async () => {
        setError('');
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setError('Authentication missing. Please log in again.');
                return;
            }

            const response = await axios.get('/api/checkin/history', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHistory(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to load attendance history:', err);
            setError('Failed to load attendance history.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const raw = item.checkInTime || '';
        const dateObj = new Date(raw.endsWith('Z') ? raw : `${raw}Z`);
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
    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Attendance</Text>

            {history.length === 0 ? (
                <Text style={styles.emptyText}>You haven&apos;t checked in yet. Time to hit the gym!</Text>
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
    container: { flex: 1, backgroundColor: '#121212', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 24 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
    recordCard: { flexDirection: 'row', backgroundColor: '#1e1e1e', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#2e2e2e', alignItems: 'center' },
    dateCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    dateDay: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    dateMonth: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    timeInfo: { flex: 1 },
    titleText: { fontSize: 17, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    timeText: { fontSize: 14, color: '#aaa' },
    emptyText: { textAlign: 'center', color: '#999', fontSize: 16, marginTop: 40 },
    errorText: { color: '#f87171', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#28a745', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: 'bold' },
});
