import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BADGE = {
    Pending: 'badge-warning',
    Confirmed: 'badge-success',
    Completed: 'badge-info',
    Cancelled: 'badge-danger',
};

export default function TrainerSchedule() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => { fetchAppointments(); }, []);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/Appointments/trainer/schedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching trainer schedule:', err);
            setMessage({ type: 'error', text: 'Failed to load your schedule.' });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/Appointments/${id}/status`, `"${newStatus}"`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
            setMessage({ type: 'success', text: `Appointment updated to ${newStatus}.` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.Message || 'Failed to update status.' });
        }
    };

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
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>My Schedule</h1>
                    <p>Review member 1-on-1 session requests and update appointment status.</p>
                </div>
            </div>

            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Member Name</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th style={{ width: 200 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="empty">Loading your schedule...</td></tr>
                        ) : appointments.length === 0 ? (
                            <tr><td colSpan="5" className="empty">You have no appointments scheduled.</td></tr>
                        ) : appointments.map(app => (
                            <tr key={app.id}>
                                <td><strong>{app.memberName}</strong></td>
                                <td>{formatLocalDate(app.startTime)}</td>
                                <td>{formatLocalTime(app.startTime)} – {formatLocalTime(app.endTime)}</td>
                                <td><span className={`badge ${BADGE[app.status] || ''}`}>{app.status}</span></td>
                                <td>
                                    <div className="toolbar">
                                        {app.status === 'Pending' && (
                                            <>
                                                <button className="btn btn-sm" onClick={() => updateStatus(app.id, 'Confirmed')}>Approve</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => updateStatus(app.id, 'Cancelled')}>Reject</button>
                                            </>
                                        )}
                                        {app.status === 'Confirmed' && (
                                            <button className="btn btn-outline btn-sm" onClick={() => updateStatus(app.id, 'Completed')}>Mark Completed</button>
                                        )}
                                        {(app.status === 'Completed' || app.status === 'Cancelled') && (
                                            <span className="muted">—</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
