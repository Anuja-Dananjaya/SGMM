import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';


const SAMPLE_PLANS = [
    {
        id: 1,
        title: '8-Week Lean Strength Split',
        trainerName: 'Coach Ruwan Bandara',
        goal: 'Build upper-body strength and improve core endurance',
        startDate: '2026-11-01T00:00:00Z',
        endDate: '2026-12-27T00:00:00Z',
        days: [
            {
                id: 11,
                dayName: 'Day 1 — Push (Chest & Shoulders)',
                exercises: [
                    { id: 101, exerciseName: 'Barbell Bench Press', sets: 4, reps: 8, restTime: '90s', notes: 'Control the lowering phase' },
                    { id: 102, exerciseName: 'Incline Dumbbell Press', sets: 3, reps: 10, restTime: '60s', notes: 'Full range of motion' },
                    { id: 103, exerciseName: 'Lateral Raises', sets: 3, reps: 15, restTime: '45s', notes: '' },
                ],
            },
            {
                id: 12,
                dayName: 'Day 2 — Pull & Core',
                exercises: [
                    { id: 104, exerciseName: 'Lat Pulldown', sets: 4, reps: 10, restTime: '60s', notes: 'Squeeze shoulder blades' },
                    { id: 105, exerciseName: 'Hanging Leg Raises', sets: 3, reps: 12, restTime: '45s', notes: '' },
                ],
            },
        ],
    },
];

export default function MyWorkoutPlanScreen() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlanId, setExpandedPlanId] = useState(1);

    useEffect(() => {
        fetchMyPlans();
    }, []);

    const fetchMyPlans = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');

            if (!token) {
                setPlans(SAMPLE_PLANS);
                setLoading(false);
                return;
            }

            const response = await axios.get('/api/WorkoutPlans/member', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPlans(response.data?.length ? response.data : SAMPLE_PLANS);
        } catch {
            setPlans(SAMPLE_PLANS);
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