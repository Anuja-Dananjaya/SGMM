import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CreateWorkoutPlan() {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [members, setMembers] = useState([]);
    const [existingPlans, setExistingPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null); // Tracks if we are updating
    
    const initialPlanState = {
        memberId: '',
        title: '',
        goal: '',
        startDate: '',
        endDate: '',
        days: [{ dayName: '', exercises: [{ exerciseName: '', sets: 3, reps: 10, restTime: '60s', notes: '' }] }]
    };
    
    const [plan, setPlan] = useState(initialPlanState);

    useEffect(() => {
        fetchMembers();
        fetchPlans();
    }, []);

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/Members', { headers: { Authorization: `Bearer ${token}` } });
            setMembers(response.data);
        } catch (error) { console.error("Failed to load members", error); }
    };

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/WorkoutPlans/trainer', { headers: { Authorization: `Bearer ${token}` } });
            setExistingPlans(response.data);
        } catch (error) { console.error("Failed to load plans", error); }
    };

    const handleEditClick = (selectedPlan) => {
        // Map the backend response DTO back to our frontend Form structure
        setPlan({
            memberId: members.find(m => m.fullName === selectedPlan.trainerName)?.id || '', // We mapped member name to TrainerName in backend for convenience
            title: selectedPlan.title,
            goal: selectedPlan.goal,
            startDate: selectedPlan.startDate.split('T')[0],
            endDate: selectedPlan.endDate.split('T')[0],
            days: selectedPlan.days.map(d => ({
                dayName: d.dayName,
                exercises: d.exercises.map(e => ({
                    exerciseName: e.exerciseName, sets: e.sets, reps: e.reps, restTime: e.restTime, notes: e.notes
                }))
            }))
        });
        setEditingId(selectedPlan.id);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this workout plan?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/WorkoutPlans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setExistingPlans(existingPlans.filter(p => p.id !== id));
            alert("Plan deleted.");
        } catch (error) {
            console.error(error);
            alert("Failed to delete plan.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (editingId) {
                await axios.put(`/api/WorkoutPlans/${editingId}`, plan, { headers: { Authorization: `Bearer ${token}` } });
                alert("Workout Plan Updated Successfully!");
            } else {
                await axios.post('/api/WorkoutPlans', plan, { headers: { Authorization: `Bearer ${token}` } });
                alert("Workout Plan Created Successfully!");
            }
            setPlan(initialPlanState);
            setEditingId(null);
            fetchPlans();
            setView('list');
        } catch (error) {
            console.error(error);
            alert("Error saving plan.");
        } finally {
            setLoading(false);
        }
    };

    // Form Handlers
    const addDay = () => setPlan({ ...plan, days: [...plan.days, { dayName: '', exercises: [{ exerciseName: '', sets: 3, reps: 10, restTime: '60s', notes: '' }] }] });
    const addExercise = (dayIndex) => {
        const updatedDays = [...plan.days];
        updatedDays[dayIndex].exercises.push({ exerciseName: '', sets: 3, reps: 10, restTime: '60s', notes: '' });
        setPlan({ ...plan, days: updatedDays });
    };
    const handleExerciseChange = (dayIndex, exIndex, field, value) => {
        const updatedDays = [...plan.days];
        if (field === 'sets' || field === 'reps') {
            let numValue = parseInt(value);
            if (numValue < 1) numValue = 1;
            updatedDays[dayIndex].exercises[exIndex][field] = isNaN(numValue) ? '' : numValue;
        } else { updatedDays[dayIndex].exercises[exIndex][field] = value; }
        setPlan({ ...plan, days: updatedDays });
    };
    const handleDayNameChange = (dayIndex, value) => {
        const updatedDays = [...plan.days];
        updatedDays[dayIndex].dayName = value;
        setPlan({ ...plan, days: updatedDays });
    };

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button style={view === 'list' ? styles.tabActive : styles.tabInactive} onClick={() => { setView('list'); setEditingId(null); setPlan(initialPlanState); }}>
                    Manage Existing Plans
                </button>
                <button style={view === 'form' ? styles.tabActive : styles.tabInactive} onClick={() => { setView('form'); setEditingId(null); setPlan(initialPlanState); }}>
                    + Create New Plan
                </button>
            </div>

            {view === 'list' && (
                <div style={styles.card}>
                    <h3>Assigned Workout Plans</h3>
                    {existingPlans.length === 0 ? <p>No plans created yet.</p> : (
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ccc' }}>
                                    <th>Title</th>
                                    <th>Member Name</th>
                                    <th>Dates</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {existingPlans.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 0' }}><strong>{p.title}</strong></td>
                                        <td>{p.trainerName}</td>
                                        <td>{new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => handleEditClick(p)} style={{ ...styles.btnSecondary, marginRight: '5px', backgroundColor: '#007bff' }}>Edit</button>
                                            <button onClick={() => handleDelete(p.id)} style={{ ...styles.btnSecondary, backgroundColor: '#dc3545' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {view === 'form' && (
                <form onSubmit={handleSubmit}>
                    <div style={styles.card}>
                        <h3>{editingId ? "Edit Workout Plan" : "Plan Details"}</h3>
                        <select style={styles.input} required value={plan.memberId} onChange={e => setPlan({...plan, memberId: e.target.value})}>
                            <option value="">Select a Member...</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.fullName || 'Unknown'} (ID: {m.id})</option>
                            ))}
                        </select>
                        <input style={styles.input} type="text" placeholder="Plan Title" required value={plan.title} onChange={e => setPlan({...plan, title: e.target.value})} />
                        <input style={styles.input} type="text" placeholder="Goal" value={plan.goal} onChange={e => setPlan({...plan, goal: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input style={styles.input} type="date" required value={plan.startDate} onChange={e => setPlan({...plan, startDate: e.target.value})} />
                            <input style={styles.input} type="date" required value={plan.endDate} onChange={e => setPlan({...plan, endDate: e.target.value})} />
                        </div>
                    </div>

                    {plan.days.map((day, dIndex) => (
                        <div key={dIndex} style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <input style={{...styles.input, width: '50%', fontWeight: 'bold'}} type="text" placeholder="Day Name" required value={day.dayName} onChange={e => handleDayNameChange(dIndex, e.target.value)} />
                                <button type="button" onClick={() => addExercise(dIndex)} style={styles.btnSecondary}>+ Add Exercise</button>
                            </div>
                            <table style={{ width: '100%', marginTop: '10px' }}>
                                <thead>
                                    <tr><th style={{textAlign: 'left'}}>Exercise</th><th>Sets</th><th>Reps</th><th>Rest</th><th>Notes</th></tr>
                                </thead>
                                <tbody>
                                    {day.exercises.map((ex, eIndex) => (
                                        <tr key={eIndex}>
                                            <td><input style={styles.input} type="text" required value={ex.exerciseName} onChange={e => handleExerciseChange(dIndex, eIndex, 'exerciseName', e.target.value)} /></td>
                                            <td><input style={styles.input} type="number" min="1" required value={ex.sets} onChange={e => handleExerciseChange(dIndex, eIndex, 'sets', e.target.value)} /></td>
                                            <td><input style={styles.input} type="number" min="1" required value={ex.reps} onChange={e => handleExerciseChange(dIndex, eIndex, 'reps', e.target.value)} /></td>
                                            <td><input style={styles.input} type="text" value={ex.restTime} onChange={e => handleExerciseChange(dIndex, eIndex, 'restTime', e.target.value)} /></td>
                                            <td><input style={styles.input} type="text" value={ex.notes} onChange={e => handleExerciseChange(dIndex, eIndex, 'notes', e.target.value)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="button" onClick={addDay} style={styles.btnSecondary}>+ Add Another Day</button>
                        <button type="submit" disabled={loading} style={styles.btnPrimary}>{loading ? 'Saving...' : (editingId ? 'Update Plan' : 'Save Workout Plan')}</button>
                    </div>
                </form>
            )}
        </div>
    );
}

const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
    card: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    btnPrimary: { backgroundColor: '#28a745', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnSecondary: { backgroundColor: '#6c757d', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    tabActive: { backgroundColor: '#1a1a1a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    tabInactive: { backgroundColor: '#e9ecef', color: '#333', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};