import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const getTypeBadgeColor = (type) => {
    if (type === 'Expiry Reminder') return '#d97706';
    if (type === 'Payment Reminder') return '#dc3545';
    return '#2563eb';
};

export default function NotificationsScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchMyNotifications();
        }, [])
    );

    const fetchMyNotifications = async () => {
        setError('');
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setError('Please log in again.');
                return;
            }
            const res = await axios.get('/api/Notifications/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading notifications:', err);
            setError('Failed to load your notifications.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const raw = item.sentAt || '';
        const dateStr = raw
            ? new Date(raw.endsWith('Z') ? raw : `${raw}Z`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
            : '';

        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <View style={[styles.badge, { backgroundColor: getTypeBadgeColor(item.type) }]}>
                        <Text style={styles.badgeText}>{item.type}</Text>
                    </View>
                    <Text style={styles.dateText}>{dateStr}</Text>
                </View>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={styles.body}>{item.messageBody}</Text>
            </View>
        );
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
                <TouchableOpacity style={styles.retryBtn} onPress={fetchMyNotifications}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No notifications yet. Reminders and class confirmations will appear here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 24 },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2e2e2e',
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    dateText: { color: '#888', fontSize: 12 },
    subject: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
    body: { color: '#bbb', fontSize: 13, lineHeight: 19 },
    emptyBox: { backgroundColor: '#1e1e1e', padding: 24, borderRadius: 12, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#2e2e2e' },
    emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
    errorText: { color: '#f87171', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#28a745', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: 'bold' },
});
