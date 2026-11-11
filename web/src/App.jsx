import { useEffect, useState } from "react";
import axios from "axios";
import MembershipList from "./components/MembershipList"; // Import the new component
import "./App.css";

function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    axios.get('http://localhost:5207/api/health')
      .then(response => setStatus(response.data.status))
      .catch(() => setStatus("Error connecting to API"));
  }, []);

  return (
    <div>
      <h1>Gym Management System</h1>
      <div style={{ padding: "10px", backgroundColor: status === "Healthy" ? "green" : "red" }}>
        API Status: {status}
      </div>

      {/* Render the Membership List */}
      <MembershipList />
      
    </div>
  );
}

export default App;