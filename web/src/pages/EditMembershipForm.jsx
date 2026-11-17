import { useState, useEffect } from "react";
import axios from "axios";

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

export default function EditMembershipForm({ member, onSave, onCancel }) {
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        membershipPlanId: member.membershipPlanId || "",
        startDate: toDateInput(member.startDate),
        endDate: toDateInput(member.endDate),
        isActive: member.isActive,
    });

    useEffect(() => {
        axios.get("/api/membershipplans")
            .then(res => setPlans(res.data))
            .catch(() => setError("Failed to load plans."));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        if (formData.endDate <= formData.startDate) {
            setError("End date must be after the start date.");
            return;
        }

        setSaving(true);
        axios.put(`/api/members/${member.id}`, {
            membershipPlanId: parseInt(formData.membershipPlanId, 10),
            startDate: formData.startDate,
            endDate: formData.endDate,
            isActive: formData.isActive === true || formData.isActive === "true",
        }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            .then(() => onSave())
            .catch(err => setError(err.response?.data?.message || "Failed to update the membership."))
            .finally(() => setSaving(false));
    };

    return (
        <div className="card">
            <h3>Edit membership — {member.fullName}</h3>
            <p className="muted">{member.email}</p>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="form-grid">
                <div className="field">
                    <label>Membership Plan</label>
                    <select name="membershipPlanId" value={formData.membershipPlanId} onChange={handleChange} required>
                        <option value="">-- Select a plan --</option>
                        {plans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} ({plan.durationInMonths} {plan.durationInMonths === 1 ? "month" : "months"})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Status</label>
                    <select name="isActive" value={String(formData.isActive)} onChange={handleChange}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <div className="field">
                    <label>Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>End Date</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                </div>
            </form>
        </div>
    );
}
