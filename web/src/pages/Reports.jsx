import React, { useState } from 'react';

const REPORT_DATA = {
    membership: {
        title: 'Membership Status & Renewal Report',
        kpis: [
            { label: 'Total Members', value: '176', badge: 'All registered', tone: 'badge-info' },
            { label: 'Active Plans', value: '148', badge: '84.1% active', tone: 'badge-success' },
            { label: 'Expiring (7 Days)', value: '9', badge: 'Renewal reminders sent', tone: 'badge-warning' },
            { label: 'Expired / Cancelled', value: '19', badge: '10.8% churn', tone: 'badge-danger' },
        ],
        columns: ['Member Name', 'Email', 'Plan', 'Start Date', 'Expiry Date', 'Status'],
        rows: [
            ['Kasun Perera', 'kasun@sgmm.lk', 'Platinum Annual', '2026-01-15', '2027-01-15', 'Active'],
            ['Nimal Perera', 'nimal@gmail.com', 'Gold Monthly', '2026-10-20', '2026-11-20', 'Expiring Soon'],
            ['Kavindi Silva', 'kavindi@yahoo.com', 'Platinum Annual', '2025-11-21', '2026-11-21', 'Expiring Soon'],
            ['Dilshan Fernando', 'dilshan@gmail.com', 'Standard Monthly', '2026-10-23', '2026-11-23', 'Expiring Soon'],
            ['Ishara Madushan', 'ishara@outlook.com', 'Gold Monthly', '2026-09-10', '2026-10-10', 'Expired'],
            ['Tharushi Silva', 'tharushi@gmail.com', 'Student Plan', '2026-11-01', '2026-12-01', 'Active'],
        ],
    },
    attendance: {
        title: 'Member Attendance Report',
        kpis: [
            { label: 'Total Check-Ins (30d)', value: '1,284', badge: '+11% vs last month', tone: 'badge-success' },
            { label: 'Daily Average', value: '43', badge: 'Members / day', tone: 'badge-info' },
            { label: 'QR Mobile Check-Ins', value: '1,196', badge: '93.1% via QR', tone: 'badge-success' },
            { label: 'Manual Staff Check-Ins', value: '88', badge: 'Front-desk log', tone: 'badge-warning' },
        ],
        columns: ['Member Name', 'Membership Plan', 'Check-In Date', 'Check-In Time', 'Method', 'Verification'],
        rows: [
            ['Kasun Perera', 'Platinum Annual', '2026-11-18', '06:42 AM', 'Mobile QR Scan', 'Verified Active'],
            ['Tharushi Silva', 'Student Plan', '2026-11-18', '07:15 AM', 'Mobile QR Scan', 'Verified Active'],
            ['Nimal Perera', 'Gold Monthly', '2026-11-18', '08:05 AM', 'Manual (Staff)', 'Verified Active'],
            ['Dinesh Kumara', 'Standard Monthly', '2026-11-17', '05:48 PM', 'Mobile QR Scan', 'Verified Active'],
            ['Kavindi Silva', 'Platinum Annual', '2026-11-17', '06:20 PM', 'Mobile QR Scan', 'Verified Active'],
            ['Saman Kumara', 'Gold Monthly', '2026-11-17', '07:05 PM', 'Manual (Staff)', 'Verified Active'],
        ],
    },
    revenue: {
        title: 'Payment & Revenue Report',
        kpis: [
            { label: 'Total Revenue (MTD)', value: 'LKR 542,500', badge: '+8.4% growth', tone: 'badge-success' },
            { label: 'Completed Payments', value: '139', badge: 'Transactions', tone: 'badge-info' },
            { label: 'Pending / Overdue', value: 'LKR 37,500', badge: '5 accounts', tone: 'badge-danger' },
            { label: 'Top Method', value: 'Card (58%)', badge: 'Cash 31% · Transfer 11%', tone: 'badge-info' },
        ],
        columns: ['Receipt #', 'Member Name', 'Plan', 'Payment Date', 'Method', 'Amount (LKR)', 'Status'],
        rows: [
            ['INV-2026-1042', 'Kasun Perera', 'Platinum Annual', '2026-11-15', 'Card', '15,000.00', 'Completed'],
            ['INV-2026-1041', 'Tharushi Silva', 'Student Plan', '2026-11-14', 'Cash', '4,500.00', 'Completed'],
            ['INV-2026-1040', 'Dinesh Kumara', 'Standard Monthly', '2026-11-12', 'Bank Transfer', '6,500.00', 'Completed'],
            ['INV-2026-1039', 'Ishara Madushan', 'Gold Monthly', '2026-11-10', 'Cash', '7,500.00', 'Pending'],
            ['INV-2026-1038', 'Nimali Fernando', 'Gold Monthly', '2026-11-08', 'Card', '7,500.00', 'Completed'],
        ],
    },
    classes: {
        title: 'Class Scheduling & Booking Report',
        kpis: [
            { label: 'Scheduled Classes', value: '24', badge: 'This month', tone: 'badge-info' },
            { label: 'Total Bookings', value: '342', badge: 'Confirmed seats', tone: 'badge-success' },
            { label: 'Avg. Occupancy', value: '84%', badge: 'Across all classes', tone: 'badge-success' },
            { label: 'Cancellations', value: '14', badge: '3.9% rate', tone: 'badge-warning' },
        ],
        columns: ['Class Name', 'Trainer', 'Date', 'Time', 'Booked / Capacity', 'Status'],
        rows: [
            ['Morning HIIT Blast', 'Coach Ruwan', '2026-11-18', '07:00 – 08:00', '18 / 20 (90%)', 'Active'],
            ['Power Yoga & Mobility', 'Coach Dilani', '2026-11-18', '17:30 – 18:30', '15 / 15 (100%)', 'Full'],
            ['Evening Spin & Core', 'Coach Ruwan', '2026-11-18', '18:45 – 19:45', '12 / 20 (60%)', 'Active'],
            ['Strength Circuit', 'Coach Sahan', '2026-11-19', '06:30 – 07:30', '16 / 18 (89%)', 'Active'],
            ['Core & Cardio Burn', 'Coach Amaya', '2026-11-19', '18:00 – 19:00', '14 / 20 (70%)', 'Active'],
        ],
    },
};

const BADGE_FOR = {
    Active: 'badge-success',
    'Verified Active': 'badge-success',
    Completed: 'badge-success',
    'Expiring Soon': 'badge-warning',
    Pending: 'badge-warning',
    'Mobile QR Scan': 'badge-info',
    'Manual (Staff)': 'badge-warning',
    Expired: 'badge-danger',
    Full: 'badge-danger',
};

export default function Reports() {
    const [category, setCategory] = useState('membership');
    const [fromDate, setFromDate] = useState('2026-11-01');
    const [toDate, setToDate] = useState('2026-11-18');
    const [notice, setNotice] = useState(null);

    const report = REPORT_DATA[category];

    const exportCSV = () => {
        const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
        const csv = [report.columns.map(escape).join(','), ...report.rows.map(r => r.map(escape).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sgmm-${category}-report.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setNotice(`Exported ${report.title} as CSV.`);
    };

    const exportPDF = () => {
        window.print();
    };

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Management Reports &amp; Analytics</h1>
                    <p>Generate and export membership, attendance, payment, and class booking reports ({fromDate} to {toDate}).</p>
                </div>
                <div className="toolbar no-print">
                    <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
                    <button className="btn" onClick={exportPDF}>Export PDF</button>
                </div>
            </div>

            {notice && <div className="alert alert-success no-print">{notice}</div>}

            <div className="card filters no-print">
                <div className="field" style={{ flex: '1 1 240px' }}>
                    <label>Report Category</label>
                    <select value={category} onChange={e => { setCategory(e.target.value); setNotice(null); }}>
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
                <button className="btn" onClick={() => setNotice(`Generated ${report.title} for ${fromDate} to ${toDate}.`)}>
                    Generate Report
                </button>
            </div>

            <div className="card-grid">
                {report.kpis.map(kpi => (
                    <div key={kpi.label} className="card stat-card">
                        <span className="stat-label">{kpi.label}</span>
                        <span className="stat-value">{kpi.value}</span>
                        <div><span className={`badge ${kpi.tone}`}>{kpi.badge}</span></div>
                    </div>
                ))}
            </div>

            <div className="card stack">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ margin: 0 }}>{report.title}</h3>
                    <span className="muted" style={{ fontSize: 13 }}>{report.rows.length} records shown</span>
                </div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                {report.columns.map(col => <th key={col}>{col}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {report.rows.map((row, idx) => (
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
        </div>
    );
}
