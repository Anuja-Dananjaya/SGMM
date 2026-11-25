import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const SAMPLE_PAYMENTS = [
    { paymentId: 1042, planName: 'Platinum Annual', paymentDate: '2026-11-15T10:00:00Z', amount: 15000, paymentMethod: 'Card', status: 'Completed' },
    { paymentId: 1018, planName: 'Platinum Annual', paymentDate: '2026-10-15T09:30:00Z', amount: 15000, paymentMethod: 'Card', status: 'Completed' },
    { paymentId: 994, planName: 'Gold Monthly', paymentDate: '2026-09-15T14:15:00Z', amount: 7500, paymentMethod: 'Cash', status: 'Completed' },
    { paymentId: 961, planName: 'Gold Monthly', paymentDate: '2026-08-15T11:20:00Z', amount: 7500, paymentMethod: 'Bank Transfer', status: 'Completed' },
];

export default function MyPaymentsScreen() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setPayments(SAMPLE_PAYMENTS);
                return;
            }
            const response = await axios.get('/api/Payments/my-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(response.data?.length ? response.data : SAMPLE_PAYMENTS);
        } catch {
            setPayments(SAMPLE_PAYMENTS);
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
                        <Text style={styles.metaText}>{dateStr} · {item.paymentMethod || 'Card'}</Text>
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

    return (
        <View style={styles.container}>
            <View style={styles.summaryCard}>
                <View style={styles.rowBetween}>
                    <View>
                        <Text style={styles.summaryLabel}>Current Membership &amp; Billing</Text>
                        <Text style={styles.summaryPlan}>Platinum Plan</Text>
                    </View>
                    <View style={[styles.badge, styles.badgePaid]}>
                        <Text style={styles.badgeText}>PAID</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                    <View>
                        <Text style={styles.summarySub}>Monthly Fee</Text>
                        <Text style={styles.summaryAmount}>LKR 15,000.00</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.summarySub}>Next Billing</Text>
                        <Text style={styles.summaryDate}>15 Dec 2026</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Payment History</Text>

            <FlatList
                data={payments}
                keyExtractor={(item, idx) => String(item.paymentId || item.PaymentId || idx)}
                renderItem={renderPayment}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
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
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});
