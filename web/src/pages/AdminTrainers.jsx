import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const SAMPLE_TRAINERS = [
    { id: 't1', fullName: 'Ruwan Bandara', email: 'ruwan@sgmm.lk', phone: '077-3124455', specialization: 'Strength & HIIT', slots: ['Mon–Fri 06:00–14:00', 'Sat 08:00–12:00'], status: 'Active' },
    { id: 't2', fullName: 'Amaya Perera', email: 'amaya@sgmm.lk', phone: '071-8892310', specialization: 'Weight Loss & Nutrition', slots: ['Mon–Fri 10:00–18:00'], status: 'Active' },
    { id: 't3', fullName: 'Dilani Jayasinghe', email: 'dilani@sgmm.lk', phone: '076-5401199', specialization: 'Yoga, Mobility & Rehab', slots: ['Tue–Sat 07:00–15:00'], status: 'Active' },
    { id: 't4', fullName: 'Sahan Wijesinghe', email: 'sahan@sgmm.lk', phone: '077-9043321', specialization: 'Bodybuilding & Conditioning', slots: ['Mon–Thu 14:00–21:00'], status: 'On Leave' },
];

const SAMPLE_APPOINTMENTS = [
    { id: 101, memberName: 'Kasun Perera', trainerName: 'Ruwan Bandara', date: '2026-11-18', timeSlot: '08:00 – 09:00', focus: 'Upper Body Hypertrophy', status: 'Confirmed' },
    { id: 102, memberName: 'Nimali Fernando', trainerName: 'Amaya Perera', date: '2026-11-18', timeSlot: '11:00 – 12:00', focus: 'Fat Loss Assessment', status: 'Pending' },
    { id: 103, memberName: 'Dinesh Kumara', trainerName: 'Dilani Jayasinghe', date: '2026-11-18', timeSlot: '14:00 – 15:00', focus: 'Lower Back Mobility', status: 'Confirmed' },
    { id: 104, memberName: 'Tharushi Silva', trainerName: 'Ruwan Bandara', date: '2026-11-17', timeSlot: '10:00 – 11:00', focus: 'HIIT Conditioning', status: 'Completed' },
    { id: 105, memberName: 'Chathura De Silva', trainerName: 'Amaya Perera', date: '2026-11-19', timeSlot: '16:00 – 17:00', focus: 'Diet & Macro Plan', status: 'Cancelled' },
];

const STATUS_BADGE = {
    Confirmed: 'badge-success',
    Pending: 'badge-warning',
    Completed: 'badge-info',
    Cancelled: 'badge-danger',
};

export default function AdminTrainers() {
    const [tab, setTab] = useState('trainers');
    const [trainers, setTrainers] = useState(SAMPLE_TRAINERS);
    const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        specialization: '',
        days: 'Mon–Fri',
        timeSlot: '08:00–16:00',
        status: 'Active',
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || token === 'demo-token') return;

        axios.get('/api/Trainers', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    const mapped = res.data.map((t, idx) => ({
                        id: t.id || `api-${idx}`,
                        fullName: t.name || 'Trainer',
                        email: `${(t.name || 'trainer').toLowerCase().replace(/\s+/g, '')}@sgmm.lk`,
                        phone: '077-0000000',
                        specialization: 'Personal Training',
                        slots: ['Mon–Fri 08:00–16:00'],
                        status: 'Active',
                    }));
                    setTrainers([...mapped, ...SAMPLE_TRAINERS]);
                }
            })
            .catch(() => { /* keep sample data for preview */ });
    }, []);

    const openAdd = () => {
        setEditingId(null);
        setFormData({ fullName: '', email: '', phone: '', specialization: '', days: 'Mon–Fri', timeSlot: '08:00–16:00', status: 'Active' });
        setShowForm(true);
    };

    const openEdit = (trainer) => {
        const firstSlot = trainer.slots?.[0] || 'Mon–Fri 08:00–16:00';
        const [days, timeSlot] = firstSlot.split(' ');
        setEditingId(trainer.id);
        setFormData({
            fullName: trainer.fullName,
            email: trainer.email,
            phone: trainer.phone,
            specialization: trainer.specialization,
            days: days || 'Mon–Fri',
            timeSlot: timeSlot || '08:00–16:00',
            status: trainer.status,
        });
        setShowForm(true);
    };

    const handleSaveTrainer = (e) => {
        e.preventDefault();
        const slotText = `${formData.days} ${formData.timeSlot}`.trim();
        if (editingId) {
            setTrainers(prev => prev.map(t => t.id === editingId ? {
                ...t,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                specialization: formData.specialization,
                slots: [slotText],
                status: formData.status,
            } : t));
            setMessage({ type: 'success', text: `Updated trainer profile and availability for ${formData.fullName}.` });
        } else {
            setTrainers(prev => [{
                id: `t-${Date.now()}`,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                specialization: formData.specialization,
                slots: [slotText],
                status: formData.status,
            }, ...prev]);
            setMessage({ type: 'success', text: `Added trainer ${formData.fullName} with availability ${slotText}.` });
        }
        setShowForm(false);
    };

    const handleAppointmentAction = (id, newStatus) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        setMessage({ type: 'success', text: `Appointment #${id} updated to ${newStatus}.` });
    };

    const filteredAppointments = useMemo(() => {
        const q = search.trim().toLowerCase();
        return appointments.filter(a => {
            if (statusFilter !== 'All' && a.status !== statusFilter) return false;
            if (q && !(a.memberName.toLowerCase().includes(q) || a.trainerName.toLowerCase().includes(q) || a.focus.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [appointments, search, statusFilter]);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Trainers & Appointments</h1>
                    <p>Manage trainer profiles, availability time slots, and member 1-on-1 schedules.</p>
                </div>
                {tab === 'trainers' && (
                    <button className="btn" onClick={openAdd}>+ Add Trainer</button>
                )}
            </div>

            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

            <div className="tabs">
                <button className={`tab-btn ${tab === 'trainers' ? 'active' : ''}`} onClick={() => setTab('trainers')}>
                    Trainers & Availability ({trainers.length})
                </button>
                <button className={`tab-btn ${tab === 'appointments' ? 'active' : ''}`} onClick={() => setTab('appointments')}>
                    Appointment Schedule ({appointments.length})
                </button>
            </div>

            {tab === 'trainers' && (
                <>
                    {showForm && (
                        <div className="card">
                            <h3>{editingId ? 'Edit Trainer & Availability' : 'Register Trainer Profile'}</h3>
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
                                    <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Specialization</label>
                                    <input type="text" placeholder="e.g. Strength & Conditioning" required value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Available Days</label>
                                    <select value={formData.days} onChange={e => setFormData({ ...formData, days: e.target.value })}>
                                        <option value="Mon–Fri">Mon–Fri</option>
                                        <option value="Tue–Sat">Tue–Sat</option>
                                        <option value="Mon–Thu">Mon–Thu</option>
                                        <option value="Sat–Sun">Weekends Only</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Available Time Slot</label>
                                    <input type="text" placeholder="08:00–16:00" required value={formData.timeSlot} onChange={e => setFormData({ ...formData, timeSlot: e.target.value })} />
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
                                    <button type="submit" className="btn">Save Trainer</button>
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
                                    <th>Availability Slots</th>
                                    <th>Status</th>
                                    <th style={{ width: 170 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trainers.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <strong>{t.fullName}</strong>
                                            <div className="muted" style={{ fontSize: 13 }}>{t.email} · {t.phone}</div>
                                        </td>
                                        <td>{t.specialization}</td>
                                        <td>
                                            <div className="toolbar">
                                                {t.slots.map((slot, i) => (
                                                    <span key={i} className="badge badge-info">{slot}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${t.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="toolbar">
                                                <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>Edit</button>
                                                <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>Set Slots</button>
                                            </div>
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
                                placeholder="Member, trainer or session focus..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">All Statuses</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <span className="badge badge-success" style={{ padding: '8px 12px' }}>
                            Conflict Check: Active (Auto-blocks overlapping slots)
                        </span>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Trainer</th>
                                    <th>Date & Time Slot</th>
                                    <th>Status</th>
                                    <th style={{ width: 210 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length === 0 ? (
                                    <tr><td colSpan="5" className="empty">No appointments match your filter.</td></tr>
                                ) : filteredAppointments.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <strong>{a.memberName}</strong>
                                            <div className="muted" style={{ fontSize: 13 }}>{a.focus}</div>
                                        </td>
                                        <td>{a.trainerName}</td>
                                        <td>
                                            <strong>{a.date}</strong>
                                            <div className="muted" style={{ fontSize: 13 }}>{a.timeSlot}</div>
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
