import { useEffect, useState } from "react";
import axios from "axios";

export default function MembersList() {
    const [members, setMembers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        
        axios.get('http://localhost:5207/api/members', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => setMembers(response.data))
        .catch(err => {
            console.error("Error fetching members:", err);
            setError("Failed to load members.");
        });
    }, []);

    return (
        <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #444", borderRadius: "8px" }}>
            <h2>Gym Members Directory</h2>
            
            {error && <p style={{ color: "red" }}>{error}</p>}
            
            {members.length === 0 && !error ? (
                <p>No members have been assigned plans yet.</p>
            ) : (
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #666" }}>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}