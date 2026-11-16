import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TrainerSchedule() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            // In web applications, JWTs are typically stored in localStorage
            const token = localStorage.getItem('token'); 
            
            const response = await axios.get('/api/Appointments/trainer/schedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setAppointments(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching schedule:", err);
            setError("Failed to load appointments. Please ensure you are logged in as a Trainer.");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            
            // Because the C# backend expects a raw string [FromBody], we must wrap it in quotes
            await axios.put(`/api/Appointments/${id}/status`, `"${newStatus}"`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });

            // Update the UI locally so we don't have to re-fetch the entire list
            setAppointments(prev => 
                prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
            );
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status. " + (err.response?.data?.message || ""));
        }
    };

    if (loading) return <div style={styles.center}>Loading your schedule...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>My Schedule</h2>
            
            {appointments.length === 0 ? (
                <p>You have no appointments scheduled.</p>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Member Name</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Time</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map(app => {
                            // Helper to force UTC strings back into Sri Lankan local time
                            const formatLocalDate = (utcString) => {
                                if (!utcString) return '';
                                const safeString = utcString.includes('Z') ? utcString : `${utcString}Z`;
                                return new Date(safeString).toLocaleDateString();
                            };

                            const formatLocalTime = (utcString) => {
                                if (!utcString) return '';
                                const safeString = utcString.includes('Z') ? utcString : `${utcString}Z`;
                                return new Date(safeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            };

                            return (
                                <tr key={app.id} style={styles.tr}>
                                    <td style={styles.td}><strong>{app.memberName}</strong></td>
                                    <td style={styles.td}>{formatLocalDate(app.startTime)}</td>
                                    <td style={styles.td}>
                                        {formatLocalTime(app.startTime)} - {formatLocalTime(app.endTime)}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={getStatusBadgeStyle(app.status)}>{app.status}</span>
                                    </td>
                                    <td style={styles.td}>
                                        {app.status === 'Pending' && (
                                            <>
                                                <button onClick={() => updateStatus(app.id, 'Confirmed')} style={{...styles.btn, ...styles.btnConfirm}}>Approve</button>
                                                <button onClick={() => updateStatus(app.id, 'Cancelled')} style={{...styles.btn, ...styles.btnCancel}}>Reject</button>
                                            </>
                                        )}
                                        {app.status === 'Confirmed' && (
                                            <button onClick={() => updateStatus(app.id, 'Completed')} style={{...styles.btn, ...styles.btnComplete}}>Mark Completed</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// Basic inline styles to ensure it looks clean immediately (you can swap this for standard CSS/Tailwind later)
const styles = {
    container: { padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' },
    center: { textAlign: 'center', padding: '50px', fontSize: '18px' },
    error: { color: 'red', textAlign: 'center', padding: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    th: { backgroundColor: '#f8f9fa', padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' },
    tr: { borderBottom: '1px solid #dee2e6' },
    td: { padding: '12px', verticalAlign: 'middle' },
    btn: { padding: '6px 12px', margin: '0 4px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' },
    btnConfirm: { backgroundColor: '#28a745' },
    btnCancel: { backgroundColor: '#dc3545' },
    btnComplete: { backgroundColor: '#007bff' }
};

const getStatusBadgeStyle = (status) => {
    let backgroundColor = '#6c757d'; // Default gray
    if (status === 'Pending') backgroundColor = '#ffc107'; // Yellow
    if (status === 'Confirmed') backgroundColor = '#28a745'; // Green
    if (status === 'Completed') backgroundColor = '#17a2b8'; // Blue
    if (status === 'Cancelled') backgroundColor = '#dc3545'; // Red

    return {
        padding: '4px 8px', borderRadius: '12px', color: status === 'Pending' ? '#000' : '#fff', backgroundColor, fontSize: '12px', fontWeight: 'bold'
    };
};