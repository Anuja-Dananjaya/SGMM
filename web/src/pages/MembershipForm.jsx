import { useState, useEffect } from "react";
import axios from "axios";

export default function MembershipForm({ planToEdit, onSave, onCancel }) {
    const [formData, setFormData] = useState({ name: "", price: "", durationInMonths: "", description: "" });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (planToEdit) {
            setFormData({
                name: planToEdit.name,
                price: planToEdit.price,
                durationInMonths: planToEdit.durationInMonths,
                description: planToEdit.description || ""
            });
        }
    }, [planToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            durationInMonths: parseInt(formData.durationInMonths, 10),
            id: planToEdit ? planToEdit.id : 0
        };

        if (payload.price < 0) return setError("Price cannot be negative.");
        if (payload.durationInMonths < 1) return setError("Duration must be at least 1 month.");

        const request = planToEdit
            ? axios.put(`/api/membershipplans/${planToEdit.id}`, payload, { headers })
            : axios.post('/api/membershipplans', payload, { headers });

        request
            .then(() => onSave())
            .catch(() => setError("Failed to save the plan. Please check the details and your permissions."));
    };

    return (
        <div className="card">
            <h3>{planToEdit ? "Edit plan" : "Add new plan"}</h3>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="form-grid">
                <div className="field">
                    <label>Plan Name</label>
                    <input type="text" name="name" placeholder="e.g. Platinum" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>Price (LKR)</label>
                    <input type="number" name="price" step="0.01" min="0" value={formData.price} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>Duration (months)</label>
                    <input type="number" name="durationInMonths" min="1" value={formData.durationInMonths} onChange={handleChange} required />
                </div>
                <div className="field">
                    <label>Description (optional)</label>
                    <input type="text" name="description" value={formData.description} onChange={handleChange} />
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn">Save Plan</button>
                </div>
            </form>
        </div>
    );
}
