import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ userName, onLogout }) {
    const location = useLocation();

    // Helper function to highlight the active tab
    const getLinkStyle = (path) => ({
        color: location.pathname === path ? '#28a745' : '#fff',
        textDecoration: 'none',
        fontWeight: 'bold',
        padding: '10px'
    });

    return (
        <nav style={styles.nav}>
            <div style={styles.brand}>
                <h2 style={{ margin: 0, color: '#fff' }}>SGMM Admin</h2>
            </div>
            
            <div style={styles.links}>
                <Link to="/" style={getLinkStyle('/')}>Home</Link>
                <Link to="/qr" style={getLinkStyle('/qr')}>Front Desk QR</Link>
                <Link to="/memberships" style={getLinkStyle('/memberships')}>Memberships</Link>
                <Link to="/members" style={getLinkStyle('/members')}>Members</Link>
                <Link to="/classes" style={getLinkStyle('/classes')}>Classes</Link>
                <Link to="/payments" style={getLinkStyle('/payments')}>Payments</Link>
            </div>

            <div style={styles.userSection}>
                <span style={styles.userName}>Hi, {userName}</span>
                <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: '15px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    brand: { display: 'flex', alignItems: 'center' },
    links: { display: 'flex', gap: '20px' },
    userSection: { display: 'flex', alignItems: 'center', gap: '15px' },
    userName: { color: '#ccc' },
    logoutBtn: { 
        backgroundColor: '#dc3545', 
        color: '#fff', 
        border: 'none', 
        padding: '8px 15px', 
        borderRadius: '4px', 
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};