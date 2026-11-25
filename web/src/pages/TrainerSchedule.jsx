import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SAMPLE_APPOINTMENTS = [
    { id: 1, memberName: 'Kasun Perera', startTime: '2026-11-18T08:00:00Z', endTime: '2026-11-18T09:00:00Z', status: 'Pending' },
    { id: 2, memberName: 'Nimali Fernando', startTime: '2026-11-18T11:00:00Z', endTime: '2026-11-18T12:00:00Z', status: 'Confirmed' },
    { id: 3, memberName: 'Dinesh Kumara', startTime: '2026-11-17T14:00:00Z', endTime: '2026-11-17T15:00:00Z', status: 'Completed' },
    { id: 4, memberName: 'Tharushi Silva', startTime: '2026-11-19T16:00:00Z', endTime: '2026-11-19T17:00:00Z', status: 'Cancelled' },
];

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
        const token = localStorage.getItem('token');
        if (!token || token === 'demo-token') {
            setAppointments(SAMPLE_APPOINTMENTS);
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('/api/Appointments/trainer/schedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data?.length ? response.data : SAMPLE_APPOINTMENTS);
        } catch {
            setAppointments(SAMPLE_APPOINTMENTS);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('token');
        if (!token || token === 'demo-token') {
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
            setMessage({ type: 'success', text: `Appointment updated to ${newStatus}.` });
            return;
        }

        try {
            await axios.put(`/api/Appointments/${id}/status`, `"${newStatus}"`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
            setMessage({ type: 'success', text: `Appointment updated to ${newStatus}.` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status.' });
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
