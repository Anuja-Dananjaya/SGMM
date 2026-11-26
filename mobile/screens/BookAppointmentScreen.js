import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export default function BookAppointmentScreen({ navigation }) {
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState('');
    const [date, setDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
    const [showIosPicker, setShowIosPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingTrainers, setFetchingTrainers] = useState(true);

    useEffect(() => {
        const loadTrainers = async () => {
            try {
                const token = await SecureStore.getItemAsync('token');
                const response = await axios.get('/api/Trainers', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const list = Array.isArray(response.data) ? response.data : [];
                setTrainers(list);
            } catch (error) {
                console.error('Error fetching trainers:', error);
                Alert.alert('Error', 'Could not load trainers from the server.');
            } finally {
                setFetchingTrainers(false);
            }
        };

        loadTrainers();
    }, []);

    const selectedTrainer = trainers.find(t => t.id === selectedTrainerId);

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
        if (!selectedTrainerId) {
            Alert.alert('Error', 'Please select a trainer.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const endTime = new Date(date.getTime() + 60 * 60 * 1000);

            const payload = {
                memberId: 1, // Overwritten securely by the backend from JWT
                trainerId: selectedTrainerId,
                startTime: date.toISOString(),
                endTime: endTime.toISOString()
            };

            const response = await axios.post('/api/Appointments/book', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', response.data.message || response.data.Message || 'Appointment booked!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.Message || 'Failed to book appointment.';
            Alert.alert('Booking Failed', errorMsg);
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
                        <ActivityIndicator size="small" color="#28a745" style={{ margin: 15 }} />
                    ) : (
                        <Picker
                            selectedValue={selectedTrainerId}
                            onValueChange={(itemValue) => setSelectedTrainerId(itemValue)}
                            dropdownIconColor="#fff"
                            style={{ color: '#fff' }}
                        >
                            <Picker.Item label="Select a Trainer..." value="" color="#999" />
                            {trainers.map(trainer => (
                                <Picker.Item
                                    key={trainer.id}
                                    label={`${trainer.fullName || trainer.name}${trainer.specialization ? ` (${trainer.specialization})` : ''}`}
                                    value={trainer.id}
                                    color="#111"
                                />
                            ))}
                        </Picker>
                    )}
                </View>

                {selectedTrainer && (
                    <View style={styles.trainerInfoBox}>
                        <Text style={styles.trainerInfoTitle}>{selectedTrainer.fullName || selectedTrainer.name}</Text>
                        <Text style={styles.trainerInfoLine}>Specialization: {selectedTrainer.specialization || 'Personal Training'}</Text>
                        <Text style={styles.trainerInfoLine}>Availability: {selectedTrainer.availability || 'Mon-Fri 08:00-16:00'}</Text>
                        <Text style={styles.trainerInfoLine}>Status: {selectedTrainer.status || 'Active'}</Text>
                    </View>
                )}

                <Text style={styles.label}>Select Date &amp; Time (1-hour session)</Text>
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
    container: { flex: 1, backgroundColor: '#121212', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
    card: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#2e2e2e' },
    label: { fontSize: 15, fontWeight: 'bold', color: '#ccc', marginBottom: 10, marginTop: 10 },
    pickerContainer: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 8, marginBottom: 14, backgroundColor: '#2a2a2a' },
    trainerInfoBox: { backgroundColor: '#252525', borderRadius: 8, padding: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#28a745' },
    trainerInfoTitle: { color: '#28a745', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
    trainerInfoLine: { color: '#ccc', fontSize: 13, marginTop: 2 },
    dateButton: { padding: 15, backgroundColor: '#2a2a2a', borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#3a3a3a' },
    dateText: { fontSize: 16, color: '#fff', fontWeight: '500' },
    submitButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 6 },
    disabledButton: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
