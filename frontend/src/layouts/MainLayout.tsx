import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar onCloseMobile={() => setMobileOpen(false)} />
      
      <div className="main-content-area workspace-light">
        <Topbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="workspace-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
