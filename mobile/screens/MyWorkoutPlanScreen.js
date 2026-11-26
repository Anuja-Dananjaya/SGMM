import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

export default function MyWorkoutPlanScreen() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlanId, setExpandedPlanId] = useState(null);

    useFocusEffect(
        useCallback(() => {
            fetchMyPlans();
        }, [])
    );

    const fetchMyPlans = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setPlans([]);
                return;
            }

            const response = await axios.get('/api/WorkoutPlans/member', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const list = Array.isArray(response.data) ? response.data : [];
            setPlans(list);
            if (list.length > 0 && expandedPlanId === null) {
                setExpandedPlanId(list[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch workout plans:', error);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const togglePlan = (id) => {
        setExpandedPlanId(expandedPlanId === id ? null : id);
    };

    const renderExercise = (exercise) => (
        <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                <Text style={styles.exerciseSetsReps}>{exercise.sets} Sets × {exercise.reps} Reps</Text>
            </View>
            <View style={styles.exerciseDetails}>
                {exercise.restTime ? <Text style={styles.detailText}>⏱ Rest: {exercise.restTime}</Text> : null}
                {exercise.notes ? <Text style={styles.detailText}>📝 Note: {exercise.notes}</Text> : null}
            </View>
        </View>
    );

    const renderDay = (day) => (
        <View key={day.id} style={styles.dayContainer}>
            <Text style={styles.dayName}>{day.dayName}</Text>
            {day.exercises.map(renderExercise)}
        </View>
    );

    const renderPlan = ({ item }) => {
        const isExpanded = expandedPlanId === item.id;
        
        return (
            <View style={styles.planCard}>
                <TouchableOpacity style={styles.planHeader} onPress={() => togglePlan(item.id)}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.planTitle}>{item.title}</Text>
                        <Text style={styles.planTrainer}>Trainer: {item.trainerName}</Text>
                        <Text style={styles.planDates}>
                            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#fff" />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.planContent}>
                        {item.goal ? <Text style={styles.planGoal}>Goal: {item.goal}</Text> : null}
                        {item.days.map(renderDay)}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#28a745" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {plans.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="barbell-outline" size={60} color="gray" />
                    <Text style={styles.noPlansText}>No workout plans assigned yet.</Text>
                    <Text style={styles.noPlansSubText}>Talk to your trainer to get started!</Text>
                </View>
            ) : (
                <FlatList
                    data={plans}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderPlan}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
    listContainer: { padding: 15 },
    noPlansText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 15 },
    noPlansSubText: { color: 'gray', fontSize: 14, marginTop: 5 },
    
    planCard: { backgroundColor: '#1e1e1e', borderRadius: 10, marginBottom: 15, overflow: 'hidden' },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#2a2a2a' },
    planTitle: { color: '#28a745', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    planTrainer: { color: '#ccc', fontSize: 14 },
    planDates: { color: 'gray', fontSize: 12, marginTop: 3 },
    
    planContent: { padding: 15 },
    planGoal: { color: '#fff', fontStyle: 'italic', marginBottom: 15 },
    
    dayContainer: { marginBottom: 20 },
    dayName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
    
    exerciseCard: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, marginBottom: 10 },
    exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    exerciseName: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
    exerciseSetsReps: { color: '#28a745', fontSize: 14, fontWeight: 'bold' },
    
    exerciseDetails: { marginTop: 5 },
    detailText: { color: '#aaa', fontSize: 13, marginTop: 2 }
});