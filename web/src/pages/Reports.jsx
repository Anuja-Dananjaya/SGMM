import React, { useState, useEffect } from 'react';
import axios from 'axios';

const REPORT_TITLES = {
    membership: 'Membership Status & Renewal Report',
    attendance: 'Member Attendance Report',
    revenue: 'Payment & Revenue Report',
    classes: 'Class Scheduling & Booking Report',
};

const BADGE_FOR = {
    Active: 'badge-success',
    Completed: 'badge-success',
    'Expiring Soon': 'badge-warning',
    Pending: 'badge-warning',
    Expired: 'badge-danger',
    Cancelled: 'badge-danger',
    Refunded: 'badge-danger',
    Full: 'badge-danger',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtDateTime = (d) => {
    if (!d) return '—';
    const safe = String(d).endsWith('Z') ? d : `${d}Z`;
    return new Date(safe).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

function buildTableModel(category, payload) {
    if (!payload) return { kpis: [], columns: [], rows: [] };
    const s = payload.summary || {};
    const list = payload.rows || [];

    if (category === 'membership') {
        return {
            kpis: [
                { label: 'Total Memberships', value: s.total ?? 0, badge: 'In selected range', tone: 'badge-info' },
                { label: 'Active Plans', value: s.active ?? 0, badge: 'Currently valid', tone: 'badge-success' },
                { label: 'Expiring (7 Days)', value: s.expiringSoon ?? 0, badge: 'Needs renewal', tone: 'badge-warning' },
                { label: 'Expired / Cancelled', value: s.expired ?? 0, badge: 'Inactive', tone: 'badge-danger' },
            ],
            columns: ['Member Name', 'Email', 'Plan', 'Start Date', 'Expiry Date', 'Status'],
            rows: list.map(r => [r.memberName, r.email, r.planName, fmtDate(r.startDate), fmtDate(r.endDate), r.status]),
        };
    }

    if (category === 'attendance') {
        return {
            kpis: [
                { label: 'Total Check-Ins', value: s.totalCheckIns ?? 0, badge: 'Recorded visits', tone: 'badge-success' },
                { label: 'Unique Members', value: s.uniqueMembers ?? 0, badge: 'Distinct attendees', tone: 'badge-info' },
                { label: 'Daily Average', value: s.dailyAverage ?? 0, badge: 'Visits / active day', tone: 'badge-info' },
                { label: 'Active Days', value: s.daysCovered ?? 0, badge: 'With check-ins', tone: 'badge-warning' },
            ],
            columns: ['Member Name', 'Email', 'Plan', 'Check-In Date & Time', 'Membership Status'],
            rows: list.map(r => [r.memberName, r.email, r.planName, fmtDateTime(r.checkInTime), r.status]),
        };
    }

    if (category === 'revenue') {
        return {
            kpis: [
                { label: 'Collected Revenue', value: `LKR ${Number(s.totalRevenue ?? 0).toLocaleString()}`, badge: 'Completed payments', tone: 'badge-success' },
                { label: 'Completed Payments', value: s.completedCount ?? 0, badge: 'Transactions', tone: 'badge-info' },
                { label: 'Pending Dues', value: `LKR ${Number(s.pendingAmount ?? 0).toLocaleString()}`, badge: `${s.pendingCount ?? 0} pending`, tone: 'badge-warning' },
                { label: 'Top Method', value: s.topMethod || '—', badge: 'Most used', tone: 'badge-info' },
            ],
            columns: ['Receipt #', 'Member Name', 'Plan', 'Payment Date', 'Method', 'Amount (LKR)', 'Status'],
            rows: list.map(r => [
                r.receiptNo,
                r.memberName,
                r.planName,
                fmtDate(r.paymentDate),
                r.paymentMethod,
                Number(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                r.status,
            ]),
        };
    }

    return {
        kpis: [
            { label: 'Scheduled Classes', value: s.scheduledClasses ?? 0, badge: 'In selected range', tone: 'badge-info' },
            { label: 'Confirmed Bookings', value: s.totalBookings ?? 0, badge: 'Booked seats', tone: 'badge-success' },
            { label: 'Avg. Occupancy', value: `${s.avgOccupancy ?? 0}%`, badge: 'Across classes', tone: 'badge-success' },
            { label: 'Cancelled Bookings', value: s.cancelledBookings ?? 0, badge: 'Cancellations', tone: 'badge-warning' },
        ],
        columns: ['Class Name', 'Date', 'Time', 'Booked / Capacity', 'Occupancy', 'Status'],
        rows: list.map(r => [
            r.className,
            fmtDate(r.classDate),
            r.time,
            `${r.enrolledCount} / ${r.capacity}`,
            `${r.occupancy}%`,
            r.status,
        ]),
    };
}

export default function Reports() {
    const [category, setCategory] = useState('membership');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);

    const fetchReport = async (cat = category, from = fromDate, to = toDate) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (from) params.fromDate = from;
            if (to) params.toDate = to;

            const res = await axios.get(`/api/Reports/${cat}`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            setPayload(res.data);
        } catch (err) {
            console.error('Error loading report:', err);
            setError('Failed to generate report. Ensure the backend API is running.');
            setPayload(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(category, fromDate, toDate);
    }, [category]);

    const title = REPORT_TITLES[category];
    const { kpis, columns, rows } = buildTableModel(category, payload);

    const exportCSV = () => {
        if (!columns.length) return;
        const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const csv = [columns.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sgmm-${category}-report.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setNotice(`Exported ${title} (${rows.length} rows) as CSV.`);
    };

    const handleClear = () => {
        setFromDate('');
        setToDate('');
        setNotice(null);
        fetchReport(category, '', '');
    };

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Management Reports &amp; Analytics</h1>
                    <p>
                        Live reports across memberships, attendance, payments, and class bookings
                        {(fromDate || toDate) ? ` (${fromDate || 'Start'} to ${toDate || 'Today'})` : ''}.
                    </p>
                </div>
                <div className="toolbar no-print">
                    <button className="btn btn-outline" onClick={exportCSV} disabled={loading || rows.length === 0}>
                        Export CSV
                    </button>
                    <button className="btn" onClick={() => window.print()} disabled={loading}>
                        Export PDF
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error no-print">{error}</div>}
            {notice && <div className="alert alert-success no-print">{notice}</div>}

            <div className="card filters no-print">
                <div className="field" style={{ flex: '1 1 240px' }}>
                    <label>Report Category</label>
                    <select
                        value={category}
                        onChange={e => {
                            setCategory(e.target.value);
                            setNotice(null);
                        }}
                    >
                        <option value="membership">Membership Report</option>
                        <option value="attendance">Attendance Report</option>
                        <option value="revenue">Revenue &amp; Payment Report</option>
                        <option value="classes">Class &amp; Booking Report</option>
                    </select>
                </div>
                <div className="field">
                    <label>From Date</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div className="field">
                    <label>To Date</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
                <button className="btn" onClick={() => { setNotice(null); fetchReport(category, fromDate, toDate); }}>
                    Generate Report
                </button>
                {(fromDate || toDate) && (
                    <button className="btn btn-outline" onClick={handleClear}>Clear Dates</button>
                )}
            </div>

            {loading ? (
                <div className="card muted">Generating report...</div>
            ) : payload ? (
                <>
                    <div className="card-grid">
                        {kpis.map(kpi => (
                            <div key={kpi.label} className="card stat-card">
                                <span className="stat-label">{kpi.label}</span>
                                <span className="stat-value">{kpi.value}</span>
                                <div><span className={`badge ${kpi.tone}`}>{kpi.badge}</span></div>
                            </div>
                        ))}
                    </div>

                    <div className="card stack">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <h3 style={{ margin: 0 }}>{title}</h3>
                            <span className="muted" style={{ fontSize: 13 }}>{rows.length} records</span>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        {columns.map(col => <th key={col}>{col}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr><td colSpan={columns.length} className="empty">No records found for this filter.</td></tr>
                                    ) : rows.map((row, idx) => (
                                        <tr key={idx}>
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx}>
                                                    {BADGE_FOR[cell] ? (
                                                        <span className={`badge ${BADGE_FOR[cell]}`}>{cell}</span>
                                                    ) : cIdx === 0 ? (
                                                        <strong>{cell}</strong>
                                                    ) : (
                                                        cell
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
