import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Replace 7143 with the actual HTTPS port from your launchSettings.json
    axios.get('http://localhost:5207/api/health')
      .then(response => {
        setHealth(response.data)
      })
      .catch(err => {
        setError(err.message)
      })
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Gym Management System</h1>
      <h2>System Health Check</h2>
      
      {error && (
        <div style={{ color: 'red', border: '1px solid red', padding: '1rem' }}>
          <p><strong>Connection Error:</strong> {error}</p>
          <p>Ensure your ASP.NET backend is running and the port in App.jsx matches launchSettings.json.</p>
        </div>
      )}
      
      {health ? (
        <div style={{ border: '1px solid green', padding: '1rem', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
          <p><strong>API Status:</strong> {health.status}</p>
          <p><strong>Database:</strong> {health.database}</p>
          <p><strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}</p>
        </div>
      ) : (
        !error && <p>Loading health status...</p>
      )}
    </div>
  )
}

export default App