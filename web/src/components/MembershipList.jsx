import { useEffect, useState } from "react";
import axios from "axios";

export default function MembershipList() {
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch the data from your new C# Controller
        axios.get('http://localhost:5207/api/membershipplans')
            .then(response => {
                setPlans(response.data);
            })
            .catch(err => {
                console.error("Error fetching plans:", err);
                setError("Failed to load memberships.");
            });
    }, []);

    return (
        <div className="membership-container" style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #444", borderRadius: "8px" }}>
            <h2>Gym Membership Plans</h2>
            
            {error && <p style={{ color: "red" }}>{error}</p>}
            
            {plans.length === 0 && !error ? (
                <p>No plans available. Add one using Swagger!</p>
            ) : (
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #666" }}>
                            <th>ID</th>
                            <th>Plan Name</th>
                            <th>Price (LKR)</th>
                            <th>Duration (Months)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(plan => (
                            <tr key={plan.id} style={{ borderBottom: "1px solid #333" }}>
                                <td style={{ padding: "0.5rem 0" }}>{plan.id}</td>
                                <td>{plan.name}</td>
                                <td>{plan.price.toFixed(2)}</td>
                                <td>{plan.durationInMonths}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}