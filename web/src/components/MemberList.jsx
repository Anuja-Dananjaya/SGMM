import { useEffect, useState } from "react";
import axios from "axios";
import AssignMemberForm from "./AssignMemberForm"; // NEW IMPORT

export default function MembersList() {
    const [members, setMembers] = useState([]);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const userRole = localStorage.getItem("userRole");
    const isAdminOrStaff = userRole === "Admin" || userRole === "Staff";

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = () => {
        const token = localStorage.getItem("token");

        axios.get('/api/members', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => setMembers(response.data))
            .catch(err => {
                console.error("Error fetching members:", err);
                setError("Failed to load members.");
            });
    };

    const handleCancel = (id) => {
        if (!window.confirm("Are you sure you want to cancel this membership?")) return;

        const token = localStorage.getItem("token");

        axios.put(`/api/members/${id}/cancel`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(() => fetchMembers()) // Refresh to show it as Expired
            .catch(() => alert("Failed to cancel membership."));
    };

    const handleSaveSuccess = () => {
        setIsFormOpen(false);
        fetchMembers(); // Refresh the table automatically!
    };

    return (
        <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #444", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2>Gym Members Directory</h2>
                {isAdminOrStaff && !isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} style={{ backgroundColor: "#28a745", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        + Assign Membership
                    </button>
                )}
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Show the assignment form if the button was clicked */}
            {isFormOpen && (
                <AssignMemberForm
                    onSave={handleSaveSuccess}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}

            {!isFormOpen && members.length === 0 && !error ? (
                <p>No members have been assigned plans yet.</p>
            ) : (
                !isFormOpen && (
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #666" }}>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Plan</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                {isAdminOrStaff && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id} style={{ borderBottom: "1px solid #333" }}>
                                    <td style={{ padding: "0.5rem 0" }}>{member.fullName}</td>
                                    <td>{member.email}</td>
                                    <td>{member.planName}</td>
                                    <td>{new Date(member.startDate).toLocaleDateString()}</td>
                                    <td>{new Date(member.endDate).toLocaleDateString()}</td>
                                    <td>
                                        <span style={{
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            backgroundColor: member.isActive ? "#28a745" : "#dc3545",
                                            color: "white",
                                            fontSize: "0.85rem"
                                        }}>
                                            {member.isActive ? "Active" : "Expired"}
                                        </span>
                                    </td>
                                    {isAdminOrStaff && (
                                        <td>
                                            {member.isActive && (
                                                <button
                                                    onClick={() => handleCancel(member.id)}
                                                    style={{ backgroundColor: "#ffc107", color: "black", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>
                                                    Cancel Plan
                                                </button>
                                            )}
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