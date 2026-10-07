import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${mobileOpen ? 'mobile-open' : ''}`}>
      <Sidebar />
      <div className="main-content-area">
        <Topbar />
        <div className="workspace-scroll">
          {children}
        </div>
      </div>
      
      {/* Mobile toggle button if needed */}
      <div 
        style={{position: 'fixed', bottom: '16px', right: '16px', zIndex: 999, display: 'none'}} 
        className="mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        Menu
      </div>
    </div>
  );
}
