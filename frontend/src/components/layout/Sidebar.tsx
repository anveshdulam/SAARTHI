import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo" style={{fontSize: '1rem'}}>SAARTHI</div>
        <div className="metadata" style={{marginLeft: 'auto'}}>Beta</div>
      </div>
      
      <div className="sidebar-content">
        <div className="nav-group">
          <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>Today</Link>
          <Link to="/plans" className={`nav-item ${path === '/plans' ? 'active' : ''}`}>Plans</Link>
          <Link to="/commitments" className={`nav-item ${path === '/commitments' ? 'active' : ''}`}>Commitments</Link>
          <Link to="/memory" className={`nav-item ${path === '/memory' ? 'active' : ''}`}>Memory</Link>
          <Link to="/activity" className={`nav-item ${path === '/activity' ? 'active' : ''}`}>Activity</Link>
        </div>
        
        <div className="divider" style={{margin: '8px 16px'}} />
        
        <div className="nav-group">
          <Link to="/alexa" className={`nav-item ${path === '/alexa' ? 'active' : ''}`}>Alexa+</Link>
          <Link to="/judge" className={`nav-item ${path === '/judge' ? 'active' : ''}`}>Judge Mode</Link>
        </div>
      </div>

      <div style={{padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)'}}></div>
        <span className="metadata">Engine Online</span>
      </div>
    </aside>
  );
}
