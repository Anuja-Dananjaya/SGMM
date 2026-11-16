import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Simple inline icons (no extra dependency)
const Icon = ({ d }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const ICONS = {
    dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    qr: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 3h3m3 0v4m-6 0h3',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    userPlus: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6m3-3h-6',
    card: 'M2 5h20v14H2V5zm0 5h20',
    calendar: 'M3 4h18v18H3V4zm13-2v4M8 2v4M3 10h18',
    money: 'M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-14v4l3 2',
    dumbbell: 'M6 6v12M18 6v12M2 9v6M22 9v6M6 12h12',
};

// One place to define the menu per role.
// (Trainer is intentionally not a login role — the requirements define Admin, Staff and Member only.)
const MENU = {
    Admin: [
        { section: 'Overview' },
        { to: '/', label: 'Dashboard', icon: 'dashboard' },
        { section: 'Gym Operations' },
        { to: '/qr', label: 'Front Desk QR', icon: 'qr' },
        { to: '/members', label: 'Members', icon: 'users' },
        { to: '/memberships', label: 'Membership Plans', icon: 'card' },
        { to: '/classes', label: 'Classes', icon: 'calendar' },
        { to: '/payments', label: 'Payments', icon: 'money' },
        { section: 'Administration' },
        { to: '/add-member', label: 'User Management', icon: 'userPlus' },
    ],
    Staff: [
        { section: 'Overview' },
        { to: '/', label: 'Dashboard', icon: 'dashboard' },
        { section: 'Gym Operations' },
        { to: '/qr', label: 'Front Desk QR', icon: 'qr' },
        { to: '/members', label: 'Members', icon: 'users' },
        { to: '/classes', label: 'Classes', icon: 'calendar' },
        { to: '/payments', label: 'Payments', icon: 'money' },
    ],
    // Legacy role still present in the database/backend; kept so existing accounts can still sign in.
    Trainer: [
        { section: 'Overview' },
        { to: '/', label: 'Dashboard', icon: 'dashboard' },
        { section: 'Training' },
        { to: '/trainer/schedule', label: 'My Schedule', icon: 'clock' },
        { to: '/trainer/workout-plans/create', label: 'Workout Plans', icon: 'dumbbell' },
    ],
};

export default function Navbar({ userName, userRole, onLogout }) {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const items = MENU[userRole] || MENU.Staff.slice(0, 2);

    const current = items.find(i => i.to === location.pathname);

    return (
        <>
            <div className="topbar">
                <button onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
                <strong>{current ? current.label : 'SGMM'}</strong>
            </div>

            <div className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-logo">S</div>
                    <div>
                        <div className="brand-title">SGMM</div>
                        <div className="brand-sub">Gym Management</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {items.map((item, i) =>
                        item.section ? (
                            <div key={i} className="nav-section">{item.section}</div>
                        ) : (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end
                                onClick={() => setOpen(false)}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon d={ICONS[item.icon]} />
                                {item.label}
                            </NavLink>
                        )
                    )}
                </nav>

                <div className="sidebar-user">
                    <div className="user-row">
                        <div className="user-avatar">{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
                        <div>
                            <div className="user-name">{userName}</div>
                            <div className="user-role">{userRole}</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={onLogout}>Log out</button>
                </div>
            </aside>
        </>
    );
}
