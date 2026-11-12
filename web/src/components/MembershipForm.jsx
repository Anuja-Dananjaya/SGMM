import { useState, useEffect } from "react";
import axios from "axios";

export default function MembershipForm({ planToEdit, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        durationInMonths: "",
        description: ""
    });
    const [error, setError] = useState(null);

    // If we click "Edit", populate the form with existing data
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
        
        // Grab the JWT token for Admin authorization
        const token = localStorage.getItem("token");
        const headers = { 'Authorization': `Bearer ${token}` };

        // Ensure numbers are formatted correctly for C#
        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            durationInMonths: parseInt(formData.durationInMonths, 10),
            id: planToEdit ? planToEdit.id : 0
        };

        // NEW: JavaScript Safety Check
        if (payload.price < 0) {
            setError("Price cannot be negative.");
            return;
        }
        if (payload.durationInMonths < 1) {
            setError("Duration must be at least 1 month.");
            return;
        }

        if (planToEdit) {
            // PUT request to update
            axios.put(`http://localhost:5207/api/membershipplans/${planToEdit.id}`, payload, { headers })
                .then(() => onSave())
                .catch(() => setError("Failed to update plan. Are you an Admin?"));
        } else {
            // POST request to create
            axios.post('http://localhost:5207/api/membershipplans', payload, { headers })
                .then(() => onSave())
                .catch(() => setError("Failed to create plan. Are you an Admin?"));
        }
    };

    return (
        <div style={{ padding: "1.5rem", border: "2px solid #007bff", borderRadius: "8px", marginBottom: "2rem", backgroundColor: "#111" }}>
            <h3>{planToEdit ? "Edit Plan" : "Add New Plan"}</h3>
            {error && <p style={{ color: "red" }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
                <input type="text" name="name" placeholder="Plan Name (e.g. Platinum)" value={formData.name} onChange={handleChange} required style={{ padding: "0.5rem" }} />
                <input type="number" name="price" placeholder="Price (LKR)" step="0.01" min = "0" value={formData.price} onChange={handleChange} required style={{ padding: "0.5rem" }} />
                <input type="number" name="durationInMonths" placeholder="Duration (Months)" min="1" value={formData.durationInMonths} onChange={handleChange} required style={{ padding: "0.5rem" }} />
                <input type="text" name="description" placeholder="Description (Optional)" value={formData.description} onChange={handleChange} style={{ padding: "0.5rem" }} />
                
                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                    <button type="submit" style={{ backgroundColor: "#28a745", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Save Plan
                    </button>
                    <button type="button" onClick={onCancel} style={{ backgroundColor: "#dc3545", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}