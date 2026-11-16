import { useEffect, useState } from "react";
import axios from "axios";
import MembershipForm from "./MembershipForm"; // Import our new form!

export default function MembershipList() {
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState(null);

    const userRole = localStorage.getItem("userRole");
    const isAdmin = userRole === "Admin";

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = () => {
        axios.get('/api/membershipplans')
            .then(response => setPlans(response.data))
            .catch(err => {
                console.error("Error fetching plans:", err);
                setError("Failed to load memberships.");
            });
    };

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        const token = localStorage.getItem("token");

        axios.delete(`/api/membershipplans/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(() => {
                setPlans(plans.filter(plan => plan.id !== id));
            })
            .catch(() => alert("Failed to delete."));
    };

    const handleEdit = (plan) => {
        setPlanToEdit(plan);
        setIsFormOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsFormOpen(false);
        setPlanToEdit(null);
        fetchPlans(); // Refresh the table to show the new/updated data!
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setPlanToEdit(null);
    };

    return (
        <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #444", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2>Gym Membership Plans</h2>
                {isAdmin && !isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} style={{ backgroundColor: "#007bff", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        + Add New Plan
                    </button>
                )}
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Show the form if the Add/Edit button was clicked */}
            {isFormOpen && (
                <MembershipForm
                    planToEdit={planToEdit}
                    onSave={handleSaveSuccess}
                    onCancel={handleCancel}
                />
            )}

            {!isFormOpen && plans.length === 0 && !error ? (
                <p>No plans available.</p>
            ) : (
                !isFormOpen && (
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #666" }}>
                                <th>ID</th>
                                <th>Plan Name</th>
                                <th>Price (LKR)</th>
                                <th>Duration (Months)</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(plan => (
                                <tr key={plan.id} style={{ borderBottom: "1px solid #333" }}>
                                    <td style={{ padding: "0.5rem 0" }}>{plan.id}</td>
                                    <td>{plan.name}</td>
                                    <td>{plan.price.toFixed(2)}</td>
                                    <td>{plan.durationInMonths}</td>
                                    {isAdmin && (
                                        <td style={{ display: "flex", gap: "10px", padding: "0.5rem 0" }}>
                                            <button onClick={() => handleEdit(plan)} style={{ backgroundColor: "#ffc107", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(plan.id)} style={{ backgroundColor: "red", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            )}
        </div>
    );
}