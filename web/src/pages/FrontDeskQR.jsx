import { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

export default function FrontDeskQR() {
    const [qrData, setQrData] = useState(null);
    const [error, setError] = useState(null);

    const fetchQRCode = () => {
        const token = localStorage.getItem("token");

        axios.get('/api/checkin/active-qr', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                setQrData(response.data);
                setError(null);
            })
            .catch(err => {
                console.error("Failed to fetch QR code", err);
                setError("Unable to load secure Check-In Code.");
            });
    };

    useEffect(() => {
        // Fetch immediately on load
        fetchQRCode();

        // Set up the interval to refresh exactly every 30 seconds
        const intervalId = setInterval(() => {
            fetchQRCode();
        }, 30000);

        // Cleanup interval if the component unmounts
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div style={{
            marginTop: "2rem",
            padding: "2rem",
            border: "1px solid #444",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "#111"
        }}>
            <h2>Live Check-In Scanner</h2>
            <p style={{ color: "#aaa", marginBottom: "2rem" }}>
                Members: Scan this code using your SGMM mobile app.
            </p>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {qrData ? (
                <div style={{
                    display: "inline-block",
                    padding: "1rem",
                    backgroundColor: "white",
                    borderRadius: "8px"
                }}>
                    <QRCodeSVG
                        value={qrData.qrCode}
                        size={250}
                        level={"H"} // High error correction
                        marginSize={2}
                    />
                </div>
            ) : (
                <p>Generating secure code...</p>
            )}

            {qrData && (
                <div style={{ marginTop: "1rem", color: "#28a745" }}>
                    <p style={{ margin: "0.5rem 0", fontSize: "1.2rem", fontWeight: "bold" }}>
                        Code: {qrData.qrCode}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#888" }}>
                        Auto-refreshes every 30 seconds
                    </p>
                </div>
            )}
        </div>
    );
}