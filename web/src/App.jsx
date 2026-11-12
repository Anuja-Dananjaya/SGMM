import { useEffect, useState } from "react";
import axios from "axios";
import MembershipList from "./components/MembershipList";
import MembersList from "./components/MemberList";
import Login from "./components/Login";
import FrontDeskQR from "./components/FrontDeskQR";
import "./App.css";

function App() {
  const [status, setStatus] = useState("Checking...");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // 1. Check API Health
    axios.get('http://localhost:5207/api/health')
      .then(response => setStatus(response.data.status))
      .catch(() => setStatus("Error connecting to API"));

    // 2. Check if already logged in (token exists in storage)
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      setUserName(localStorage.getItem("userName"));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
  };

  return (
    <div>
      <h1>Gym Management System</h1>
      <div style={{ padding: "10px", backgroundColor: status === "Healthy" ? "green" : "red", marginBottom: "1rem" }}>
        API Status: {status}
      </div>

      {isAuthenticated ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#222", padding: "1rem", borderRadius: "8px" }}>
            <p style={{ margin: 0 }}>Welcome back, <strong>{userName}</strong></p>
            <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>Logout</button>
          </div>

          <FrontDeskQR />
          <MembershipList />
          <MembersList /> {/* NEW COMPONENT */}
        
        </div>
      ) : (
        <Login onLoginSuccess={() => {
          setIsAuthenticated(true);
          setUserName(localStorage.getItem("userName"));
        }} />
      )}
      
    </div>
  );
}

export default App;