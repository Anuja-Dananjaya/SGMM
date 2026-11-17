import { useEffect, useState } from "react";
import axios from "axios";
import MembershipForm from "./MembershipForm";

export default function MembershipList() {
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState(null);

    const userRole = localStorage.getItem("userRole");
    const canManage = userRole === "Admin" || userRole === "Staff";

    useEffect(() => { fetchPlans(); }, []);

    const fetchPlans = () => {
        axios.get('/api/membershipplans')
            .then(response => setPlans(response.data))
            .catch(err => {
                console.error("Error fetching plans:", err);
                setError("Failed to load membership plans.");
            });
    };

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        const token = localStorage.getItem("token");
        axios.delete(`/api/membershipplans/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(() => setPlans(plans.filter(plan => plan.id !== id)))
            .catch(() => setError("Failed to delete. The plan may be assigned to members."));
    };

    const handleEdit = (plan) => { setPlanToEdit(plan); setIsFormOpen(true); };
    const handleSaveSuccess = () => { setIsFormOpen(false); setPlanToEdit(null); fetchPlans(); };
    const handleCancel = () => { setIsFormOpen(false); setPlanToEdit(null); };

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Membership Plans</h1>
                    <p>Create and manage the plans members can subscribe to.</p>
                </div>
                {canManage && !isFormOpen && (
                    <button className="btn" onClick={() => { setError(null); setIsFormOpen(true); }}>+ Add Plan</button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {isFormOpen && (
                <MembershipForm planToEdit={planToEdit} onSave={handleSaveSuccess} onCancel={handleCancel} />
            )}

            {!isFormOpen && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th>Description</th>
                                <th>Price (LKR)</th>
                                <th>Duration</th>
                                {canManage && <th style={{ width: 140 }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {plans.length === 0 ? (
                                <tr><td colSpan={canManage ? 5 : 4} className="empty">No plans available.</td></tr>
                            ) : plans.map(plan => (
                                <tr key={plan.id}>
                                    <td><strong>{plan.name}</strong></td>
                                    <td className="muted">{plan.description || '—'}</td>
                                    <td>{Number(plan.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td><span className="badge badge-info">{plan.durationInMonths} {plan.durationInMonths === 1 ? 'month' : 'months'}</span></td>
                                    {canManage && (
                                        <td>
                                            <div className="toolbar">
                                                <button className="btn btn-outline btn-sm" onClick={() => handleEdit(plan)}>Edit</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(plan.id)}>Delete</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
