import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddMember() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    // UI State for toggling the form
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'Member'
    });

    // 1. Fetch users when the page loads
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // 1. Grab the saved login token
            const token = localStorage.getItem('token');
            
            // 2. Attach it to the request headers
            const response = await axios.get('/api/Auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    // 2. Handle Search Filtering
    const filteredUsers = users.filter(user => 
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Open Form for New User
    const handleAddNew = () => {
        setFormData({ fullName: '', email: '', phone: '', password: '', role: 'Member' });
        setEditingUserId(null);
        setShowForm(true);
    };

    // 4. Open Form for Editing Existing User
    const handleEdit = (user) => {
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '', // Leave blank unless they want to change it
            role: user.role || 'Member'
        });
        setEditingUserId(user.id || user.userId);
        setShowForm(true);
    };

    // 5. Submit Form (Handles both Add and Edit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Grab the token and setup the configuration
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            if (editingUserId) {
                // Update existing user securely
                await axios.put(`/api/Auth/users/${editingUserId}`, formData, config);
                alert("User details updated successfully!");
            } else {
                // Register new user securely
                await axios.post('/api/Auth/register', formData, config);
                alert(`${formData.role} successfully registered!`);
            }
            
            setShowForm(false);
            fetchUsers(); // Refresh the table
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Action failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            
            {/* TOP BAR: Search and Add Button */}
            <div style={styles.topBar}>
                <h2 style={{ color: '#333', margin: 0 }}>User Management</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or role..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                    <button onClick={handleAddNew} style={styles.btnAdd}>+ Add New User</button>
                </div>
            </div>

            {/* CONDITIONAL FORM: Shows only when Add or Edit is clicked */}
            {showForm && (
                <div style={styles.card}>
                    <h3 style={{ color: '#28a745', marginTop: 0 }}>
                        {editingUserId ? 'Edit User Details' : 'Register New User'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} style={styles.formGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input style={styles.input} type="text" name="fullName" required value={formData.fullName} onChange={handleChange} />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input style={styles.input} type="email" name="email" required value={formData.email} onChange={handleChange} />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <input style={styles.input} type="tel" name="phone" required value={formData.phone} onChange={handleChange} />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Account Role</label>
                            <select style={styles.input} name="role" value={formData.role} onChange={handleChange}>
                                <option value="Member">Gym Member</option>
                                <option value="Trainer">Personal Trainer</option>
                                <option value="Staff">Front Desk Staff</option>
                                <option value="Admin">Administrator</option>
                            </select>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>{editingUserId ? 'New Password (leave blank to keep current)' : 'Temporary Password'}</label>
                            <input style={styles.input} type="text" name="password" required={!editingUserId} value={formData.password} onChange={handleChange} />
                        </div>

                        <div style={styles.formActions}>
                            <button type="button" onClick={() => setShowForm(false)} style={styles.btnCancel}>Cancel</button>
                            <button type="submit" disabled={loading} style={styles.btnPrimary}>
                                {loading ? 'Saving...' : 'Save User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* DATA TABLE: Shows all users */}
            <div style={{ ...styles.card, marginTop: '20px', overflowX: 'auto' }}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHead}>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Phone</th>
                            <th style={styles.th}>Role</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr key={index} style={styles.tableRow}>
                                    <td style={styles.td}>{user.fullName}</td>
                                    <td style={styles.td}>{user.email}</td>
                                    <td style={styles.td}>{user.phone}</td>
                                    <td style={styles.td}>
                                        <span style={getRoleBadgeStyle(user.role)}>{user.role}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleEdit(user)} style={styles.btnEdit}>Edit</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

// Visual badge styling based on user role
const getRoleBadgeStyle = (role) => {
    let bgColor = '#6c757d'; // default grey
    if (role === 'Admin') bgColor = '#dc3545'; // red
    if (role === 'Trainer') bgColor = '#17a2b8'; // blue
    if (role === 'Staff') bgColor = '#fd7e14'; // orange
    if (role === 'Member') bgColor = '#28a745'; // green

    return {
        backgroundColor: bgColor,
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
    };
};

const styles = {
    container: { width: '100%' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    searchInput: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '300px', fontSize: '15px' },
    btnAdd: { backgroundColor: '#28a745', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    card: { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column' },
    label: { fontWeight: 'bold', marginBottom: '5px', color: '#444', fontSize: '14px' },
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '15px' },
    formActions: { gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
    btnCancel: { backgroundColor: '#f8f9fa', color: '#333', padding: '10px 20px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' },
    btnPrimary: { backgroundColor: '#28a745', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHead: { backgroundColor: '#f4f6f8', borderBottom: '2px solid #ddd' },
    th: { padding: '12px', textAlign: 'left', color: '#333' },
    tableRow: { borderBottom: '1px solid #eee' },
    td: { padding: '12px', color: '#555' },
    btnEdit: { backgroundColor: 'transparent', color: '#007bff', border: '1px solid #007bff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }
};