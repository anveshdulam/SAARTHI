
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ height: '72px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BrandLogo />
        <div className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary-dark)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px' }}>BETA</div>
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
