import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const TYPE_BADGE = {
    'Expiry Reminder': 'badge-warning',
    'Booking Confirmation': 'badge-info',
    'Payment Reminder': 'badge-danger',
};

const RULES = [
    {
        id: 'expiry',
        title: 'Membership Expiry Reminder',
        trigger: 'Active memberships expiring within 7 days',
        channel: 'In-App Member Notification',
    },
    {
        id: 'booking',
        title: 'Class Booking Confirmation',
        trigger: 'Sent automatically when a member books a class',
        channel: 'In-App Member Notification',
    },
    {
        id: 'payment',
        title: 'Pending Payment Reminder',
        trigger: 'Daily automatic check for pending invoices',
        channel: 'In-App Member Notification',
    },
];

export default function Notifications() {
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState({ sentToday: 0, expirySent: 0, bookingConfirmations: 0, paymentReminders: 0 });
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [typeFilter, setTypeFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [banner, setBanner] = useState(null);

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/Notifications', { headers: authHeaders() });
            setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
            setSummary(res.data?.summary || { sentToday: 0, expirySent: 0, bookingConfirmations: 0, paymentReminders: 0 });
        } catch (err) {
            console.error('Error loading notifications:', err);
            setBanner({
                type: 'error',
                text: 'Failed to load notifications. Ensure the backend is running and the database migration is applied.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRunNow = async () => {
        setRunning(true);
        setBanner(null);
        try {
            const res = await axios.post('/api/Notifications/run-now', {}, { headers: authHeaders() });
            setBanner({ type: 'success', text: res.data?.message || 'Scheduled reminders processed.' });
            fetchNotifications();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Failed to run scheduled reminders.';
            setBanner({ type: 'error', text: msg });
        } finally {
            setRunning(false);
        }
    };

    const handleResend = async (item) => {
        setBanner(null);
        try {
            const res = await axios.post(`/api/Notifications/${item.id}/resend`, {}, { headers: authHeaders() });
            setBanner({ type: 'success', text: res.data?.message || res.data?.Message || `Resent to ${item.recipientName}.` });
            fetchNotifications();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.Message || 'Failed to resend notification.';
            setBanner({ type: 'error', text: msg });
        }
    };

    const formatDateTime = (iso) => {
        if (!iso) return '—';
        const safe = String(iso).endsWith('Z') ? iso : `${iso}Z`;
        return new Date(safe).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    const filteredLogs = useMemo(() => {
        const q = search.trim().toLowerCase();
        return logs.filter(l => {
            if (typeFilter !== 'All' && l.type !== typeFilter) return false;
            if (q && !(
                l.recipientName?.toLowerCase().includes(q) ||
                l.recipientEmail?.toLowerCase().includes(q) ||
                l.subject?.toLowerCase().includes(q)
            )) return false;
            return true;
        });
    }, [logs, typeFilter, search]);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Automated Notifications</h1>
                    <p>Automatic daily expiry &amp; payment reminders plus instant class booking confirmations sent to members.</p>
                </div>
                <div className="toolbar">
                    <span className="status-pill status-ok">
                        <span className="dot" /> Auto-Scheduler Active
                    </span>
                    <button className="btn" onClick={handleRunNow} disabled={running}>
                        {running ? 'Checking...' : 'Run Scheduled Reminders Now'}
                    </button>
                </div>
            </div>

            {banner && <div className={`alert alert-${banner.type}`}>{banner.text}</div>}

            <div className="card-grid">
                <div className="card stat-card">
                    <span className="stat-label">Sent Today</span>
                    <span className="stat-value">{summary.sentToday}</span>
                    <div><span className="badge badge-info">In-App Delivery</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Expiry Reminders</span>
                    <span className="stat-value">{summary.expirySent}</span>
                    <div><span className="badge badge-warning">7-day expiry rule</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Booking Confirmations</span>
                    <span className="stat-value">{summary.bookingConfirmations}</span>
                    <div><span className="badge badge-success">Instant on booking</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Payment Reminders</span>
                    <span className="stat-value">{summary.paymentReminders}</span>
                    <div><span className="badge badge-danger">Pending invoices</span></div>
                </div>
            </div>

            <div className="card-grid">
                {RULES.map(rule => (
                    <div key={rule.id} className="card stack" style={{ gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{rule.title}</h3>
                            <span className="badge badge-success">Active</span>
                        </div>
                        <div className="muted" style={{ fontSize: 13 }}><strong>Trigger:</strong> {rule.trigger}</div>
                        <div className="muted" style={{ fontSize: 13 }}><strong>Channel:</strong> {rule.channel}</div>
                    </div>
                ))}
            </div>

            <div className="card filters">
                <div className="field filter-search">
                    <label>Search Notification Log</label>
                    <input
                        type="text"
                        placeholder="Member name, email or message..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="field">
                    <label>Notification Type</label>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="All">All Types</option>
                        <option value="Expiry Reminder">Expiry Reminder</option>
                        <option value="Booking Confirmation">Booking Confirmation</option>
                        <option value="Payment Reminder">Payment Reminder</option>
                    </select>
                </div>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Type</th>
                            <th>Notification</th>
                            <th>Sent At</th>
                            <th>Status</th>
                            <th style={{ width: 100 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="empty">Loading notifications...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan="6" className="empty">No notifications sent yet. Click &ldquo;Run Scheduled Reminders Now&rdquo; or book a class.</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log.id}>
                                <td>
                                    <strong>{log.recipientName}</strong>
                                    <div className="muted" style={{ fontSize: 13 }}>{log.recipientEmail}</div>
                                </td>
                                <td><span className={`badge ${TYPE_BADGE[log.type] || 'badge-info'}`}>{log.type}</span></td>
                                <td><strong>{log.subject}</strong></td>
                                <td className="muted">{formatDateTime(log.sentAt)}</td>
                                <td><span className="badge badge-success">{log.status}</span></td>
                                <td>
                                    <button className="btn btn-outline btn-sm" onClick={() => handleResend(log)}>Resend</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
