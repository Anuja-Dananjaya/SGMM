import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function BookAppointmentScreen({ navigation }) {
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState('');
    const [date, setDate] = useState(new Date());
    const [showIosPicker, setShowIosPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingTrainers, setFetchingTrainers] = useState(true);

    // Fetch real trainers using your global axios baseURL
    useEffect(() => {
        const loadTrainers = async () => {
            try {
                const token = await SecureStore.getItemAsync('token');
                
                const response = await axios.get('/api/Trainers', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const loadedTrainers = [
                    { id: '', name: 'Select a Trainer...' },
                    ...response.data
                ];
                
                setTrainers(loadedTrainers);
            } catch (error) {
                console.error("Error fetching trainers:", error);
                Alert.alert('Error', 'Could not load trainers from the server.');
            } finally {
                setFetchingTrainers(false);
            }
        };

        loadTrainers();
    }, []);

    const handleOpenPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: date,
                mode: 'date',
                minimumDate: new Date(),
                onChange: (event, selectedDate) => {
                    if (event.type === 'set' && selectedDate) {
                        DateTimePickerAndroid.open({
                            value: selectedDate,
                            mode: 'time',
                            onChange: (timeEvent, selectedTime) => {
                                if (timeEvent.type === 'set' && selectedTime) {
                                    setDate(selectedTime);
                                }
                            }
                        });
                    }
                },
            });
        } else {
            setShowIosPicker(true);
        }
    };

    const onIosChange = (event, selectedDate) => {
        setShowIosPicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const handleBooking = async () => {
        if (!selectedTrainer) {
            Alert.alert('Error', 'Please select a trainer.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const endTime = new Date(date.getTime() + 60 * 60 * 1000);

            const payload = {
                memberId: 1, // Securely overwritten by the backend's JWT extraction
                trainerId: selectedTrainer,
                startTime: date.toISOString(),
                endTime: endTime.toISOString()
            };

            const response = await axios.post('/api/Appointments/book', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Success", response.data.message, [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to book appointment.";
            Alert.alert("Booking Failed", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.header}>Book a Trainer</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Select Trainer</Text>
                <View style={styles.pickerContainer}>
                    {fetchingTrainers ? (
                        <ActivityIndicator size="small" color="#0000ff" style={{ margin: 15 }} />
                    ) : (
                        <Picker
                            selectedValue={selectedTrainer}
                            onValueChange={(itemValue) => setSelectedTrainer(itemValue)}
                        >
                            {trainers.map(trainer => (
                                <Picker.Item key={trainer.id} label={trainer.name} value={trainer.id} />
                            ))}
                        </Picker>
                    )}
                </View>

                <Text style={styles.label}>Select Date & Time</Text>
                <TouchableOpacity style={styles.dateButton} onPress={handleOpenPicker}>
                    <Text style={styles.dateText}>
                        {date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && showIosPicker && (
                    <DateTimePicker
                        value={date}
                        mode="datetime"
                        display="default"
                        onChange={onIosChange}
                        minimumDate={new Date()} 
                    />
                )}

                <TouchableOpacity 
                    style={[styles.submitButton, loading && styles.disabledButton]} 
                    onPress={handleBooking}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirm Booking</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 10, marginTop: 10 },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, justifyContent: 'center' },
    dateButton: { padding: 15, backgroundColor: '#e9ecef', borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    dateText: { fontSize: 16, color: '#333', fontWeight: '500' },
    submitButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    disabledButton: { backgroundColor: '#80c490' },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});