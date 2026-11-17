import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const EMPTY_FORM = {
    trainerId: '1',
    className: '',
    description: '',
    classDate: '',
    startTime: '',
    endTime: '',
    capacity: ''
};

const formatTimeSpan = (t) => (t && t.length === 5 ? `${t}:00` : t);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtTime = (t) => (t ? String(t).slice(0, 5) : '—');

export default function AdminClasses() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

    // Bookings panel state
    const [selectedClass, setSelectedClass] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    const authConfig = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('/api/Classes', authConfig());
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setMessage({ type: 'error', text: 'Failed to load classes.' });
        }
    };

    const fetchClassBookings = async (gymClass) => {
        setSelectedClass(gymClass);
        setLoadingBookings(true);
        try {
            const response = await axios.get(`/api/Classes/${gymClass.classId}/bookings`, authConfig());
            setBookings(response.data);
        } catch (error) {
            console.error('Error fetching class bookings:', error);
            setMessage({ type: 'error', text: 'Failed to load bookings for this class.' });
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            const payload = {
                trainerId: parseInt(formData.trainerId, 10),
                className: formData.className,
                description: formData.description,
                classDate: formData.classDate,
                startTime: formatTimeSpan(formData.startTime),
                endTime: formatTimeSpan(formData.endTime),
                capacity: parseInt(formData.capacity, 10)
            };

            await axios.post('/api/Classes', payload, authConfig());
            setMessage({ type: 'success', text: 'Class scheduled successfully.' });
            setFormData(EMPTY_FORM);
            setShowForm(false);
            fetchClasses();
        } catch (error) {
            console.error('Error creating class:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || error.response?.data?.Message || 'Failed to schedule class.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this member booking?')) return;
        setMessage(null);
        try {
            await axios.put(`/api/Classes/bookings/${bookingId}/cancel`, {}, authConfig());
            setMessage({ type: 'success', text: 'Booking cancelled successfully.' });
            if (selectedClass) {
                await fetchClassBookings(selectedClass);
            }
            await fetchClasses();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || error.response?.data?.Message || 'Failed to cancel booking.'
            });
        }
    };

    const filteredClasses = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return classes;
        return classes.filter(c =>
            c.className?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        );
    }, [classes, search]);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Classes & Bookings</h1>
                    <p>Schedule gym classes and manage member bookings.</p>
                </div>
                <button
                    className="btn"
                    onClick={() => {
                        setMessage(null);
                        setShowForm(prev => !prev);
                    }}
                >
                    {showForm ? 'Close Form' : '+ Schedule Class'}
                </button>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}

            {showForm && (
                <div className="card">
                    <h3>Schedule new class</h3>
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="field">
                            <label>Class Name</label>
                            <input
                                type="text"
                                name="className"
                                placeholder="e.g. Morning HIIT"
                                value={formData.className}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Trainer ID</label>
                            <input
                                type="number"
                                name="trainerId"
                                min="1"
                                value={formData.trainerId}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="field field-wide">
                            <label>Description</label>
                            <input
                                type="text"
                                name="description"
                                placeholder="Optional class summary"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="field">
                            <label>Class Date</label>
                            <input
                                type="date"
                                name="classDate"
                                value={formData.classDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Capacity</label>
                            <input
                                type="number"
                                name="capacity"
                                min="1"
                                placeholder="e.g. 20"
                                value={formData.capacity}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Start Time</label>
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>End Time</label>
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? 'Scheduling...' : 'Create Class'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card filters">
                <div className="field filter-search">
                    <label>Search Classes</label>
                    <input
                        type="text"
                        placeholder="Search by class name or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {search && (
                    <button className="btn btn-outline" onClick={() => setSearch('')}>Clear</button>
                )}
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Class</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Capacity / Enrolled</th>
                            <th>Status</th>
                            <th style={{ width: 170 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClasses.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="empty">
                                    {classes.length === 0 ? 'No classes scheduled yet.' : 'No classes match your search.'}
                                </td>
                            </tr>
                        ) : (
                            filteredClasses.map(c => {
                                const isFull = c.enrolledCount >= c.capacity;
                                return (
                                    <tr key={c.classId}>
                                        <td>
                                            <strong>{c.className}</strong>
                                            {c.description && (
                                                <div className="muted" style={{ fontSize: 13 }}>{c.description}</div>
                                            )}
                                        </td>
                                        <td>{fmtDate(c.classDate)}</td>
                                        <td>{fmtTime(c.startTime)} – {fmtTime(c.endTime)}</td>
                                        <td>
                                            <span className={`badge ${isFull ? 'badge-danger' : 'badge-success'}`}>
                                                {c.enrolledCount} / {c.capacity}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-info">{c.status}</span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => fetchClassBookings(c)}
                                            >
                                                View Bookings ({c.enrolledCount})
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedClass && (
                <div className="card stack">
                    <div className="page-header" style={{ marginBottom: 0 }}>
                        <div>
                            <h3>Bookings — {selectedClass.className} ({fmtDate(selectedClass.classDate)})</h3>
                            <p className="muted">
                                {fmtTime(selectedClass.startTime)} – {fmtTime(selectedClass.endTime)}
                            </p>
                        </div>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                                setSelectedClass(null);
                                setBookings([]);
                            }}
                        >
                            Close
                        </button>
                    </div>

                    {loadingBookings ? (
                        <p className="muted">Loading bookings...</p>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Booked On</th>
                                        <th>Status</th>
                                        <th style={{ width: 150 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="empty">No bookings found for this class.</td>
                                        </tr>
                                    ) : (
                                        bookings.map(b => (
                                            <tr key={b.bookingId}>
                                                <td>
                                                    <strong>{b.memberName || 'Member'}</strong>
                                                    {b.memberEmail && (
                                                        <div className="muted" style={{ fontSize: 13 }}>{b.memberEmail}</div>
                                                    )}
                                                </td>
                                                <td>{fmtDate(b.bookingDate)}</td>
                                                <td>
                                                    <span className={`badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-danger'}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {b.status === 'Confirmed' ? (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleCancelBooking(b.bookingId)}
                                                        >
                                                            Cancel Booking
                                                        </button>
                                                    ) : (
                                                        <span className="muted">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
