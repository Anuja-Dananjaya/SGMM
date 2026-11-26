import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const STATUS_BADGE = {
    Confirmed: 'badge-success',
    Pending: 'badge-warning',
    Completed: 'badge-info',
    Cancelled: 'badge-danger',
};

const EMPTY_FORM = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    days: 'Mon-Fri',
    timeSlot: '08:00-16:00',
    status: 'Active',
};

export default function AdminTrainers() {
    const [tab, setTab] = useState('trainers');
    const [trainers, setTrainers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [formData, setFormData] = useState(EMPTY_FORM);

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const headers = authHeaders();
            const [trainersRes, appointmentsRes] = await Promise.all([
                axios.get('/api/Trainers', { headers }),
                axios.get('/api/Appointments/all', { headers }),
            ]);
            setTrainers(Array.isArray(trainersRes.data) ? trainersRes.data : []);
            setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
        } catch (err) {
            console.error('Error loading trainers or appointments:', err);
            setMessage({ type: 'error', text: 'Failed to load trainers and appointments.' });
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setMessage(null);
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (trainer) => {
        setMessage(null);
        const avail = trainer.availability || 'Mon-Fri 08:00-16:00';
        const parts = avail.trim().split(/\s+/);
        const days = parts[0] || 'Mon-Fri';
        const timeSlot = parts.slice(1).join(' ') || '08:00-16:00';

        setEditingId(trainer.id);
        setFormData({
            fullName: trainer.fullName || trainer.name || '',
            email: trainer.email || '',
            phone: trainer.phone || '',
            password: '',
            specialization: trainer.specialization || '',
            days,
            timeSlot,
            status: trainer.status || 'Active',
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveTrainer = async (e) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        const availability = `${formData.days} ${formData.timeSlot}`.trim();
        try {
            if (editingId) {
                const res = await axios.put(
                    `/api/Trainers/${editingId}`,
                    {
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        specialization: formData.specialization,
                        availability,
                        status: formData.status,
                    },
                    { headers: authHeaders() }
                );
                setMessage({ type: 'success', text: res.data?.message || res.data?.Message || 'Trainer updated successfully.' });
            } else {
                const res = await axios.post(
                    '/api/Trainers',
                    {
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        password: formData.password,
                        specialization: formData.specialization,
                        availability,
                        status: formData.status,
                    },
                    { headers: authHeaders() }
                );
                setMessage({ type: 'success', text: res.data?.message || res.data?.Message || 'Trainer created successfully.' });
            }

            setShowForm(false);
            setEditingId(null);
            fetchAll();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Failed to save trainer.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSaving(false);
        }
    };

    const handleAppointmentAction = async (id, newStatus) => {
        setMessage(null);
        try {
            const res = await axios.put(
                `/api/Appointments/${id}/status`,
                `"${newStatus}"`,
                { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
            );
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            setMessage({ type: 'success', text: res.data?.message || res.data?.Message || `Appointment marked as ${newStatus}.` });
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Failed to update appointment.';
            setMessage({ type: 'error', text: msg });
        }
    };

    const formatLocalDate = (utcString) => {
        if (!utcString) return '—';
        const safe = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
        return new Date(safe).toLocaleDateString();
    };

    const formatLocalTime = (utcString) => {
        if (!utcString) return '—';
        const safe = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
        return new Date(safe).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredAppointments = useMemo(() => {
        const q = search.trim().toLowerCase();
        return appointments.filter(a => {
            if (statusFilter !== 'All' && a.status !== statusFilter) return false;
            if (q && !(
                a.memberName?.toLowerCase().includes(q) ||
                a.trainerName?.toLowerCase().includes(q)
            )) return false;
            return true;
        });
    }, [appointments, search, statusFilter]);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Trainers &amp; Appointments</h1>
                    <p>Manage trainer profiles, availability slots, and 1-on-1 member schedules.</p>
                </div>
                {tab === 'trainers' && (
                    <button className="btn" onClick={openAdd}>+ Add Trainer</button>
                )}
            </div>

            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

            <div className="tabs">
                <button className={`tab-btn ${tab === 'trainers' ? 'active' : ''}`} onClick={() => setTab('trainers')}>
                    Trainers &amp; Availability ({trainers.length})
                </button>
                <button className={`tab-btn ${tab === 'appointments' ? 'active' : ''}`} onClick={() => setTab('appointments')}>
                    Appointment Schedule ({appointments.length})
                </button>
            </div>

            {tab === 'trainers' && (
                <>
                    {showForm && (
                        <div className="card">
                            <h3>{editingId ? 'Edit Trainer & Availability' : 'Register New Trainer'}</h3>
                            <form onSubmit={handleSaveTrainer} className="form-grid">
                                <div className="field">
                                    <label>Full Name</label>
                                    <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Email</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Phone</label>
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Specialization</label>
                                    <input type="text" placeholder="e.g. Strength & Conditioning" required value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                                </div>
                                {!editingId && (
                                    <div className="field">
                                        <label>Temporary Password</label>
                                        <input type="text" required minLength={6} placeholder="e.g. Trainer@123" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                )}
                                <div className="field">
                                    <label>Available Days</label>
                                    <select value={formData.days} onChange={e => setFormData({ ...formData, days: e.target.value })}>
                                        <option value="Mon-Fri">Mon-Fri</option>
                                        <option value="Tue-Sat">Tue-Sat</option>
                                        <option value="Mon-Thu">Mon-Thu</option>
                                        <option value="Sat-Sun">Weekends Only</option>
                                        <option value="Daily">Daily</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Available Time Slot</label>
                                    <input type="text" placeholder="08:00-16:00" required value={formData.timeSlot} onChange={e => setFormData({ ...formData, timeSlot: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                                    <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save Trainer'}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Trainer</th>
                                    <th>Specialization</th>
                                    <th>Availability</th>
                                    <th>Status</th>
                                    <th style={{ width: 170 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty">Loading trainers...</td></tr>
                                ) : trainers.length === 0 ? (
                                    <tr><td colSpan="5" className="empty">No trainers registered yet. Click &ldquo;+ Add Trainer&rdquo; to add one.</td></tr>
                                ) : trainers.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <strong>{t.fullName || t.name}</strong>
                                            <div className="muted" style={{ fontSize: 13 }}>
                                                {t.email}{t.phone ? ` · ${t.phone}` : ''}
                                            </div>
                                        </td>
                                        <td>{t.specialization || 'Personal Training'}</td>
                                        <td>
                                            <span className="badge badge-info">{t.availability || 'Mon-Fri 08:00-16:00'}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${t.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                {t.status || 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>
                                                Edit / Set Slots
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {tab === 'appointments' && (
                <>
                    <div className="card filters">
                        <div className="field filter-search">
                            <label>Search Appointments</label>
                            <input
                                type="text"
                                placeholder="Member or trainer name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <span className="badge badge-success" style={{ padding: '8px 12px' }}>
                            Conflict Check: Active
                        </span>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Trainer</th>
                                    <th>Date &amp; Time</th>
                                    <th>Status</th>
                                    <th style={{ width: 210 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="empty">Loading appointments...</td></tr>
                                ) : filteredAppointments.length === 0 ? (
                                    <tr><td colSpan="5" className="empty">No appointments found.</td></tr>
                                ) : filteredAppointments.map(a => (
                                    <tr key={a.id}>
                                        <td><strong>{a.memberName}</strong></td>
                                        <td>{a.trainerName}</td>
                                        <td>
                                            <strong>{formatLocalDate(a.startTime)}</strong>
                                            <div className="muted" style={{ fontSize: 13 }}>
                                                {formatLocalTime(a.startTime)} – {formatLocalTime(a.endTime)}
                                            </div>
                                        </td>
                                        <td><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{a.status}</span></td>
                                        <td>
                                            <div className="toolbar">
                                                {a.status === 'Pending' && (
                                                    <button className="btn btn-sm" onClick={() => handleAppointmentAction(a.id, 'Confirmed')}>Confirm</button>
                                                )}
                                                {a.status === 'Confirmed' && (
                                                    <button className="btn btn-outline btn-sm" onClick={() => handleAppointmentAction(a.id, 'Completed')}>Complete</button>
                                                )}
                                                {(a.status === 'Pending' || a.status === 'Confirmed') && (
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleAppointmentAction(a.id, 'Cancelled')}>Cancel</button>
                                                )}
                                                {(a.status === 'Completed' || a.status === 'Cancelled') && (
                                                    <span className="muted">—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
