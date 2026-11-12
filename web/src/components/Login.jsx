import { useState } from "react";
import axios from "axios";

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleLogin = (e) => {
        e.preventDefault();
        setError(null);

        axios.post('http://localhost:5207/api/auth/login', {
            email: email,
            password: password
        })
        .then(response => {
            // Save the token and user details to the browser
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("userRole", response.data.role);
            localStorage.setItem("userName", response.data.fullName);
            
            // Tell App.jsx that we logged in successfully
            onLoginSuccess();
        })
        .catch(err => {
            console.error("Login failed:", err);
            setError("Invalid email or password.");
        });
    };

    return (
        <div style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem", border: "1px solid #444", borderRadius: "8px" }}>
            <h2>Admin / Staff Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
                    />
                </div>
                <button type="submit" style={{ padding: "0.75rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Login
                </button>
            </form>
        </div>
    );
}