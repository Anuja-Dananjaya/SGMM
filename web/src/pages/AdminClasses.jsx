import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminClasses() {
    const [classes, setClasses] = useState([]);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        trainerId: '1', // Defaulting to our dummy trainer
        className: '',
        description: '',
        classDate: '',
        startTime: '',
        endTime: '',
        capacity: ''
    });

    // 1. Fetch Classes on Component Mount
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using the global baseURL configuration
            const response = await axios.get('/api/Classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error("Error fetching classes", error);
        }
    };

    // 2. Handle Form Input Changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Submit New Class
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            
            const payload = {
                trainerId: parseInt(formData.trainerId),
                className: formData.className,
                description: formData.description,
                classDate: formData.classDate,
                // Append :00 to satisfy C# TimeSpan requirement (HH:mm:ss)
                startTime: formData.startTime + ':00',
                endTime: formData.endTime + ':00',
                capacity: parseInt(formData.capacity)
            };

            // Using the global baseURL configuration
            await axios.post('/api/Classes', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Class created successfully!');
            fetchClasses(); // Refresh the list
            
            // Clear form
            setFormData({
                trainerId: '1',
                className: '',
                description: '',
                classDate: '',
                startTime: '',
                endTime: '',
                capacity: ''
            });

        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.message || 'Failed to create class.');
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Classes Management</h1>
            
            <div style={styles.grid}>
                {/* LEFT COLUMN: Create Class Form */}
                <div style={styles.card}>
                    <h2>Create New Class</h2>
                    {message && <p style={styles.message}>{message}</p>}
                    
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <label>Trainer ID</label>
                        <input type="number" name="trainerId" value={formData.trainerId} onChange={handleChange} required style={styles.input} />

                        <label>Class Name</label>
                        <input type="text" name="className" value={formData.className} onChange={handleChange} required style={styles.input} />

                        <label>Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} style={styles.input} />

                        <label>Class Date</label>
                        <input type="date" name="classDate" value={formData.classDate} onChange={handleChange} required style={styles.input} />

                        <div style={styles.row}>
                            <div style={styles.halfWidth}>
                                <label>Start Time</label>
                                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={styles.halfWidth}>
                                <label>End Time</label>
                                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required style={styles.input} />
                            </div>
                        </div>

                        <label>Capacity</label>
                        <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required style={styles.input} />

                        <button type="submit" style={styles.button}>Create Class</button>
                    </form>
                </div>

                {/* RIGHT COLUMN: Existing Classes List */}
                <div style={styles.card}>
                    <h2>Upcoming Classes</h2>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Time</th>
                                <th style={styles.th}>Bookings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map(c => (
                                <tr key={c.classId}>
                                    <td style={styles.td}>{c.className}</td>
                                    <td style={styles.td}>{new Date(c.classDate).toLocaleDateString()}</td>
                                    <td style={styles.td}>{c.startTime} - {c.endTime}</td>
                                    <td style={styles.td}>{c.enrolledCount} / {c.capacity}</td>
                                </tr>
                            ))}
                            {classes.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={styles.td}>No classes scheduled yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '10px' },
    grid: { display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' },
    card: { flex: 1, minWidth: '300px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    row: { display: 'flex', gap: '10px' },
    halfWidth: { flex: 1, display: 'flex', flexDirection: 'column' },
    input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
    button: { padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
    message: { color: '#0056b3', backgroundColor: '#cce5ff', padding: '10px', borderRadius: '4px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa' },
    td: { padding: '10px', borderBottom: '1px solid #ddd' }
};