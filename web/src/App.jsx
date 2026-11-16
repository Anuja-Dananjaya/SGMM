import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar";
import MembershipList from "./pages/MembershipList";
import MembersList from "./pages/MemberList";
import Login from "./pages/Login";
import FrontDeskQR from "./pages/FrontDeskQR";
import AdminClasses from "./pages/AdminClasses";
import AdminPayments from "./pages/AdminPayments";
import TrainerSchedule from "./pages/TrainerSchedule";
import CreateWorkoutPlan from "./pages/CreateWorkoutPlan";
import AddMember from './pages/AddMember';
import "./App.css";

axios.defaults.baseURL = 'http://localhost:5207';

function App() {
  const [status, setStatus] = useState("Checking...");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    axios.get('/api/health')
      .then(response => setStatus(response.data.status))
      .catch(() => setStatus("Error connecting to API"));

    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      setUserName(localStorage.getItem("userName"));
      setUserRole(localStorage.getItem("userRole")); 
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
              setUserRole(localStorage.getItem("userRole")); 
          }} />
      );
  }

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
        <Navbar userName={userName} userRole={userRole} onLogout={handleLogout} />
        
        <div style={{ flex: 1, marginLeft: '260px', padding: '30px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={
                <div>
                  <h1>{userRole} Dashboard</h1>
                  <div style={{ padding: "10px", backgroundColor: status === "Healthy" ? "#28a745" : "#dc3545", color: "white", display: "inline-block", borderRadius: "4px" }}>
                    API Status: {status}
                  </div>
                </div>
              } />

              {/* ADMIN ONLY ROUTES */}
              {userRole === 'Admin' && (
                  <>
                      <Route path="/qr" element={<FrontDeskQR />} />
                      <Route path="/memberships" element={<MembershipList />} />
                      <Route path="/members" element={<MembersList />} />
                      <Route path="/classes" element={<AdminClasses />} />
                      <Route path="/payments" element={<AdminPayments />} />
                      <Route path="/add-member" element={<AddMember/>} />
                  </>
              )}

              {/* STAFF ONLY ROUTES */}
              {userRole === 'Staff' && (
                  <>
                      <Route path="/qr" element={<FrontDeskQR />} />
                      <Route path="/members" element={<MembersList />} />
                      <Route path="/classes" element={<AdminClasses />} />
                      <Route path="/payments" element={<AdminPayments />} />
                  </>
              )}

              {/* TRAINER ONLY ROUTES */}
              {userRole === 'Trainer' && (
                 <>
                      <Route path="/trainer/schedule" element={<TrainerSchedule />} />
                      <Route path="/trainer/workout-plans/create" element={<CreateWorkoutPlan />} />
                  </>
              )}
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;