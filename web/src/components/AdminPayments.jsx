import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPayments() {
    const [members, setMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [plans, setPlans] = useState([]);
    const [activeTab, setActiveTab] = useState('overdue');
    const [message, setMessage] = useState('');

    useEffect(() => {
        console.log("MEMBER DATA RECEIVED:", members);
        console.log("PLAN DATA RECEIVED:", plans);
    }, [members, plans]);

    const [paymentForm, setPaymentForm] = useState({
        memberId: '',
        amount: '',
        paymentMethod: 'Cash'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [membersRes, paymentsRes, plansRes] = await Promise.all([
                axios.get('/api/Members', { headers }),
                axios.get('/api/Payments', { headers }),
                axios.get('/api/MembershipPlans', { headers })
            ]);
            
            setMembers(membersRes.data);
            setPayments(paymentsRes.data);
            setPlans(plansRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueMembers = members.filter(m => {
        // Fallback for different casing from .NET
        const endDateRaw = m.endDate || m.EndDate;
        const endDate = endDateRaw ? new Date(endDateRaw) : new Date(0);
        return endDate < today;
    });

    const paidMembers = members.filter(m => {
        const endDateRaw = m.endDate || m.EndDate;
        const endDate = endDateRaw ? new Date(endDateRaw) : new Date(0);
        return endDate >= today;
    });

    const handleMemberSelect = (selectedId) => {
        // Find the selected member by their ID
        const selectedMember = members.find(m => m.id.toString() === selectedId.toString());
        
        let amountDue = '';
        if (selectedMember && selectedMember.planName) {
            // Match the Member's planName with the Plan's name
            const memberPlan = plans.find(p => p.name === selectedMember.planName);
            
            if (memberPlan) {
                amountDue = memberPlan.price || 0;
            }
        }

        setPaymentForm({
            ...paymentForm,
            memberId: selectedId,
            amount: amountDue
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const payload = {
                memberId: parseInt(paymentForm.memberId),
                amount: parseFloat(paymentForm.amount),
                paymentMethod: paymentForm.paymentMethod
            };

            await axios.post('/api/Payments', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Payment successful! Member active dates have been extended.');
            setPaymentForm({ memberId: '', amount: '', paymentMethod: 'Cash' });
            fetchData(); 
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to record payment.');
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Billing & Payments</h1>
            
            {/* TOP SECTION: Collect Payment Form (Horizontal Layout) */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Record Payment</h2>
                {message && <p style={styles.message}>{message}</p>}
                
                <form onSubmit={handleSubmit} style={styles.formRow}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Select Member</label>
                        <select 
                            name="memberId" 
                            value={paymentForm.memberId} 
                            onChange={(e) => handleMemberSelect(e.target.value)} 
                            required 
                            style={styles.input}
                        >
                            <option value="">-- Choose Member --</option>
                            {members.map(m => (
                                <option key={m.id || m.Id} value={m.id || m.Id}>
                                    ID: {m.id} - {m.fullName} - {m.firstName || m.FirstName} {m.lastName || m.LastName} 
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Amount Due (LKR)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            name="amount" 
                            value={paymentForm.amount} 
                            onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} 
                            required 
                            style={styles.input} 
                            placeholder="Auto-fills from plan..."
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Payment Method</label>
                        <select 
                            name="paymentMethod" 
                            value={paymentForm.paymentMethod} 
                            onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})} 
                            style={styles.input}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <div style={{ ...styles.formGroup, flex: '0 0 auto' }}>
                        <button type="submit" style={styles.button}>Record Payment & Renew</button>
                    </div>
                </form>
            </div>

            {/* BOTTOM SECTION: Full Width Tables */}
            <div style={styles.section}>
                <div style={styles.tabContainer}>
                    <button 
                        style={activeTab === 'overdue' ? styles.activeTab : styles.tab} 
                        onClick={() => setActiveTab('overdue')}
                    >
                        Overdue ({overdueMembers.length})
                    </button>
                    <button 
                        style={activeTab === 'paid' ? styles.activeTab : styles.tab} 
                        onClick={() => setActiveTab('paid')}
                    >
                        Paid / Active ({paidMembers.length})
                    </button>
                    <button 
                        style={activeTab === 'history' ? styles.activeTab : styles.tab} 
                        onClick={() => setActiveTab('history')}
                    >
                        Transaction History
                    </button>
                </div>

                {/* OVERDUE LIST */}
                {activeTab === 'overdue' && (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Expired On</th>
                                <th style={styles.th}>Amount Due</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                                {overdueMembers.map(m => {
                                    // Look up the exact price using the planName
                                    const memberPlan = plans.find(p => p.name === m.planName);
                                    const amountDue = memberPlan ? (memberPlan.price || 0) : 0;

                                    return (
                                        <tr key={m.id}>
                                            <td style={styles.td}>{m.id}</td>
                                            {/* Use fullName since firstName/lastName aren't in the DTO */}
                                            <td style={styles.td}>{m.fullName}</td>
                                            <td style={{...styles.td, color: '#dc3545', fontWeight: 'bold'}}>
                                                {new Date(m.endDate || m.EndDate || 0).toLocaleDateString()}
                                            </td>
                                            <td style={{...styles.td, fontWeight: 'bold', color: '#333'}}>
                                                LKR {amountDue}
                                            </td>
                                            <td style={styles.td}>
                                                <button 
                                                    style={styles.smallButton}
                                                    onClick={() => handleMemberSelect(m.id)}
                                                >
                                                    Select to Pay
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {overdueMembers.length === 0 && (<tr><td colSpan="5" style={{...styles.td, textAlign: 'center', color: '#555'}}>No overdue members!</td></tr>)}
                            </tbody>
                    </table>
                )}

                {/* PAID LIST */}
                {activeTab === 'paid' && (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Active Until</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paidMembers.map(m => (
                                <tr key={m.id || m.Id}>
                                    <td style={styles.td}>{m.id || m.Id}</td>
                                    <td style={styles.td}>{m.fullName}</td>
                                    <td style={{...styles.td, color: '#28a745', fontWeight: 'bold'}}>
                                        {new Date(m.endDate || m.EndDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {paidMembers.length === 0 && (<tr><td colSpan="3" style={{...styles.td, textAlign: 'center', color: '#555'}}>No active paid members.</td></tr>)}
                        </tbody>
                    </table>
                )}

                {/* HISTORY LIST */}
                {activeTab === 'history' && (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Member ID</th>
                                <th style={styles.th}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.paymentId || p.PaymentId}>
                                    <td style={styles.td}>{new Date(p.paymentDate || p.PaymentDate).toLocaleDateString()}</td>
                                    <td style={styles.td}>{p.memberId || p.MemberId}</td>
                                    <td style={{...styles.td, color: '#333'}}>LKR {(p.amount || p.Amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Updated styles to override global dark mode CSS and fix layout
const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { color: '#fff', borderBottom: '2px solid #28a745', paddingBottom: '10px', marginBottom: '20px' },
    section: { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
    sectionTitle: { color: '#333', marginTop: 0, marginBottom: '20px', fontSize: '22px' },
    
    // Form arranged horizontally
    formRow: { display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' },
    formGroup: { display: 'flex', flexDirection: 'column', flex: '1', minWidth: '200px' },
    label: { color: '#333', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' },
    
    // Explicitly styled inputs to override global dark mode
    input: { padding: '12px', borderRadius: '4px', border: '1px solid #aaa', fontSize: '16px', backgroundColor: '#fff', color: '#333', outline: 'none' },
    button: { padding: '12px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', height: '45px', transition: 'background-color 0.2s' },
    smallButton: { padding: '8px 12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    message: { color: '#155724', backgroundColor: '#d4edda', padding: '12px', borderRadius: '4px', border: '1px solid #c3e6cb', marginBottom: '15px' },
    
    tabContainer: { display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' },
    tab: { flex: 1, padding: '12px', border: 'none', backgroundColor: '#f8f9fa', color: '#555', cursor: 'pointer', fontSize: '16px', fontWeight: '500' },
    activeTab: { flex: 1, padding: '12px', border: 'none', backgroundColor: '#fff', color: '#28a745', borderBottom: '3px solid #28a745', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
    
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa', color: '#333', fontWeight: 'bold' },
    td: { padding: '12px', borderBottom: '1px solid #ddd', color: '#333' }
};