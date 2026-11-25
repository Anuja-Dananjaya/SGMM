import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SAMPLE_MEMBERS = [
    { id: 1, fullName: 'Kasun Perera', planName: 'Platinum Annual', endDate: '2027-01-15', isActive: true },
    { id: 2, fullName: 'Ishara Madushan', planName: 'Gold Monthly', endDate: '2026-10-10', isActive: false },
    { id: 3, fullName: 'Nimal Perera', planName: 'Gold Monthly', endDate: '2026-11-12', isActive: false },
    { id: 4, fullName: 'Tharushi Silva', planName: 'Student Plan', endDate: '2026-12-01', isActive: true },
];

const SAMPLE_PLANS = [
    { id: 1, name: 'Platinum Annual', price: 15000 },
    { id: 2, name: 'Gold Monthly', price: 7500 },
    { id: 3, name: 'Standard Monthly', price: 6500 },
    { id: 4, name: 'Student Plan', price: 4500 },
];

const SAMPLE_PAYMENTS = [
    { paymentId: 1042, memberId: 1, memberName: 'Kasun Perera', planName: 'Platinum Annual', paymentDate: '2026-11-15', amount: 15000, paymentMethod: 'Card', status: 'Completed' },
    { paymentId: 1041, memberId: 4, memberName: 'Tharushi Silva', planName: 'Student Plan', paymentDate: '2026-11-14', amount: 4500, paymentMethod: 'Cash', status: 'Completed' },
    { paymentId: 1040, memberId: 2, memberName: 'Ishara Madushan', planName: 'Gold Monthly', paymentDate: '2026-11-10', amount: 7500, paymentMethod: 'Cash', status: 'Pending' },
    { paymentId: 1039, memberId: 3, memberName: 'Nimal Perera', planName: 'Gold Monthly', paymentDate: '2026-11-08', amount: 7500, paymentMethod: 'Bank Transfer', status: 'Completed' },
];

export default function AdminPayments() {
    const [members, setMembers] = useState(SAMPLE_MEMBERS);
    const [payments, setPayments] = useState(SAMPLE_PAYMENTS);
    const [plans, setPlans] = useState(SAMPLE_PLANS);
    const [activeTab, setActiveTab] = useState('overdue');
    const [message, setMessage] = useState(null);

    const [paymentForm, setPaymentForm] = useState({
        memberId: '',
        amount: '',
        paymentMethod: 'Cash',
        status: 'Completed',
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token || token === 'demo-token') return;

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [membersRes, paymentsRes, plansRes] = await Promise.all([
                axios.get('/api/Members', { headers }),
                axios.get('/api/Payments', { headers }),
                axios.get('/api/MembershipPlans', { headers })
            ]);

            if (membersRes.data?.length) setMembers(membersRes.data);
            if (paymentsRes.data?.length) setPayments(paymentsRes.data);
            if (plansRes.data?.length) setPlans(plansRes.data);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueMembers = members.filter(m => new Date(m.endDate || m.EndDate || 0) < today);
    const paidMembers = members.filter(m => new Date(m.endDate || m.EndDate || 0) >= today);

    const handleMemberSelect = (selectedId) => {
        const selectedMember = members.find(m => String(m.id || m.Id) === String(selectedId));
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

        const token = localStorage.getItem('token');
        const payload = {
            memberId: parseInt(paymentForm.memberId, 10),
            amount: parseFloat(paymentForm.amount),
            paymentMethod: paymentForm.paymentMethod,
        };

        if (!token || token === 'demo-token') {
            const m = members.find(x => String(x.id) === String(paymentForm.memberId));
            setPayments(prev => [{
                paymentId: Date.now(),
                memberId: payload.memberId,
                memberName: m?.fullName || `Member #${payload.memberId}`,
                planName: m?.planName || 'Membership',
                paymentDate: new Date().toISOString(),
                amount: payload.amount,
                paymentMethod: payload.paymentMethod,
                status: paymentForm.status,
            }, ...prev]);
            setMessage({ type: 'success', text: `Payment recorded (${paymentForm.status}) for ${m?.fullName || 'member'}.` });
            setPaymentForm({ memberId: '', amount: '', paymentMethod: 'Cash', status: 'Completed' });
            return;
        }

        try {
            await axios.post('/api/Payments', payload, { headers: { Authorization: `Bearer ${token}` } });
            setMessage({ type: 'success', text: 'Payment recorded successfully.' });
            setPaymentForm({ memberId: '', amount: '', paymentMethod: 'Cash', status: 'Completed' });
            fetchData();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to record payment.' });
        }
    };

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || p.Amount || 0), 0);
    const pendingTotal = payments
        .filter(p => (p.status || p.Status) === 'Pending')
        .reduce((sum, p) => sum + Number(p.amount || p.Amount || 0), 0);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Billing &amp; Payments</h1>
                    <p>Record member payments, track overdue accounts, and review transaction history.</p>
                </div>
            </div>

            <div className="card-grid">
                <div className="card stat-card">
                    <span className="stat-label">Recorded Revenue</span>
                    <span className="stat-value">LKR {totalRevenue.toLocaleString()}</span>
                    <div><span className="badge badge-success">Current cycle</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Overdue / Pending Dues</span>
                    <span className="stat-value">{overdueMembers.length} accounts</span>
                    <div><span className="badge badge-danger">LKR {pendingTotal.toLocaleString()} pending</span></div>
                </div>
                <div className="card stat-card">
                    <span className="stat-label">Completed Transactions</span>
                    <span className="stat-value">{payments.filter(p => (p.status || 'Completed') === 'Completed').length}</span>
                    <div><span className="badge badge-info">{paidMembers.length} active paid members</span></div>
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
                                <option key={m.id || m.Id} value={m.id || m.Id}>
                                    {m.fullName} ({m.planName})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Amount (LKR)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
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
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn">Record Payment</button>
                    </div>
                </form>
            </div>

            <div className="tabs">
                <button className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}>
                    Overdue / Pending ({overdueMembers.length})
                </button>
                <button className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`} onClick={() => setActiveTab('paid')}>
                    Paid / Active ({paidMembers.length})
                </button>
                <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                    Transaction History ({payments.length})
                </button>
            </div>

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
                            {overdueMembers.length === 0 ? (
                                <tr><td colSpan="5" className="empty">No overdue members.</td></tr>
                            ) : overdueMembers.map(m => {
                                const memberPlan = plans.find(p => p.name === m.planName);
                                const amountDue = memberPlan ? memberPlan.price : 0;
                                return (
                                    <tr key={m.id}>
                                        <td><strong>{m.fullName}</strong></td>
                                        <td>{m.planName}</td>
                                        <td><span className="badge badge-danger">{new Date(m.endDate || m.EndDate || 0).toLocaleDateString()}</span></td>
                                        <td><strong>LKR {Number(amountDue).toLocaleString()}</strong></td>
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
                            {paidMembers.length === 0 ? (
                                <tr><td colSpan="4" className="empty">No active paid members.</td></tr>
                            ) : paidMembers.map(m => (
                                <tr key={m.id || m.Id}>
                                    <td><strong>{m.fullName}</strong></td>
                                    <td>{m.planName}</td>
                                    <td>{new Date(m.endDate || m.EndDate).toLocaleDateString()}</td>
                                    <td><span className="badge badge-success">Paid / Active</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Member</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr><td colSpan="5" className="empty">No payment transactions recorded.</td></tr>
                            ) : payments.map(p => {
                                const st = p.status || p.Status || 'Completed';
                                return (
                                    <tr key={p.paymentId || p.PaymentId}>
                                        <td>{new Date(p.paymentDate || p.PaymentDate).toLocaleDateString()}</td>
                                        <td><strong>{p.memberName || `Member #${p.memberId || p.MemberId}`}</strong></td>
                                        <td>{p.paymentMethod || p.PaymentMethod || 'Cash'}</td>
                                        <td><strong>LKR {Number(p.amount || p.Amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                                        <td><span className={`badge ${st === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{st}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
