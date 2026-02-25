import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="app-layout">
            {/* Mobile top bar with hamburger */}
            {isMobile && (
                <div className="mobile-topbar">
                    <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
                        <Menu size={22} />
                    </button>
                    <span className="mobile-topbar-title">🧬 BioLIMS</span>
                </div>
            )}

            {/* Mobile overlay */}
            {isMobile && mobileOpen && (
                <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
            )}

            <Sidebar
                collapsed={isMobile ? false : collapsed}
                onToggle={() => isMobile ? setMobileOpen(false) : setCollapsed(!collapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                isMobile={isMobile}
            />
            <main className={`app-main ${collapsed && !isMobile ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile-main' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}
