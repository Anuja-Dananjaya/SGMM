import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Components
import Navbar from "./components/Navbar";
import MembershipList from "./components/MembershipList";
import MembersList from "./components/MemberList";
import Login from "./components/Login";
import FrontDeskQR from "./components/FrontDeskQR";
import AdminClasses from './components/AdminClasses'; 
import AdminPayments from './components/AdminPayments';
import "./App.css";

axios.defaults.baseURL = 'http://localhost:5207';

function App() {
  const [status, setStatus] = useState("Checking...");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    axios.get('/api/health')
      .then(response => setStatus(response.data.status))
      .catch(() => setStatus("Error connecting to API"));

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

  // If not logged in, just show the Login screen
  if (!isAuthenticated) {
      return (
          <Login onLoginSuccess={() => {
              setIsAuthenticated(true);
              setUserName(localStorage.getItem("userName"));
          }} />
      );
  }

  // If logged in, show the Navbar and route to the correct page
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
        <Navbar userName={userName} onLogout={handleLogout} />
        
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            {/* Home / Dashboard Route */}
            <Route path="/" element={
              <div>
                <h1>System Dashboard</h1>
                <div style={{ padding: "10px", backgroundColor: status === "Healthy" ? "#28a745" : "#dc3545", color: "white", display: "inline-block", borderRadius: "4px" }}>
                  API Status: {status}
                </div>
              </div>
            } />

            {/* Feature Routes */}
            <Route path="/qr" element={<FrontDeskQR />} />
            <Route path="/memberships" element={<MembershipList />} />
            <Route path="/members" element={<MembersList />} />
            <Route path="/classes" element={<AdminClasses />} />
            <Route path="/payments" element={<AdminPayments />} />
            
            {/* Fallback route - redirects any unknown URL to Home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;