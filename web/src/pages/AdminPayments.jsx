import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const STATUS_BADGE = {
    Completed: 'badge-success',
    Pending: 'badge-warning',
    Refunded: 'badge-danger',
};

export default function AdminPayments() {
    const [members, setMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [plans, setPlans] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    // History filters
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatus, setHistoryStatus] = useState('All');

    const [paymentForm, setPaymentForm] = useState({
        memberId: '',
        amount: '',
        paymentMethod: 'Cash',
        status: 'Completed',
    });

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = authHeaders();
            const [membersRes, paymentsRes, plansRes] = await Promise.all([
                axios.get('/api/Members', { headers }),
                axios.get('/api/Payments', { headers }),
                axios.get('/api/MembershipPlans', { headers })
            ]);

            setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
            setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
            setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
        } catch (error) {
            console.error('Error fetching billing data:', error);
            setMessage({ type: 'error', text: 'Failed to load billing data. Ensure the backend API is running.' });
        } finally {
            setLoading(false);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueMembers = members.filter(m => !m.isActive || new Date(m.endDate || 0) < today);
    const paidMembers = members.filter(m => m.isActive && new Date(m.endDate || 0) >= today);
    const pendingPayments = payments.filter(p => p.status === 'Pending');

    const handleMemberSelect = (selectedId) => {
        const selectedMember = members.find(m => String(m.id) === String(selectedId));
        let amountDue = '';
        if (selectedMember?.planName) {
            const memberPlan = plans.find(p => p.name === selectedMember.planName);
            if (memberPlan) amountDue = memberPlan.price || 0;
        }
        setPaymentForm(prev => ({ ...prev, memberId: selectedId, amount: amountDue }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setSubmitting(true);

        try {
            const payload = {
                memberId: parseInt(paymentForm.memberId, 10),
                amount: parseFloat(paymentForm.amount),
                paymentMethod: paymentForm.paymentMethod,
                status: paymentForm.status,
            };

            await axios.post('/api/Payments', payload, { headers: authHeaders() });
            setMessage({
                type: 'success',
                text: paymentForm.status === 'Completed'
                    ? 'Payment recorded and membership extended.'
                    : 'Pending payment recorded (membership will extend once marked Paid).'
            });
            setPaymentForm({ memberId: '', amount: '', paymentMethod: 'Cash', status: 'Completed' });
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data?.Message || 'Failed to record payment.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (paymentId, newStatus) => {
        if (newStatus === 'Refunded' && !window.confirm('Mark this payment as Refunded?')) return;
        setMessage(null);

        try {
            const res = await axios.put(
                `/api/Payments/${paymentId}/status`,
                { status: newStatus },
                { headers: authHeaders() }
            );
            setMessage({ type: 'success', text: res.data?.message || res.data?.Message || `Payment marked as ${newStatus}.` });
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data?.Message || 'Failed to update payment status.';
            setMessage({ type: 'error', text: msg });
        }
    };

    const filteredHistory = useMemo(() => {
        const q = historySearch.trim().toLowerCase();
        return payments.filter(p => {
            if (historyStatus !== 'All' && p.status !== historyStatus) return false;
            if (q && !(
                p.memberName?.toLowerCase().includes(q) ||
                p.memberEmail?.toLowerCase().includes(q) ||
                p.planName?.toLowerCase().includes(q) ||
                p.paymentMethod?.toLowerCase().includes(q)
            )) return false;
            return true;
        });
    }, [payments, historySearch, historyStatus]);

    const collectedRevenue = payments
        .filter(p => p.status === 'Completed')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingTotal = pendingPayments
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Billing &amp; Payments</h1>
                    <p>Record member payments, track pending dues, and manage transaction history.</p>
                </div>
            </div>

            <div className="card-grid">
                <div className="card stat-card">
                    <span className="stat-label">Collected Revenue</span>
                    <span className="stat-value">LKR {collectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <div><span className="badge badge-success">{payments.filter(p => p.status === 'Completed').length} completed payments</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Pending Payments</span>
                    <span className="stat-value">LKR {pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <div><span className="badge badge-warning">{pendingPayments.length} pending records</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Overdue Memberships</span>
                    <span className="stat-value">{overdueMembers.length}</span>
                    <div><span className="badge badge-danger">{paidMembers.length} active memberships</span></div>
                </div>
            </div>

            <div className="card">
                <h3>Record Member Payment</h3>
                {message && <div className={`alert alert-${message.type}`} style={{ marginTop: 10 }}>{message.text}</div>}
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="field">
                        <label>Member</label>
                        <select value={paymentForm.memberId} onChange={e => handleMemberSelect(e.target.value)} required>
                            <option value="">-- Choose Member --</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.fullName} — {m.planName} ({m.isActive ? 'Active' : 'Overdue'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Amount (LKR)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Auto-fills from plan..."
                            value={paymentForm.amount}
                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Payment Method</label>
                        <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Payment Status</label>
                        <select value={paymentForm.status} onChange={e => setPaymentForm({ ...paymentForm, status: e.target.value })}>
                            <option value="Completed">Completed (Paid &amp; Extend)</option>
                            <option value="Pending">Pending (Unpaid Invoice)</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="tabs">
                <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    Pending Payments ({pendingPayments.length})
                </button>
                <button className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}>
                    Overdue Members ({overdueMembers.length})
                </button>
                <button className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`} onClick={() => setActiveTab('paid')}>
                    Paid / Active ({paidMembers.length})
                </button>
                <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                    Transaction History ({payments.length})
                </button>
            </div>

            {activeTab === 'pending' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Member</th>
                                <th>Plan</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th style={{ width: 150 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="empty">Loading pending payments...</td></tr>
                            ) : pendingPayments.length === 0 ? (
                                <tr><td colSpan="6" className="empty">No pending payments.</td></tr>
                            ) : pendingPayments.map(p => (
                                <tr key={p.paymentId}>
                                    <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                    <td>
                                        <strong>{p.memberName}</strong>
                                        {p.memberEmail && <div className="muted" style={{ fontSize: 12 }}>{p.memberEmail}</div>}
                                    </td>
                                    <td>{p.planName}</td>
                                    <td>{p.paymentMethod}</td>
                                    <td><strong>LKR {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                                    <td>
                                        <button className="btn btn-sm" onClick={() => handleUpdateStatus(p.paymentId, 'Completed')}>
                                            Mark as Paid
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'overdue' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Plan</th>
                                <th>Expired On</th>
                                <th>Amount Due</th>
                                <th style={{ width: 150 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="empty">Loading overdue members...</td></tr>
                            ) : overdueMembers.length === 0 ? (
                                <tr><td colSpan="5" className="empty">No overdue members.</td></tr>
                            ) : overdueMembers.map(m => {
                                const memberPlan = plans.find(p => p.name === m.planName);
                                const amountDue = memberPlan ? memberPlan.price : 0;
                                return (
                                    <tr key={m.id}>
                                        <td>
                                            <strong>{m.fullName}</strong>
                                            <div className="muted" style={{ fontSize: 12 }}>{m.email}</div>
                                        </td>
                                        <td>{m.planName}</td>
                                        <td><span className="badge badge-danger">{new Date(m.endDate).toLocaleDateString()}</span></td>
                                        <td><strong>LKR {Number(amountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                                        <td>
                                            <button className="btn btn-sm" onClick={() => handleMemberSelect(m.id)}>Select to Pay</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'paid' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Plan</th>
                                <th>Active Until</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="empty">Loading active members...</td></tr>
                            ) : paidMembers.length === 0 ? (
                                <tr><td colSpan="4" className="empty">No active paid members.</td></tr>
                            ) : paidMembers.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <strong>{m.fullName}</strong>
                                        <div className="muted" style={{ fontSize: 12 }}>{m.email}</div>
                                    </td>
                                    <td>{m.planName}</td>
                                    <td>{new Date(m.endDate).toLocaleDateString()}</td>
                                    <td><span className="badge badge-success">Paid / Active</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="stack">
                    <div className="card filters">
                        <div className="field filter-search">
                            <label>Search Transactions</label>
                            <input
                                type="text"
                                placeholder="Member, email, plan or method..."
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Status</label>
                            <select value={historyStatus} onChange={e => setHistoryStatus(e.target.value)}>
                                <option value="All">All Statuses</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Member</th>
                                    <th>Plan</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ width: 160 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="empty">Loading transactions...</td></tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr><td colSpan="7" className="empty">No payment transactions found.</td></tr>
                                ) : filteredHistory.map(p => (
                                    <tr key={p.paymentId}>
                                        <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                        <td>
                                            <strong>{p.memberName}</strong>
                                            {p.memberEmail && <div className="muted" style={{ fontSize: 12 }}>{p.memberEmail}</div>}
                                        </td>
                                        <td>{p.planName}</td>
                                        <td>{p.paymentMethod}</td>
                                        <td><strong>LKR {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                                        <td><span className={`badge ${STATUS_BADGE[p.status] || ''}`}>{p.status}</span></td>
                                        <td>
                                            <div className="toolbar">
                                                {p.status === 'Pending' && (
                                                    <button className="btn btn-sm" onClick={() => handleUpdateStatus(p.paymentId, 'Completed')}>
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {p.status === 'Completed' && (
                                                    <button className="btn btn-outline btn-sm" onClick={() => handleUpdateStatus(p.paymentId, 'Refunded')}>
                                                        Refund
                                                    </button>
                                                )}
                                                {p.status === 'Refunded' && <span className="muted">—</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
