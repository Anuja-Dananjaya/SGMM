import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EMPTY_FORM = { fullName: '', email: '', phone: '', password: '', role: 'Member' };
const ROLE_BADGE = { Admin: 'badge-danger', Staff: 'badge-warning', Trainer: 'badge-info', Member: 'badge-success' };
const VALID_ROLES = ['Member', 'Trainer', 'Staff', 'Admin'];

export default function AddMember() {
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Admin';

    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

    const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/Auth/users', authConfig());
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setMessage({ type: 'error', text: 'Failed to load users.' });
        }
    };

    // Staff only manage Member accounts; Admin manages everyone (Admin, Staff, Member).
    const visibleUsers = users.filter(u => isAdmin || u.role === 'Member');
    const q = searchQuery.toLowerCase();
    const filteredUsers = visibleUsers.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAddNew = () => {
        setFormData(EMPTY_FORM);
        setEditingUserId(null);
        setMessage(null);
        setShowForm(true);
    };

    const handleEdit = (user) => {
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            role: user.role || 'Member',
        });
        setEditingUserId(user.id || user.userId);
        setMessage(null);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!VALID_ROLES.includes(formData.role)) {
            setMessage({ type: 'error', text: 'Please choose a valid role (Member, Trainer, Staff or Admin).' });
            return;
        }
        setLoading(true);
        try {
            if (editingUserId) {
                await axios.put(`/api/Auth/users/${editingUserId}`, formData, authConfig());
                setMessage({ type: 'success', text: 'User details updated successfully.' });
            } else {
                await axios.post('/api/Auth/register', formData, authConfig());
                setMessage({ type: 'success', text: `${formData.role} registered successfully.` });
            }
            setShowForm(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Action failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>{isAdmin ? 'User Management' : 'Member Registration'}</h1>
                    <p>{isAdmin ? 'Register and manage members, trainers, staff and administrators.' : 'Register new members and update their details.'}</p>
                </div>
                <div className="toolbar">
                    <input
                        type="text"
                        placeholder="Search name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: 260 }}
                    />
                    <button className="btn" onClick={handleAddNew}>+ {isAdmin ? 'Add User' : 'Add Member'}</button>
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}

            {showForm && (
                <div className="card">
                    <h3>{editingUserId ? 'Edit details' : isAdmin ? 'Register new user' : 'Register new member'}</h3>
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="field">
                            <label>Full Name</label>
                            <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label>Email Address</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label>Account Role</label>
                            {isAdmin ? (
                                <select name="role" value={formData.role} onChange={handleChange}>
                                    <option value="Member">Member</option>
                                    <option value="Trainer">Trainer</option>
                                    <option value="Staff">Staff</option>
                                    <option value="Admin">Admin</option>
                                    {/* Safety net: any unexpected role is still shown when editing so it can be reassigned. */}
                                    {!VALID_ROLES.includes(formData.role) && (
                                        <option value={formData.role} disabled>{formData.role} (unknown – choose a role)</option>
                                    )}
                                </select>
                            ) : (
                                <input type="text" value="Member" disabled />
                            )}
                        </div>
                        <div className="field field-wide">
                            <label>{editingUserId ? 'New Password (leave blank to keep current)' : 'Temporary Password'}</label>
                            <input type="text" name="password" required={!editingUserId} value={formData.password} onChange={handleChange} />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th style={{ width: 90 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id || user.userId || user.email}>
                                    <td><strong>{user.fullName}</strong></td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || '—'}</td>
                                    <td><span className={`badge ${ROLE_BADGE[user.role] || 'badge-info'}`}>{user.role}</span></td>
                                    <td><button className="btn btn-outline btn-sm" onClick={() => handleEdit(user)}>Edit</button></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="empty">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
