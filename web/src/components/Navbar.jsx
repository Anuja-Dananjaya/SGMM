import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ userName, userRole, onLogout }) {
    const location = useLocation();

    const getLinkStyle = (path) => ({
        color: location.pathname === path ? '#28a745' : '#fff',
        textDecoration: 'none',
        fontWeight: 'bold',
        padding: '10px'
    });

    return (
        <nav style={styles.nav}>
            <div style={styles.brand}>
                {/* Dynamically display role type */}
                <h2 style={{ margin: 0, color: '#fff' }}>SGMM {userRole}</h2>
            </div>
            
            <div style={styles.links}>
                <Link to="/" style={getLinkStyle('/')}>Home</Link>
                
                {/* ADMIN ONLY LINKS */}
                {userRole === 'Admin' && (
                    <>
                        <Link to="/qr" style={getLinkStyle('/qr')}>Front Desk</Link>
                        <Link to="/memberships" style={getLinkStyle('/memberships')}>Memberships</Link>
                        <Link to="/members" style={getLinkStyle('/members')}>Members</Link>
                        <Link to="/classes" style={getLinkStyle('/classes')}>Classes</Link>
                        <Link to="/payments" style={getLinkStyle('/payments')}>Payments</Link>
                    </>
                )}

                {/* TRAINER ONLY LINKS */}
                {userRole === 'Trainer' && (
                    <>
                       <>
                        <Link to="/trainer/schedule" style={getLinkStyle('/trainer/schedule')}>My Schedule</Link>
                        <Link to="/trainer/workout-plans/create" style={getLinkStyle('/trainer/workout-plans/create')}>Create Plan</Link>
                    </>
                    </>
                )}
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
        flexWrap: 'wrap', // FIX: Allows links to wrap to the next line instead of squishing
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: '15px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        gap: '15px' // FIX: Adds spacing between wrapped elements
    },
    brand: { display: 'flex', alignItems: 'center' },
    links: { display: 'flex', flexWrap: 'wrap', gap: '15px' }, // FIX: Allows inner links to wrap cleanly
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