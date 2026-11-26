import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CreateWorkoutPlan() {
    const [view, setView] = useState('list');
    const [members, setMembers] = useState([]);
    const [existingPlans, setExistingPlans] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState(null);

    const initialPlanState = {
        memberId: '',
        title: '',
        goal: '',
        startDate: '',
        endDate: '',
        days: [{ dayName: '', exercises: [{ exerciseName: '', sets: 3, reps: 10, restTime: '60s', notes: '' }] }]
    };

    const [plan, setPlan] = useState(initialPlanState);

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoadingList(true);
        try {
            const headers = authHeaders();
            const [membersRes, plansRes] = await Promise.all([
                axios.get('/api/Members', { headers }),
                axios.get('/api/WorkoutPlans/trainer', { headers })
            ]);
            setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
            setExistingPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
        } catch (err) {
            console.error('Failed to load workout plans:', err);
            setMessage({ type: 'error', text: 'Failed to load workout plans.' });
        } finally {
            setLoadingList(false);
        }
    };

    const handleEditClick = (selectedPlan) => {
        setMessage(null);
        setPlan({
            memberId: members.find(m => m.fullName === selectedPlan.trainerName)?.id || '',
            title: selectedPlan.title,
            goal: selectedPlan.goal || '',
            startDate: selectedPlan.startDate.split('T')[0],
            endDate: selectedPlan.endDate.split('T')[0],
            days: selectedPlan.days.map(d => ({
                dayName: d.dayName,
                exercises: d.exercises.map(e => ({
                    exerciseName: e.exerciseName, sets: e.sets, reps: e.reps, restTime: e.restTime || '', notes: e.notes || ''
                }))
            }))
        });
        setEditingId(selectedPlan.id);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this workout plan?')) return;
        setMessage(null);
        try {
            await axios.delete(`/api/WorkoutPlans/${id}`, { headers: authHeaders() });
            setExistingPlans(prev => prev.filter(p => p.id !== id));
            setMessage({ type: 'success', text: 'Workout plan deleted.' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to delete workout plan.' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);
        try {
            if (editingId) {
                await axios.put(`/api/WorkoutPlans/${editingId}`, plan, { headers: authHeaders() });
                setMessage({ type: 'success', text: 'Workout plan updated successfully.' });
            } else {
                await axios.post('/api/WorkoutPlans', plan, { headers: authHeaders() });
                setMessage({ type: 'success', text: 'Workout plan created successfully.' });
            }
            setPlan(initialPlanState);
            setEditingId(null);
            setView('list');
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Error saving workout plan.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSaving(false);
        }
    };

    const addDay = () => setPlan({ ...plan, days: [...plan.days, { dayName: '', exercises: [{ exerciseName: '', sets: 3, reps: 10, restTime: '60s', notes: '' }] }] });
    const addExercise = (dayIndex) => {
        const updatedDays = [...plan.days];
        updatedDays[dayIndex].exercises.push({ exerciseName: '', sets: 3, reps: 10, restTime: '60s', notes: '' });
        setPlan({ ...plan, days: updatedDays });
    };
    const handleExerciseChange = (dayIndex, exIndex, field, value) => {
        const updatedDays = [...plan.days];
        if (field === 'sets' || field === 'reps') {
            let numValue = parseInt(value, 10);
            if (numValue < 1) numValue = 1;
            updatedDays[dayIndex].exercises[exIndex][field] = isNaN(numValue) ? '' : numValue;
        } else {
            updatedDays[dayIndex].exercises[exIndex][field] = value;
        }
        setPlan({ ...plan, days: updatedDays });
    };
    const handleDayNameChange = (dayIndex, value) => {
        const updatedDays = [...plan.days];
        updatedDays[dayIndex].dayName = value;
        setPlan({ ...plan, days: updatedDays });
    };

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Workout Plans</h1>
                    <p>Design personalized multi-day workout schedules for members.</p>
                </div>
            </div>

            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

            <div className="tabs">
                <button
                    className={`tab-btn ${view === 'list' ? 'active' : ''}`}
                    onClick={() => { setView('list'); setEditingId(null); setPlan(initialPlanState); }}
                >
                    Assigned Workout Plans ({existingPlans.length})
                </button>
                <button
                    className={`tab-btn ${view === 'form' ? 'active' : ''}`}
                    onClick={() => { setView('form'); setEditingId(null); setPlan(initialPlanState); }}
                >
                    + Create New Plan
                </button>
            </div>

            {view === 'list' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Plan Title</th>
                                <th>Member</th>
                                <th>Goal</th>
                                <th>Dates</th>
                                <th style={{ width: 150 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="empty">Loading workout plans...</td></tr>
                            ) : existingPlans.length === 0 ? (
                                <tr><td colSpan="5" className="empty">No workout plans created yet.</td></tr>
                            ) : existingPlans.map(p => (
                                <tr key={p.id}>
                                    <td><strong>{p.title}</strong></td>
                                    <td>{p.trainerName}</td>
                                    <td className="muted">{p.goal || '—'}</td>
                                    <td>{new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}</td>
                                    <td>
                                        <div className="toolbar">
                                            <button className="btn btn-outline btn-sm" onClick={() => handleEditClick(p)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'form' && (
                <form onSubmit={handleSubmit} className="stack">
                    <div className="card">
                        <h3>{editingId ? 'Edit Workout Plan' : 'Plan Details'}</h3>
                        <div className="form-grid">
                            <div className="field">
                                <label>Member</label>
                                <select required value={plan.memberId} onChange={e => setPlan({ ...plan, memberId: e.target.value })}>
                                    <option value="">Select a Member...</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.fullName || 'Unknown'} (ID: {m.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Plan Title</label>
                                <input type="text" placeholder="e.g. 8-Week Strength Split" required value={plan.title} onChange={e => setPlan({ ...plan, title: e.target.value })} />
                            </div>
                            <div className="field field-wide">
                                <label>Fitness Goal</label>
                                <input type="text" placeholder="e.g. Muscle hypertrophy & core stability" value={plan.goal} onChange={e => setPlan({ ...plan, goal: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Start Date</label>
                                <input type="date" required value={plan.startDate} onChange={e => setPlan({ ...plan, startDate: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>End Date</label>
                                <input type="date" required value={plan.endDate} onChange={e => setPlan({ ...plan, endDate: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {plan.days.map((day, dIndex) => (
                        <div key={dIndex} className="card stack">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <input
                                    style={{ flex: 1, minWidth: 220, fontWeight: 600 }}
                                    type="text"
                                    placeholder="Day Name (e.g. Day 1 — Upper Body)"
                                    required
                                    value={day.dayName}
                                    onChange={e => handleDayNameChange(dIndex, e.target.value)}
                                />
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => addExercise(dIndex)}>+ Add Exercise</button>
                            </div>

                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Exercise</th>
                                            <th style={{ width: 90 }}>Sets</th>
                                            <th style={{ width: 90 }}>Reps</th>
                                            <th style={{ width: 110 }}>Rest</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {day.exercises.map((ex, eIndex) => (
                                            <tr key={eIndex}>
                                                <td><input style={{ width: '100%' }} type="text" required value={ex.exerciseName} onChange={e => handleExerciseChange(dIndex, eIndex, 'exerciseName', e.target.value)} /></td>
                                                <td><input style={{ width: '100%' }} type="number" min="1" required value={ex.sets} onChange={e => handleExerciseChange(dIndex, eIndex, 'sets', e.target.value)} /></td>
                                                <td><input style={{ width: '100%' }} type="number" min="1" required value={ex.reps} onChange={e => handleExerciseChange(dIndex, eIndex, 'reps', e.target.value)} /></td>
                                                <td><input style={{ width: '100%' }} type="text" value={ex.restTime} onChange={e => handleExerciseChange(dIndex, eIndex, 'restTime', e.target.value)} /></td>
                                                <td><input style={{ width: '100%' }} type="text" value={ex.notes} onChange={e => handleExerciseChange(dIndex, eIndex, 'notes', e.target.value)} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-outline" onClick={addDay}>+ Add Another Day</button>
                        <button type="submit" className="btn" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Update Plan' : 'Save Workout Plan'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
