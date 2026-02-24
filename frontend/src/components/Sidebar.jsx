import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, FolderKanban, FlaskConical, Users, BookOpen,
    CalendarDays, Bell, HardDrive, Activity, LogOut, ChevronLeft, ChevronRight, Dna
} from 'lucide-react';

const navItems = [
    {
        section: 'Overview', items: [
            { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/planner', icon: CalendarDays, label: 'Daily Planner' },
        ]
    },
    {
        section: 'Research', items: [
            { to: '/projects', icon: FolderKanban, label: 'Projects' },
            { to: '/experiments', icon: FlaskConical, label: 'Experiments' },
            { to: '/protocols', icon: BookOpen, label: 'Protocols & SOPs' },
        ]
    },
    {
        section: 'Management', items: [
            { to: '/members', icon: Users, label: 'Lab Members' },
            { to: '/reminders', icon: Bell, label: 'Reminders' },
            { to: '/files', icon: HardDrive, label: 'File Repository' },
            { to: '/activity', icon: Activity, label: 'Activity Log' },
        ]
    },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo" onClick={onToggle}>
                <div className="logo-icon"><Dna size={20} color="white" /></div>
                <h1>BioLIMS</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(section => (
                    <div className="nav-section" key={section.section}>
                        <div className="nav-label">{section.section}</div>
                        {section.items.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-user">
                <div className="user-avatar" style={{ background: user?.avatar_color || '#6366f1' }}>
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="sidebar-user-info">
                    <div className="name">{user?.name}</div>
                    <div className="role">{user?.role}</div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={logout} title="Logout" style={{ marginLeft: 'auto' }}>
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
}
