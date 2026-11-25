import { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

export default function FrontDeskQR() {
    const [qrData, setQrData] = useState(null);
    const [qrError, setQrError] = useState(null);
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [attendance, setAttendance] = useState([]);
    const [loadingLog, setLoadingLog] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Attendance search & date range filters
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    const fetchQRCode = () => {
        axios.get('/api/checkin/active-qr', { headers: authHeaders() })
            .then(response => {
                setQrData(response.data);
                setQrError(null);
            })
            .catch(err => {
                console.error("Failed to fetch QR code:", err);
                setQrError("Unable to load live Check-In QR code. Ensure the backend API is running.");
            });
    };

    const fetchMembers = () => {
        axios.get('/api/members', { headers: authHeaders() })
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                setMembers(list);
                if (list.length > 0 && !selectedMemberId) {
                    setSelectedMemberId(String(list[0].id));
                }
            })
            .catch(err => console.error("Failed to load members:", err));
    };

    const fetchAttendance = (filters = {}) => {
        setLoadingLog(true);
        const params = {};
        if (filters.search ?? search) params.search = filters.search ?? search;
        if (filters.startDate ?? startDate) params.startDate = filters.startDate ?? startDate;
        if (filters.endDate ?? endDate) params.endDate = filters.endDate ?? endDate;

        axios.get('/api/checkin/all', { headers: authHeaders(), params })
            .then(res => setAttendance(Array.isArray(res.data) ? res.data : []))
            .catch(err => {
                console.error("Failed to load attendance log:", err);
                setNotice({ type: "error", text: "Failed to load attendance records." });
            })
            .finally(() => setLoadingLog(false));
    };

    useEffect(() => {
        fetchQRCode();
        fetchMembers();
        fetchAttendance({});

        const intervalId = setInterval(fetchQRCode, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const handleManualCheckIn = async (e) => {
        e.preventDefault();
        if (!selectedMemberId) return;

        setNotice(null);
        setSubmitting(true);
        try {
            const response = await axios.post(
                '/api/checkin/manual',
                { memberId: parseInt(selectedMemberId, 10) },
                { headers: authHeaders() }
            );
            setNotice({ type: "success", text: response.data.message || "Manual check-in recorded." });
            fetchAttendance();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.Message || "Failed to record manual check-in.";
            setNotice({ type: "error", text: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchAttendance();
    };

    const handleClearFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        fetchAttendance({ search: "", startDate: "", endDate: "" });
    };

    const formatDateTime = (iso) => {
        if (!iso) return "—";
        const safe = iso.endsWith("Z") ? iso : `${iso}Z`;
        return new Date(safe).toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Front Desk Check-In &amp; Attendance</h1>
                    <p>Display the live rotating QR kiosk for mobile check-ins or log member attendance manually.</p>
                </div>
                <button className="btn btn-outline" onClick={fetchQRCode}>Refresh QR Now</button>
            </div>

            {notice && <div className={`alert alert-${notice.type}`}>{notice.text}</div>}

            <div className="two-col" style={{ alignItems: "start" }}>
                <div className="card stack" style={{ textAlign: "center", alignItems: "center" }}>
                    <div>
                        <h3 style={{ marginBottom: 4 }}>Live Check-In QR Kiosk</h3>
                        <p className="muted" style={{ fontSize: 13 }}>Members scan this code using the SGMM mobile app.</p>
                    </div>

                    {qrError && <div className="alert alert-error" style={{ width: "100%" }}>{qrError}</div>}

                    {qrData ? (
                        <>
                            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
                                <QRCodeSVG value={qrData.qrCode} size={220} level="H" marginSize={2} />
                            </div>
                            <span className="badge badge-success" style={{ fontSize: 13, padding: "6px 12px" }}>
                                Code: {qrData.qrCode}
                            </span>
                            <p className="muted" style={{ fontSize: 12, margin: 0 }}>Auto-refreshes every 30 seconds</p>
                        </>
                    ) : !qrError ? (
                        <p className="muted">Generating secure code...</p>
                    ) : null}
                </div>

                <div className="card stack">
                    <div>
                        <h3 style={{ marginBottom: 4 }}>Manual Staff Check-In &amp; Attendance Log</h3>
                        <p className="muted" style={{ fontSize: 13 }}>Record walk-in attendance and search gym check-in history.</p>
                    </div>

                    <form onSubmit={handleManualCheckIn} className="toolbar" style={{ alignItems: "flex-end" }}>
                        <div className="field" style={{ flex: 1, minWidth: 200 }}>
                            <label>Select Member</label>
                            <select
                                value={selectedMemberId}
                                onChange={e => setSelectedMemberId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Member --</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.fullName} — {m.planName} ({m.isActive ? "Active" : "Inactive"})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn" disabled={submitting || !selectedMemberId}>
                            {submitting ? "Recording..." : "Record Manual Check-In"}
                        </button>
                    </form>

                    <form onSubmit={handleFilterSubmit} className="filters" style={{ padding: 0 }}>
                        <div className="field filter-search">
                            <label>Search Member / Plan</label>
                            <input
                                type="text"
                                placeholder="Name, email or plan..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>From</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>To</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-outline">Filter</button>
                        {(search || startDate || endDate) && (
                            <button type="button" className="btn btn-outline" onClick={handleClearFilters}>Clear</button>
                        )}
                    </form>

                    <div className="muted" style={{ fontSize: 13 }}>
                        Showing {attendance.length} attendance {attendance.length === 1 ? "record" : "records"}
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Check-In Date &amp; Time</th>
                                    <th>Membership</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingLog ? (
                                    <tr><td colSpan="3" className="empty">Loading attendance records...</td></tr>
                                ) : attendance.length === 0 ? (
                                    <tr><td colSpan="3" className="empty">No attendance records found.</td></tr>
                                ) : attendance.map(row => (
                                    <tr key={row.id}>
                                        <td>
                                            <strong>{row.memberName}</strong>
                                            <div className="muted" style={{ fontSize: 12 }}>{row.email} · {row.planName}</div>
                                        </td>
                                        <td>{formatDateTime(row.checkInTime)}</td>
                                        <td>
                                            <span className={`badge ${row.isMembershipActive ? "badge-success" : "badge-danger"}`}>
                                                {row.isMembershipActive ? "Active" : "Expired"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
