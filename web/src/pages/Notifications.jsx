import React, { useState, useMemo } from 'react';

const INITIAL_RULES = [
    {
        id: 'expiry',
        title: 'Membership Expiry Reminder',
        trigger: '7 days & 3 days before EndDate',
        channel: 'Email (SMTP)',
        enabled: true,
        sentCount: 34,
    },
    {
        id: 'booking',
        title: 'Class Booking Confirmation',
        trigger: 'Immediate on booking or cancellation',
        channel: 'Email & Mobile Push',
        enabled: true,
        sentCount: 86,
    },
    {
        id: 'payment',
        title: 'Overdue Payment Reminder',
        trigger: '1 day & 7 days past billing due date',
        channel: 'Email (SMTP)',
        enabled: true,
        sentCount: 9,
    },
];

const INITIAL_LOGS = [
    { id: 1, recipient: 'Nimal Perera', email: 'nimal@gmail.com', type: 'Expiry Reminder', subject: 'Your Gold Monthly plan expires in 2 days — Renew now', sentAt: '2026-11-18 08:00', status: 'Sent' },
    { id: 2, recipient: 'Kasun Perera', email: 'kasun@sgmm.lk', type: 'Booking Confirmation', subject: 'Confirmed: Morning HIIT Blast (18 Nov, 07:00 AM)', sentAt: '2026-11-18 07:14', status: 'Sent' },
    { id: 3, recipient: 'Kavindi Silva', email: 'kavindi@yahoo.com', type: 'Expiry Reminder', subject: 'Renewal reminder: Platinum Annual expires on 21 Nov', sentAt: '2026-11-18 08:00', status: 'Sent' },
    { id: 4, recipient: 'Ishara Madushan', email: 'ishara@outlook.com', type: 'Payment Reminder', subject: 'Outstanding balance LKR 7,500 due for November cycle', sentAt: '2026-11-18 08:02', status: 'Sent' },
    { id: 5, recipient: 'Dilshan Fernando', email: 'dilshan@gmail.com', type: 'Expiry Reminder', subject: 'Upcoming expiry notice: 5 days remaining on Standard Plan', sentAt: 'Scheduled 08:00', status: 'Queued' },
    { id: 6, recipient: 'Tharushi Silva', email: 'tharushi@gmail.com', type: 'Booking Confirmation', subject: 'Confirmed: Power Yoga & Mobility (18 Nov, 17:30)', sentAt: '2026-11-17 19:22', status: 'Sent' },
];

const TYPE_BADGE = {
    'Expiry Reminder': 'badge-warning',
    'Booking Confirmation': 'badge-info',
    'Payment Reminder': 'badge-danger',
};

export default function Notifications() {
    const [rules, setRules] = useState(INITIAL_RULES);
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [typeFilter, setTypeFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [banner, setBanner] = useState(null);

    const toggleRule = (id) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const handleRunNow = () => {
        setLogs(prev => prev.map(l => l.status === 'Queued' ? { ...l, status: 'Sent', sentAt: 'Just now' } : l));
        setBanner('Scheduled notification job completed — all queued expiry and payment reminder emails were dispatched.');
    };

    const handleResend = (item) => {
        setLogs(prev => prev.map(l => l.id === item.id ? { ...l, status: 'Sent', sentAt: 'Resent just now' } : l));
        setBanner(`Notification resent to ${item.recipient} (${item.email}).`);
    };

    const filteredLogs = useMemo(() => {
        const q = search.trim().toLowerCase();
        return logs.filter(l => {
            if (typeFilter !== 'All' && l.type !== typeFilter) return false;
            if (q && !(l.recipient.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [logs, typeFilter, search]);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Automated Notifications</h1>
                    <p>Configure scheduled email reminders for membership expiry, class bookings, and overdue payments.</p>
                </div>
                <div className="toolbar">
                    <span className="status-pill status-ok"><span className="dot" /> Auto-Scheduler: Daily 08:00 AM</span>
                    <button className="btn" onClick={handleRunNow}>Run Scheduled Reminders Now</button>
                </div>
            </div>

            {banner && <div className="alert alert-success">{banner}</div>}

            <div className="card-grid">
                <div className="card stat-card">
                    <span className="stat-label">Scheduled Today</span>
                    <span className="stat-value">12</span>
                    <div><span className="badge badge-info">Background Job Active</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Expiry Reminders Sent</span>
                    <span className="stat-value">34</span>
                    <div><span className="badge badge-warning">7-day &amp; 3-day rules</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Booking Confirmations</span>
                    <span className="stat-value">86</span>
                    <div><span className="badge badge-success">99.2% delivered</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Payment Reminders</span>
                    <span className="stat-value">9</span>
                    <div><span className="badge badge-danger">Overdue accounts</span></div>
                </div>
            </div>

            <div className="card-grid">
                {rules.map(rule => (
                    <div key={rule.id} className="card stack" style={{ gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{rule.title}</h3>
                            <span className={`badge ${rule.enabled ? 'badge-success' : 'badge-danger'}`}>
                                {rule.enabled ? 'Enabled' : 'Paused'}
                            </span>
                        </div>
                        <div className="muted" style={{ fontSize: 13 }}><strong>Trigger:</strong> {rule.trigger}</div>
                        <div className="muted" style={{ fontSize: 13 }}><strong>Channel:</strong> {rule.channel}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span className="muted" style={{ fontSize: 13 }}>{rule.sentCount} sent this month</span>
                            <button className="btn btn-outline btn-sm" onClick={() => toggleRule(rule.id)}>
                                {rule.enabled ? 'Pause Rule' : 'Enable Rule'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card filters">
                <div className="field filter-search">
                    <label>Search Notification Log</label>
                    <input
                        type="text"
                        placeholder="Recipient, email or message..."
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
                            <th>Recipient</th>
                            <th>Type</th>
                            <th>Subject / Message</th>
                            <th>Scheduled / Sent At</th>
                            <th>Status</th>
                            <th style={{ width: 100 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan="6" className="empty">No notifications match your filter.</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log.id}>
                                <td>
                                    <strong>{log.recipient}</strong>
                                    <div className="muted" style={{ fontSize: 13 }}>{log.email}</div>
                                </td>
                                <td><span className={`badge ${TYPE_BADGE[log.type] || 'badge-info'}`}>{log.type}</span></td>
                                <td>{log.subject}</td>
                                <td className="muted">{log.sentAt}</td>
                                <td>
                                    <span className={`badge ${log.status === 'Sent' ? 'badge-success' : 'badge-warning'}`}>
                                        {log.status}
                                    </span>
                                </td>
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
