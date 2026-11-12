import { useState, useEffect } from "react";
import axios from "axios";

export default function AssignMemberForm({ onSave, onCancel }) {
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        userId: "",
        membershipPlanId: ""
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch all registered users
        axios.get('http://localhost:5207/api/auth/users', { headers })
            .then(response => setUsers(response.data))
            .catch(() => setError("Failed to load users."));

        // 2. Fetch all membership plans (public endpoint, no token needed)
        axios.get('http://localhost:5207/api/membershipplans')
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
            setError("Please select both a user and a plan.");
            return;
        }

        const token = localStorage.getItem("token");
        
        const payload = {
            userId: formData.userId,
            membershipPlanId: parseInt(formData.membershipPlanId, 10)
        };

        axios.post('http://localhost:5207/api/members/assign', payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(() => onSave()) // Refresh list and close form
        .catch(err => {
            console.error(err);
            setError("Failed to assign plan. Check console for details.");
        });
    };

    return (
        <div style={{ padding: "1.5rem", border: "2px solid #28a745", borderRadius: "8px", marginBottom: "2rem", backgroundColor: "#111" }}>
            <h3>Assign Membership to User</h3>
            {error && <p style={{ color: "red" }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
                
                <select name="userId" value={formData.userId} onChange={handleChange} required style={{ padding: "0.5rem" }}>
                    <option value="">-- Select a User --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.fullName} ({user.email})
                        </option>
                    ))}
                </select>

                <select name="membershipPlanId" value={formData.membershipPlanId} onChange={handleChange} required style={{ padding: "0.5rem" }}>
                    <option value="">-- Select a Plan --</option>
                    {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price.toFixed(2)} LKR
                        </option>
                    ))}
                </select>
                
                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                    <button type="submit" style={{ backgroundColor: "#28a745", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Assign Plan
                    </button>
                    <button type="button" onClick={onCancel} style={{ backgroundColor: "#dc3545", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}