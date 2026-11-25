import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

const SAMPLE_MEMBERS = [
    { id: 1, fullName: "Kasun Perera", planName: "Platinum Annual", isActive: true },
    { id: 2, fullName: "Nimal Perera", planName: "Gold Monthly", isActive: true },
    { id: 3, fullName: "Tharushi Silva", planName: "Student Plan", isActive: true },
    { id: 4, fullName: "Kavindi Silva", planName: "Platinum Annual", isActive: true },
    { id: 5, fullName: "Ishara Madushan", planName: "Gold Monthly", isActive: false },
];

const INITIAL_ATTENDANCE = [
    { id: 1, memberName: "Kasun Perera", plan: "Platinum Annual", time: "2026-11-18 06:42 AM", method: "QR Scan", status: "Active" },
    { id: 2, memberName: "Tharushi Silva", plan: "Student Plan", time: "2026-11-18 07:15 AM", method: "QR Scan", status: "Active" },
    { id: 3, memberName: "Nimal Perera", plan: "Gold Monthly", time: "2026-11-18 08:05 AM", method: "Manual (Staff)", status: "Active" },
    { id: 4, memberName: "Kavindi Silva", plan: "Platinum Annual", time: "2026-11-18 09:20 AM", method: "QR Scan", status: "Active" },
];

export default function FrontDeskQR() {
    const [qrData, setQrData] = useState({ qrCode: "SGMM-LIVE-CHECKIN-2026" });
    const [isDemoQR, setIsDemoQR] = useState(false);
    const [members, setMembers] = useState(SAMPLE_MEMBERS);
    const [selectedMemberId, setSelectedMemberId] = useState("1");
    const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
    const [search, setSearch] = useState("");
    const [notice, setNotice] = useState(null);

    const fetchQRCode = () => {
        const token = localStorage.getItem("token");
        if (!token || token === "demo-token") {
            setIsDemoQR(true);
            setQrData({ qrCode: `SGMM-LIVE-${new Date().getMinutes().toString().padStart(2, "0")}26` });
            return;
        }

        axios.get('/api/checkin/active-qr', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => {
                setQrData(response.data);
                setIsDemoQR(false);
            })
            .catch(() => {
                setIsDemoQR(true);
                setQrData({ qrCode: "SGMM-LIVE-CHECKIN-2026" });
            });
    };

    useEffect(() => {
        fetchQRCode();
        const intervalId = setInterval(fetchQRCode, 30000);

        const token = localStorage.getItem("token");
        if (token && token !== "demo-token") {
            axios.get('/api/members', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setMembers(res.data);
                        setSelectedMemberId(String(res.data[0].id));
                    }
                })
                .catch(() => { /* keep sample members */ });
        }

        return () => clearInterval(intervalId);
    }, []);

    const handleManualCheckIn = (e) => {
        e.preventDefault();
        const member = members.find(m => String(m.id) === String(selectedMemberId));
        if (!member) return;

        const timeText = new Date().toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
        const status = member.isActive ? "Active" : "Expired";
        setAttendance(prev => [{
            id: Date.now(),
            memberName: member.fullName,
            plan: member.planName || "Standard",
            time: timeText,
            method: "Manual (Staff)",
            status,
        }, ...prev]);
        setNotice(`Recorded manual check-in for ${member.fullName} (${status}).`);
    };

    const filteredAttendance = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return attendance;
        return attendance.filter(a =>
            a.memberName.toLowerCase().includes(q) ||
            a.method.toLowerCase().includes(q) ||
            a.plan.toLowerCase().includes(q)
        );
    }, [attendance, search]);

    return (
        <div className="stack">
            <div className="page-header">
                <div>
                    <h1>Front Desk Check-In &amp; Attendance</h1>
                    <p>Display the live rotating QR kiosk for mobile check-ins or log member attendance manually.</p>
                </div>
                <button className="btn btn-outline" onClick={fetchQRCode}>Refresh QR Now</button>
            </div>

            {notice && <div className="alert alert-success">{notice}</div>}

            <div className="two-col" style={{ alignItems: "start" }}>
                <div className="card stack" style={{ textAlign: "center", alignItems: "center" }}>
                    <div>
                        <h3 style={{ marginBottom: 4 }}>Live Check-In QR Kiosk</h3>
                        <p className="muted" style={{ fontSize: 13 }}>Members scan this code using the SGMM mobile app.</p>
                    </div>

                    <div style={{ padding: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
                        <QRCodeSVG value={qrData.qrCode} size={220} level="H" marginSize={2} />
                    </div>

                    <div className="toolbar" style={{ justifyContent: "center" }}>
                        <span className="badge badge-success" style={{ fontSize: 13, padding: "6px 12px" }}>
                            Code: {qrData.qrCode}
                        </span>
                        {isDemoQR && <span className="badge badge-info">Preview Mode</span>}
                    </div>
                    <p className="muted" style={{ fontSize: 12, margin: 0 }}>Auto-refreshes every 30 seconds</p>
                </div>

                <div className="card stack">
                    <div>
                        <h3 style={{ marginBottom: 4 }}>Manual Staff Check-In &amp; Attendance Log</h3>
                        <p className="muted" style={{ fontSize: 13 }}>Record walk-in attendance and search recent gym visits.</p>
                    </div>

                    <form onSubmit={handleManualCheckIn} className="toolbar" style={{ alignItems: "flex-end" }}>
                        <div className="field" style={{ flex: 1 }}>
                            <label>Select Member</label>
                            <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)}>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.fullName} ({m.planName})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn">Record Manual Check-In</button>
                    </form>

                    <div className="field">
                        <label>Search Attendance Records</label>
                        <input
                            type="text"
                            placeholder="Search by member name, plan or method..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Check-In Time</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendance.length === 0 ? (
                                    <tr><td colSpan="4" className="empty">No attendance records found.</td></tr>
                                ) : filteredAttendance.map(row => (
                                    <tr key={row.id}>
                                        <td>
                                            <strong>{row.memberName}</strong>
                                            <div className="muted" style={{ fontSize: 12 }}>{row.plan}</div>
                                        </td>
                                        <td>{row.time}</td>
                                        <td>
                                            <span className={`badge ${row.method === "QR Scan" ? "badge-info" : "badge-warning"}`}>
                                                {row.method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${row.status === "Active" ? "badge-success" : "badge-danger"}`}>
                                                {row.status}
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
