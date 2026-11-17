import { useState, useEffect } from "react";
import axios from "axios";

export default function AssignMemberForm({ onSave, onCancel }) {
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({ userId: "", membershipPlanId: "" });
    const [error, setError] = useState(null);

    useEffect(() => {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        axios.get('/api/auth/users', { headers })
            .then(response => setUsers(response.data.filter(u => u.role === 'Member')))
            .catch(() => setError("Failed to load users."));

        axios.get('/api/membershipplans')
            .then(response => setPlans(response.data))
            .catch(() => setError("Failed to load plans."));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.userId || !formData.membershipPlanId) {
            setError("Please select both a member and a plan.");
            return;
        }

        axios.post('/api/members/assign', {
            userId: formData.userId,
            membershipPlanId: parseInt(formData.membershipPlanId, 10)
        }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            .then(() => onSave())
            .catch(err => {
                console.error(err);
                setError("Failed to assign the plan. Please try again.");
            });
    };

    return (
        <div className="card">
            <h3>Assign membership to a member</h3>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="form-grid">
                <div className="field">
                    <label>Member</label>
                    <select name="userId" value={formData.userId} onChange={handleChange} required>
                        <option value="">-- Select a member --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.fullName} ({user.email})</option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Membership Plan</label>
                    <select name="membershipPlanId" value={formData.membershipPlanId} onChange={handleChange} required>
                        <option value="">-- Select a plan --</option>
                        {plans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} — {Number(plan.price).toFixed(2)} LKR
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn">Assign Plan</button>
                </div>
            </form>
        </div>
    );
}
