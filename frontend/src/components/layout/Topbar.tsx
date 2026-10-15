import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, fetchAuthSession } from 'aws-amplify/auth';
import { Search, LogOut, Shield, Brain, User, CheckCircle, ExternalLink } from 'lucide-react';
import { CommandPalette } from '../CommandPalette';

interface TopbarProps {
  onToggleMobile?: () => void;
  mobileOpen?: boolean;
}

export function Topbar({ onToggleMobile, mobileOpen }: TopbarProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await fetchAuthSession();
        const email = session.tokens?.idToken?.payload?.email as string | undefined;
        if (email) {
          setUserEmail(email);
          setIsDemo(false);
          return;
        }
      } catch {
        // Ignored
      }

      if (sessionStorage.getItem('saarthi_demo_override') === 'true') {
        setUserEmail('aarav.dulam@example.com (Demo)');
        setIsDemo(true);
      } else {
        const stored = localStorage.getItem('saarthi_auth_email');
        if (stored) {
          setUserEmail(stored);
        } else {
          setUserEmail('Aarav Dulam');
        }
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('saarthi_demo_override');
      await signOut();
    } catch (err) {
      console.warn("Sign out completed locally:", err);
    } finally {
      sessionStorage.removeItem('saarthi_demo_override');
      navigate('/login');
    }
  };

  const getInitials = () => {
    if (isDemo || !userEmail) return 'AD';
    const parts = userEmail.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userEmail.slice(0, 2).toUpperCase();
  };

  return (
    <>
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
          {/* Interactive Command Palette Trigger */}
          <button 
            className="hide-on-mobile"
            onClick={() => setCommandOpen(true)}
            aria-label="Search and Command Palette (Ctrl+K or Cmd+K)"
            style={{ 
              padding: '6px 14px', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-color)',
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              color: 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Search size={14} style={{ color: 'var(--saffron, #e8b36e)' }} />
            <span>Search / Command</span>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px',
              padding: '2px 5px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: 'var(--text-secondary)'
            }}>
              ⌘K
            </span>
          </button>

          {/* User Profile Avatar with Interactive Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserDropdownOpen(open => !open)}
              aria-label="User account menu"
              aria-expanded={userDropdownOpen}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary, #0c1421), var(--saffron, #e8b36e))',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                border: userDropdownOpen ? '2px solid var(--saffron)' : '2px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              title={userEmail || "User Account"}
            >
              {getInitials()}
            </button>

            {userDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  backgroundColor: 'var(--midnight, #0c1421)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  borderRadius: '10px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
                  zIndex: 1000,
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                {/* User Info Header */}
                <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <User size={14} style={{ color: 'var(--saffron, #e8b36e)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary, #ffffff)' }}>
                      {isDemo ? 'Aarav Dulam' : 'SAARTHI User'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8e9bb0)', wordBreak: 'break-all' }}>
                    {userEmail}
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: isDemo ? 'rgba(232, 179, 110, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                    color: isDemo ? 'var(--saffron, #e8b36e)' : '#34c759'
                  }}>
                    <CheckCircle size={11} />
                    {isDemo ? 'Local Demo Mode' : 'Cognito Authenticated'}
                  </div>
                </div>

                {/* Quick Menu Links */}
                <Link
                  to="/memory"
                  onClick={() => setUserDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: 'var(--text-primary, #ffffff)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Brain size={15} style={{ color: 'var(--saffron, #e8b36e)' }} />
                  <span>Memory & Preferences</span>
                </Link>

                <Link
                  to="/judge"
                  onClick={() => setUserDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: 'var(--text-primary, #ffffff)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Shield size={15} style={{ color: 'var(--saffron, #e8b36e)' }} />
                  <span>Protocol & Safety Audit</span>
                </Link>

                <div style={{ height: '1px', backgroundColor: 'var(--border-color, rgba(255,255,255,0.08))', margin: '2px 0' }} />

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ff6b6b',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </span>
                  <ExternalLink size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={commandOpen} 
        onClose={() => setCommandOpen(false)} 
        onReplan={() => navigate('/alexa')}
      />
    </>
  );
}
