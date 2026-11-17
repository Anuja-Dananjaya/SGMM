import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AssignMemberForm from "./AssignMemberForm";
import EditMembershipForm from "./EditMembershipForm";

const fmt = (d) => new Date(d).toLocaleDateString();
const dateOnly = (d) => String(d).slice(0, 10);

// Returns [from, to] as yyyy-mm-dd strings for the quick period presets (based on the membership start date).
function presetRange(period) {
    const today = new Date();
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    if (period === "week") {
        const start = new Date(today);
        start.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return [iso(start), iso(end)];
    }
    if (period === "month") {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return [iso(start), iso(end)];
    }
    return ["", ""];
}

export default function MembersList() {
    const [members, setMembers] = useState([]);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState(null);

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");      // all | active | inactive
    const [period, setPeriod] = useState("all");      // all | week | month | custom
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const userRole = localStorage.getItem("userRole");
    const isAdmin = userRole === "Admin";
    const isAdminOrStaff = isAdmin || userRole === "Staff";

    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers = () => {
        axios.get('/api/members', { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            .then(response => setMembers(response.data))
            .catch(err => {
                console.error("Error fetching members:", err);
                setError("Failed to load memberships.");
            });
    };

    const handleCancelPlan = (id) => {
        if (!window.confirm("Are you sure you want to cancel this membership?")) return;
        axios.put(`/api/members/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            .then(() => fetchMembers())
            .catch(() => setError("Failed to cancel membership."));
    };

    const handleSaveSuccess = () => {
        setIsFormOpen(false);
        setMemberToEdit(null);
        fetchMembers();
    };

    const handlePeriodChange = (value) => {
        setPeriod(value);
        if (value === "week" || value === "month") {
            const [from, to] = presetRange(value);
            setFromDate(from);
            setToDate(to);
        } else if (value === "all") {
            setFromDate("");
            setToDate("");
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return members.filter(m => {
            if (q && !(
                m.fullName?.toLowerCase().includes(q) ||
                m.email?.toLowerCase().includes(q) ||
                m.planName?.toLowerCase().includes(q)
            )) return false;

            if (status === "active" && !m.isActive) return false;
            if (status === "inactive" && m.isActive) return false;

            const start = dateOnly(m.startDate);
            if (fromDate && start < fromDate) return false;
            if (toDate && start > toDate) return false;
            return true;
        });
    }, [members, search, status, fromDate, toDate]);

    const hasFilters = search || status !== "all" || period !== "all" || fromDate || toDate;
    const resetFilters = () => {
        setSearch(""); setStatus("all"); setPeriod("all"); setFromDate(""); setToDate("");
    };

    const showTable = !isFormOpen && !memberToEdit;

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Assign Memberships</h1>
                    <p>Assign membership plans to members and track their status.</p>
                </div>
                {isAdminOrStaff && showTable && (
                    <button className="btn" onClick={() => { setError(null); setIsFormOpen(true); }}>+ Assign Membership</button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {isFormOpen && (
                <AssignMemberForm onSave={handleSaveSuccess} onCancel={() => setIsFormOpen(false)} />
            )}

            {memberToEdit && (
                <EditMembershipForm
                    member={memberToEdit}
                    onSave={handleSaveSuccess}
                    onCancel={() => setMemberToEdit(null)}
                />
            )}

            {showTable && (
                <>
                    <div className="card filters">
                        <div className="field filter-search">
                            <label>Search</label>
                            <input
                                type="text"
                                placeholder="Name, email or plan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Started</label>
                            <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
                                <option value="all">Any time</option>
                                <option value="week">This week</option>
                                <option value="month">This month</option>
                                <option value="custom">Custom range</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>From</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => { setFromDate(e.target.value); setPeriod("custom"); }}
                            />
                        </div>
                        <div className="field">
                            <label>To</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setPeriod("custom"); }}
                            />
                        </div>
                        {hasFilters && (
                            <button className="btn btn-outline" onClick={resetFilters}>Clear</button>
                        )}
                    </div>

                    <div className="muted">Showing {filtered.length} of {members.length} memberships</div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Plan</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    {isAdminOrStaff && <th style={{ width: 170 }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdminOrStaff ? 6 : 5} className="empty">
                                            {members.length === 0 ? "No memberships have been assigned yet." : "No memberships match your filters."}
                                        </td>
                                    </tr>
                                ) : filtered.map(member => (
                                    <tr key={member.id}>
                                        <td>
                                            <strong>{member.fullName}</strong>
                                            <div className="muted" style={{ fontSize: 13 }}>{member.email}</div>
                                        </td>
                                        <td>{member.planName}</td>
                                        <td>{fmt(member.startDate)}</td>
                                        <td>{fmt(member.endDate)}</td>
                                        <td>
                                            <span className={`badge ${member.isActive ? "badge-success" : "badge-danger"}`}>
                                                {member.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        {isAdminOrStaff && (
                                            <td>
                                                <div className="toolbar">
                                                    {isAdmin && (
                                                        <button className="btn btn-outline btn-sm" onClick={() => { setError(null); setMemberToEdit(member); }}>Edit</button>
                                                    )}
                                                    {member.isActive && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleCancelPlan(member.id)}>Cancel Plan</button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
