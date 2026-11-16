import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ userName, userRole, onLogout }) {
    const location = useLocation();

    const getLinkStyle = (path) => ({
        color: location.pathname === path ? '#28a745' : '#ccc',
        textDecoration: 'none',
        fontWeight: 'bold',
        padding: '12px 20px',
        display: 'block',
        backgroundColor: location.pathname === path ? '#2a2a2a' : 'transparent',
        borderLeft: location.pathname === path ? '4px solid #28a745' : '4px solid transparent',
        transition: 'all 0.2s ease-in-out'
    });

    return (
        <nav style={styles.sidebar}>
            <div style={styles.brand}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '24px' }}>SGMM Portal</h2>
                <span style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>{userRole} Portal</span>
            </div>
            
            <div style={styles.links}>
                <Link to="/" style={getLinkStyle('/')}>Dashboard</Link>
                
                {/* ADMIN ONLY LINKS */}
                {userRole === 'Admin' && (
                    <>
                        <Link to="/qr" style={getLinkStyle('/qr')}>Front Desk</Link>
                        <Link to="/memberships" style={getLinkStyle('/memberships')}>Memberships</Link>
                        <Link to="/members" style={getLinkStyle('/members')}>Manage Members</Link>
                        <Link to="/add-member" style={getLinkStyle('/add-member')}>User Management</Link>
                        <Link to="/classes" style={getLinkStyle('/classes')}>Classes</Link>
                        <Link to="/payments" style={getLinkStyle('/payments')}>Payments</Link>
                    </>
                )}

                {/* STAFF ONLY LINKS */}
                {userRole === 'Staff' && (
                    <>
                        <Link to="/qr" style={getLinkStyle('/qr')}>Front Desk QR</Link>
                        <Link to="/members" style={getLinkStyle('/members')}>View Members</Link>
                        <Link to="/classes" style={getLinkStyle('/classes')}>Classes</Link>
                        <Link to="/payments" style={getLinkStyle('/payments')}>Payments</Link>
                    </>
                )}

                {/* TRAINER ONLY LINKS */}
                {userRole === 'Trainer' && (
                    <>
                        <Link to="/trainer/schedule" style={getLinkStyle('/trainer/schedule')}>My Schedule</Link>
                        <Link to="/trainer/workout-plans/create" style={getLinkStyle('/trainer/workout-plans/create')}>Create Plan</Link>
                    </>
                )}
            </div>

            <div style={styles.userSection}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={styles.userName}>{userName}</span>
                        <span style={styles.userRoleText}>{userRole}</span>
                    </div>
                </div>
                <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
            </div>
        </nav>
    );
}

const styles = {
    sidebar: {
        width: '260px',
        backgroundColor: '#1a1a1a',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        position: 'fixed',
        left: 0,
        top: 0
    },
    brand: { padding: '30px 20px', borderBottom: '1px solid #333', display: 'flex', flexDirection: 'column' },
    links: { flex: 1, paddingTop: '20px', overflowY: 'auto' },
    userSection: { padding: '20px', borderTop: '1px solid #333', backgroundColor: '#111' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' },
    avatar: { width: '40px', height: '40px', backgroundColor: '#28a745', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' },
    userName: { color: '#fff', fontWeight: 'bold', fontSize: '15px' },
    userRoleText: { color: '#888', fontSize: '12px' },
    logoutBtn: { width: '100%', backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }
};