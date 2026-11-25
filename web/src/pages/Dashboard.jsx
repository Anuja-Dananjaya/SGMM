import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WEEKLY_ATTENDANCE = [
    { day: 'Monday', count: 54, pct: 84 },
    { day: 'Tuesday', count: 48, pct: 75 },
    { day: 'Wednesday', count: 61, pct: 95 },
    { day: 'Thursday', count: 45, pct: 70 },
    { day: 'Friday', count: 64, pct: 100 },
    { day: 'Saturday', count: 52, pct: 81 },
    { day: 'Sunday (Today)', count: 42, pct: 66 },
];

const REVENUE_BY_PLAN = [
    { plan: 'Platinum Annual', members: 38, amount: 'LKR 240,000', pct: 44 },
    { plan: 'Gold Monthly', members: 54, amount: 'LKR 162,000', pct: 30 },
    { plan: 'Standard Monthly', members: 41, amount: 'LKR 102,500', pct: 19 },
    { plan: 'Student Plan', members: 15, amount: 'LKR 38,000', pct: 7 },
];

const EXPIRING_SOON = [
    { id: 1, name: 'Nimal Perera', plan: 'Gold Monthly', expiry: '2026-11-20', daysLeft: 2 },
    { id: 2, name: 'Kavindi Silva', plan: 'Platinum Annual', expiry: '2026-11-21', daysLeft: 3 },
    { id: 3, name: 'Dilshan Fernando', plan: 'Standard Monthly', expiry: '2026-11-23', daysLeft: 5 },
    { id: 4, name: 'Tharindu Jayawardena', plan: 'Gold Monthly', expiry: '2026-11-24', daysLeft: 6 },
];

const TODAY_SCHEDULE = [
    { id: 1, title: 'Morning HIIT Blast', trainer: 'Coach Ruwan', time: '07:00 – 08:00', info: '18 / 20 Booked', type: 'Class' },
    { id: 2, title: '1-on-1 Strength Assessment', trainer: 'Coach Amaya', time: '10:30 – 11:30', info: 'Confirmed (Kasun P.)', type: 'Session' },
    { id: 3, title: 'Power Yoga & Mobility', trainer: 'Coach Dilani', time: '17:30 – 18:30', info: '15 / 15 Full', type: 'Class' },
    { id: 4, title: 'Evening Spin & Core', trainer: 'Coach Ruwan', time: '18:45 – 19:45', info: '12 / 20 Booked', type: 'Class' },
];

export default function Dashboard({ userName, userRole, status }) {
    const [liveStats, setLiveStats] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || token === 'demo-token') return;

        const headers = { Authorization: `Bearer ${token}` };
        Promise.allSettled([
            axios.get('/api/Members', { headers }),
            axios.get('/api/Classes', { headers }),
            axios.get('/api/Payments', { headers }),
        ]).then(([membersRes, classesRes, paymentsRes]) => {
            const members = membersRes.status === 'fulfilled' ? membersRes.value.data : null;
            const classes = classesRes.status === 'fulfilled' ? classesRes.value.data : null;
            const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value.data : null;

            if (members || classes || payments) {
                const activeMembers = members ? members.filter(m => m.isActive).length : 148;
                const totalBookings = classes ? classes.reduce((s, c) => s + (c.enrolledCount || 0), 0) : 86;
                const revenue = payments ? payments.reduce((s, p) => s + (p.amount || p.Amount || 0), 0) : 542500;
                setLiveStats({
                    activeMembers: activeMembers || 148,
                    totalBookings: totalBookings || 86,
                    revenue: revenue || 542500,
                    classCount: classes ? classes.length : 6,
                });
            }
        });
    }, []);

    const activeCount = liveStats?.activeMembers ?? 148;
    const bookingCount = liveStats?.totalBookings ?? 86;
    const classCount = liveStats?.classCount ?? 6;
    const revenueDisplay = `LKR ${Number(liveStats?.revenue ?? 542500).toLocaleString()}`;

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Welcome back, {userName}</h1>
                    <p>{userRole} Overview — {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className={`status-pill ${status === 'Healthy' ? 'status-ok' : status === 'Checking...' ? 'status-wait' : 'status-bad'}`}>
                    <span className="dot" /> API: {status}
                </span>
            </div>

            <div className="card-grid">
                <div className="card stat-card">
                    <span className="stat-label">Active Memberships</span>
                    <span className="stat-value">{activeCount}</span>
                    <div><span className="badge badge-success">+14 this month</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Today&apos;s Attendance</span>
                    <span className="stat-value">42</span>
                    <div><span className="badge badge-info">Peak hour: 6:00 PM</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Class Bookings (This Week)</span>
                    <span className="stat-value">{bookingCount}</span>
                    <div><span className="badge badge-info">{classCount} classes active</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Monthly Revenue</span>
                    <span className="stat-value">{revenueDisplay}</span>
                    <div><span className="badge badge-warning">9 expiring soon</span></div>
                </div>
            </div>

            <div className="two-col">
                <div className="card">
                    <h3>Weekly Attendance Overview</h3>
                    <p className="muted" style={{ marginBottom: 16 }}>Daily QR & front-desk member check-ins (Total: 366)</p>
                    {WEEKLY_ATTENDANCE.map(item => (
                        <div key={item.day} className="bar-row">
                            <div className="bar-meta">
                                <span>{item.day}</span>
                                <span>{item.count} check-ins</span>
                            </div>
                            <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${item.pct}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <h3>Revenue by Membership Plan</h3>
                    <p className="muted" style={{ marginBottom: 16 }}>Current billing cycle breakdown across 148 active members</p>
                    {REVENUE_BY_PLAN.map(item => (
                        <div key={item.plan} className="bar-row">
                            <div className="bar-meta">
                                <span>{item.plan} ({item.members})</span>
                                <span>{item.amount}</span>
                            </div>
                            <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${item.pct}%`, background: '#2563eb' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="two-col">
                <div className="card stack">
                    <div>
                        <h3>Memberships Expiring Soon</h3>
                        <p className="muted">Renewals due within the next 7 days</p>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Plan</th>
                                    <th>Expiry</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {EXPIRING_SOON.map(item => (
                                    <tr key={item.id}>
                                        <td><strong>{item.name}</strong></td>
                                        <td>{item.plan}</td>
                                        <td>{item.expiry}</td>
                                        <td><span className="badge badge-warning">In {item.daysLeft} days</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card stack">
                    <div>
                        <h3>Today&apos;s Classes & Trainer Sessions</h3>
                        <p className="muted">Live floor schedule across classes and 1-on-1 appointments</p>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>Time</th>
                                    <th>Capacity / Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TODAY_SCHEDULE.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.title}</strong>
                                            <div className="muted" style={{ fontSize: 13 }}>{item.trainer} · {item.type}</div>
                                        </td>
                                        <td>{item.time}</td>
                                        <td>
                                            <span className={`badge ${item.info.includes('Full') ? 'badge-danger' : 'badge-success'}`}>
                                                {item.info}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
