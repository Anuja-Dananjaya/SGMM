import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

export default function ClassesScreen() {
    const [activeTab, setActiveTab] = useState('available'); // 'available' | 'bookings'
    const [classes, setClasses] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                const classesRes = await axios.get('/api/Classes', { headers });
                setClasses(classesRes.data);
            } catch (error) {
                console.error('Error loading classes:', error);
                Alert.alert('Error', 'Could not load classes.');
            }

            try {
                const bookingsRes = await axios.get('/api/Classes/my-bookings', { headers });
                setMyBookings(bookingsRes.data);
            } catch (error) {
                console.warn('Could not load my bookings (backend may need restart):', error?.message || error);
                setMyBookings([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBookClass = async (classId) => {
        try {
            const token = await SecureStore.getItemAsync('token');
            await axios.post(`/api/Classes/${classId}/book`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Success', 'Class booked successfully!');
            fetchData();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.Message || 'Failed to book class.';
            Alert.alert('Booking Failed', errorMessage);
        }
    };

    const handleCancelBooking = (booking) => {
        Alert.alert(
            'Cancel Booking',
            `Cancel your booking for ${booking.className}?`,
            [
                { text: 'Keep', style: 'cancel' },
                {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await SecureStore.getItemAsync('token');
                            await axios.put(`/api/Classes/bookings/${booking.bookingId}/cancel`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Cancelled', 'Your booking has been cancelled.');
                            fetchData();
                        } catch (error) {
                            const errorMessage = error.response?.data?.message || error.response?.data?.Message || 'Failed to cancel booking.';
                            Alert.alert('Cancellation Failed', errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const confirmedClassIds = new Set(
        myBookings.filter(b => b.status === 'Confirmed').map(b => b.classId)
    );

    const renderClassItem = ({ item }) => {
        const isFull = item.enrolledCount >= item.capacity;
        const isBooked = confirmedClassIds.has(item.classId);
        const classDate = new Date(item.classDate).toLocaleDateString();

        return (
            <View style={styles.card}>
                <Text style={styles.className}>{item.className}</Text>
                {item.description ? <Text style={styles.classDetails}>{item.description}</Text> : null}
                <Text style={styles.classDetails}>Date: {classDate}</Text>
                <Text style={styles.classDetails}>Time: {item.startTime} - {item.endTime}</Text>
                <Text style={styles.classDetails}>Spots: {item.enrolledCount} / {item.capacity}</Text>

                <TouchableOpacity
                    style={[
                        styles.bookButton,
                        isBooked ? styles.bookedButton : isFull ? styles.fullButton : null
                    ]}
                    onPress={() => handleBookClass(item.classId)}
                    disabled={isFull || isBooked}
                >
                    <Text style={styles.bookButtonText}>
                        {isBooked ? 'Already Booked' : isFull ? 'Class Full' : 'Book Now'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderBookingItem = ({ item }) => {
        const classDate = new Date(item.classDate).toLocaleDateString();
        const bookedDate = new Date(item.bookingDate).toLocaleDateString();
        const isConfirmed = item.status === 'Confirmed';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.className}>{item.className}</Text>
                    <View style={[styles.badge, isConfirmed ? styles.badgeConfirmed : styles.badgeCancelled]}>
                        <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                </View>

                <Text style={styles.classDetails}>Class Date: {classDate}</Text>
                <Text style={styles.classDetails}>Time: {item.startTime} - {item.endTime}</Text>
                <Text style={styles.classDetails}>Booked On: {bookedDate}</Text>

                {item.canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(item)}
                    >
                        <Text style={styles.bookButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}
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
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('available')}
                >
                    <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
                        Available Classes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'bookings' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('bookings')}
                >
                    <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
                        My Bookings ({myBookings.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'available' ? (
                <FlatList
                    data={classes}
                    keyExtractor={(item) => item.classId.toString()}
                    renderItem={renderClassItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No classes available.</Text>}
                />
            ) : (
                <FlatList
                    data={myBookings}
                    keyExtractor={(item) => item.bookingId.toString()}
                    renderItem={renderBookingItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>You have no class bookings yet.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 6,
        gap: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#1e1e1e',
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#28a745',
        borderColor: '#28a745',
    },
    tabText: {
        color: '#aaa',
        fontWeight: 'bold',
        fontSize: 14,
    },
    tabTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 15,
    },
    card: {
        backgroundColor: '#1e1e1e',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    className: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: 5,
        flexShrink: 1,
    },
    classDetails: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 3,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    badgeConfirmed: {
        backgroundColor: '#28a745',
    },
    badgeCancelled: {
        backgroundColor: '#dc3545',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    bookButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    bookedButton: {
        backgroundColor: '#1f6f8b',
    },
    fullButton: {
        backgroundColor: '#555',
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    }
});
