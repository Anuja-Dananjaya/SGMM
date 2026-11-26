import { useState } from "react";
import axios from "axios";

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        axios.post('/api/auth/login', { email, password })
            .then(response => {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("userRole", response.data.role);
                localStorage.setItem("userName", response.data.fullName);
                onLoginSuccess();
            })
            .catch(err => {
                console.error("Login failed:", err);
                setError(err.response?.data?.message || "Invalid email or password.");
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="auth-shell">
            <div className="auth-card stack">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="brand-logo" style={{ width: 44, height: 44, fontSize: 18 }}>S</div>
                    <div>
                        <h2 style={{ margin: 0 }}>SGMM Portal</h2>
                        <p className="muted" style={{ margin: 0, fontSize: 13 }}>Smart Gym Membership Management</p>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleLogin} className="stack" style={{ gap: 14 }}>
                    <div className="field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="admin@sgmm.lk"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn" style={{ width: "100%", padding: "11px 16px" }} disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
