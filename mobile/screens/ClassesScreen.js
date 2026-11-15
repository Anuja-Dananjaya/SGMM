import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

export default function ClassesScreen({ navigation }) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch classes whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchClasses();
        }, [])
    );

    const fetchClasses = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const response = await axios.get('/api/Classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error("Error fetching classes:", error);
            Alert.alert("Error", "Could not load classes.");
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
            Alert.alert("Success", "Class booked successfully!");
            fetchClasses(); // Refresh the list to update the enrolled count
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to book class.";
            Alert.alert("Booking Failed", errorMessage);
        }
    };

    const renderItem = ({ item }) => {
        const isFull = item.enrolledCount >= item.capacity;
        const classDate = new Date(item.classDate).toLocaleDateString();

        return (
            <View style={styles.card}>
                <Text style={styles.className}>{item.className}</Text>
                <Text style={styles.classDetails}>{item.description}</Text>
                <Text style={styles.classDetails}>Date: {classDate}</Text>
                <Text style={styles.classDetails}>Time: {item.startTime} - {item.endTime}</Text>
                <Text style={styles.classDetails}>Spots: {item.enrolledCount} / {item.capacity}</Text>
                
                <TouchableOpacity 
                    style={[styles.bookButton, isFull && styles.fullButton]}
                    onPress={() => handleBookClass(item.classId)}
                    disabled={isFull}
                >
                    <Text style={styles.bookButtonText}>
                        {isFull ? "Class Full" : "Book Now"}
                    </Text>
                </TouchableOpacity>
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
            <FlatList
                data={classes}
                keyExtractor={(item) => item.classId.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No classes available.</Text>}
            />
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
    className: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: 5,
    },
    classDetails: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 3,
    },
    bookButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    fullButton: {
        backgroundColor: '#555',
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