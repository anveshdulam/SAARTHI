interface TopbarProps {
  onToggleMobile?: () => void;
  mobileOpen?: boolean;
}

export function Topbar({ onToggleMobile, mobileOpen }: TopbarProps) {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="mobile-nav-toggle"
          onClick={onToggleMobile}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          title={mobileOpen ? "Close menu" : "Open menu"}
          style={{ minHeight: '44px', width: '44px' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>

        <div className="headline" style={{ fontSize: '1rem', fontWeight: 600 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="hide-on-mobile" style={{ padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Search / Command</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>⌘K</span>
        </div>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }} title="Aarav Dulam">
          AD
        </div>
      </div>
    </header>
  );
}
