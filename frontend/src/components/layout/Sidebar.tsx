import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
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

      <div style={{padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)'}}></div>
          <span className="metadata">Engine Online</span>
        </div>
        <button 
          onClick={async () => {
            try {
              await signOut();
              window.location.reload();
            } catch (err) {
              console.error(err);
            }
          }}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary-dark)', cursor: 'pointer', padding: '4px' }}
          title="Sign Out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </aside>
  );
}
