import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function MyPaymentsScreen() {
    const [profile, setProfile] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchBillingData();
        }, [])
    );

    const fetchBillingData = async () => {
        setError('');
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setError('No authentication token found. Please log in again.');
                return;
            }
            const headers = { Authorization: `Bearer ${token}` };

            const [profileRes, paymentsRes] = await Promise.all([
                axios.get('/api/Members/me', { headers }),
                axios.get('/api/Payments/my-history', { headers }),
            ]);

            setProfile(profileRes.data);
            setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
        } catch (err) {
            console.error('Error loading payment history:', err);
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Failed to load payment history.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const renderPayment = ({ item }) => {
        const status = item.status || item.Status || 'Completed';
        const isPaid = status === 'Completed';
        const dateStr = new Date(item.paymentDate || item.PaymentDate).toLocaleDateString();

        return (
            <View style={styles.paymentCard}>
                <View style={styles.rowBetween}>
                    <View>
                        <Text style={styles.planTitle}>{item.planName || 'Gym Membership'}</Text>
                        <Text style={styles.metaText}>{dateStr} · {item.paymentMethod || 'Cash'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.amountText}>
                            LKR {Number(item.amount || item.Amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                        <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
                            <Text style={styles.badgeText}>{isPaid ? 'PAID' : status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
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
                <TouchableOpacity style={styles.retryBtn} onPress={fetchBillingData}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isActive = profile?.isActive && new Date(profile.endDate) >= new Date();

    return (
        <View style={styles.container}>
            {profile && (
                <View style={styles.summaryCard}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.summaryLabel}>Current Membership &amp; Billing</Text>
                            <Text style={styles.summaryPlan}>{profile.planName}</Text>
                        </View>
                        <View style={[styles.badge, isActive ? styles.badgePaid : styles.badgeOverdue]}>
                            <Text style={styles.badgeText}>{isActive ? 'ACTIVE' : 'OVERDUE'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.summarySub}>Plan Fee</Text>
                            <Text style={styles.summaryAmount}>
                                LKR {Number(profile.planPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.summarySub}>Valid Until</Text>
                            <Text style={styles.summaryDate}>{new Date(profile.endDate).toLocaleDateString()}</Text>
                        </View>
                    </View>
                </View>
            )}

            <Text style={styles.sectionTitle}>Payment History ({payments.length})</Text>

            <FlatList
                data={payments}
                keyExtractor={(item, idx) => String(item.paymentId || item.PaymentId || idx)}
                renderItem={renderPayment}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No payments recorded for your account yet.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 24 },
    errorText: { color: '#f87171', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#28a745', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: 'bold' },
    summaryCard: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: '#28a745',
        marginBottom: 20,
    },
    summaryLabel: { color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
    summaryPlan: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 4 },
    divider: { height: 1, backgroundColor: '#2c2c2c', marginVertical: 14 },
    summarySub: { color: '#999', fontSize: 12 },
    summaryAmount: { color: '#28a745', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
    summaryDate: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 2 },
    sectionTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 12 },
    paymentCard: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2e2e2e',
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    metaText: { color: '#999', fontSize: 13, marginTop: 4 },
    amountText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
    badgePaid: { backgroundColor: '#28a745' },
    badgePending: { backgroundColor: '#d97706' },
    badgeOverdue: { backgroundColor: '#dc3545' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    emptyBox: { backgroundColor: '#1e1e1e', padding: 24, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2e2e2e' },
    emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
});
