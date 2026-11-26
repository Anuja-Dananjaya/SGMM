import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard({ userName, userRole, status }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        axios.get('/api/Reports/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setData(res.data);
                setError(null);
            })
            .catch(err => {
                console.error('Error loading dashboard:', err);
                setError('Could not load live dashboard statistics. Ensure the backend API is running.');
            })
            .finally(() => setLoading(false));
    }, []);

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

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="card muted">Loading dashboard metrics...</div>
            ) : data ? (
                <>
                    <div className="card-grid">
                        <div className="card stat-card">
                            <span className="stat-label">Active Memberships</span>
                            <span className="stat-value">{data.activeMemberships}</span>
                            <div><span className="badge badge-success">{data.totalMembers} total assigned</span></div>
                        </div>
                        <div className="card stat-card">
                            <span className="stat-label">Today&apos;s Attendance</span>
                            <span className="stat-value">{data.todayAttendance}</span>
                            <div><span className="badge badge-info">{data.weeklyCheckInsTotal} in last 7 days</span></div>
                        </div>
                        <div className="card stat-card">
                            <span className="stat-label">Class Bookings (7 Days)</span>
                            <span className="stat-value">{data.weeklyClassBookings}</span>
                            <div><span className="badge badge-info">{data.activeClassesCount} active classes</span></div>
                        </div>
                        <div className="card stat-card">
                            <span className="stat-label">Monthly Revenue</span>
                            <span className="stat-value">LKR {Number(data.monthlyRevenue || 0).toLocaleString()}</span>
                            <div><span className="badge badge-warning">{data.expiringSoonCount} expiring within 7d</span></div>
                        </div>
                    </div>

                    <div className="two-col">
                        <div className="card">
                            <h3>Weekly Attendance Overview</h3>
                            <p className="muted" style={{ marginBottom: 16 }}>
                                Daily member check-ins over the last 7 days (Total: {data.weeklyCheckInsTotal})
                            </p>
                            {(data.weeklyAttendance || []).map(item => (
                                <div key={item.date} className="bar-row">
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
                            <p className="muted" style={{ marginBottom: 16 }}>
                                Completed payment totals grouped by plan
                            </p>
                            {(!data.revenueByPlan || data.revenueByPlan.length === 0) ? (
                                <p className="muted">No completed payments recorded yet.</p>
                            ) : data.revenueByPlan.map(item => (
                                <div key={item.plan} className="bar-row">
                                    <div className="bar-meta">
                                        <span>{item.plan} ({item.transactions})</span>
                                        <span>LKR {Number(item.amount).toLocaleString()}</span>
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
                                        {(!data.expiringSoon || data.expiringSoon.length === 0) ? (
                                            <tr><td colSpan="4" className="empty">No memberships expiring in the next 7 days.</td></tr>
                                        ) : data.expiringSoon.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.plan}</td>
                                                <td>{new Date(item.expiry).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="badge badge-warning">
                                                        {item.daysLeft <= 0 ? 'Today' : `In ${item.daysLeft}d`}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card stack">
                            <div>
                                <h3>Upcoming Scheduled Classes</h3>
                                <p className="muted">Active classes and current seat occupancy</p>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            <th>Time</th>
                                            <th>Capacity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!data.upcomingSchedule || data.upcomingSchedule.length === 0) ? (
                                            <tr><td colSpan="3" className="empty">No upcoming classes scheduled.</td></tr>
                                        ) : data.upcomingSchedule.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    <strong>{item.title}</strong>
                                                    <div className="muted" style={{ fontSize: 13 }}>{item.subtitle}</div>
                                                </td>
                                                <td>{item.time}</td>
                                                <td>
                                                    <span className={`badge ${item.isFull ? 'badge-danger' : 'badge-success'}`}>
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
                </>
            ) : null}
        </div>
    );
}
