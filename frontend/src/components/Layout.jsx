import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}
