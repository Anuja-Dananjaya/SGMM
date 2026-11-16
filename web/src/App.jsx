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
import TrainerSchedule from './components/TrainerSchedule';
import "./App.css";

axios.defaults.baseURL = 'http://localhost:5207';

function App() {
  const [status, setStatus] = useState("Checking...");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(""); // 1. Added state for user role

  useEffect(() => {
    axios.get('/api/health')
      .then(response => setStatus(response.data.status))
      .catch(() => setStatus("Error connecting to API"));

    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      setUserName(localStorage.getItem("userName"));
      setUserRole(localStorage.getItem("userRole")); // 2. Load role from storage
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
    setUserRole("");
  };

  if (!isAuthenticated) {
      return (
          <Login onLoginSuccess={() => {
              setIsAuthenticated(true);
              setUserName(localStorage.getItem("userName"));
              setUserRole(localStorage.getItem("userRole")); // 3. Set role on login
          }} />
      );
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
        {/* 4. Pass userRole down to the Navbar */}
        <Navbar userName={userName} userRole={userRole} onLogout={handleLogout} />
        
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={
              <div>
                <h1>{userRole === 'Trainer' ? 'Trainer Dashboard' : 'Admin Dashboard'}</h1>
                <div style={{ padding: "10px", backgroundColor: status === "Healthy" ? "#28a745" : "#dc3545", color: "white", display: "inline-block", borderRadius: "4px" }}>
                  API Status: {status}
                </div>
              </div>
            } />

            {/* Admin Routes */}
            {userRole === 'Admin' && (
                <>
                    <Route path="/qr" element={<FrontDeskQR />} />
                    <Route path="/memberships" element={<MembershipList />} />
                    <Route path="/members" element={<MembersList />} />
                    <Route path="/classes" element={<AdminClasses />} />
                    <Route path="/payments" element={<AdminPayments />} />
                </>
            )}

            {/* Trainer Routes */}
            {userRole === 'Trainer' && (
                <Route path="/trainer/schedule" element={<TrainerSchedule />} />
            )}
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;