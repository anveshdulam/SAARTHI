import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Mic, Sparkles, CheckSquare, Brain, History, Shield, ArrowRight, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commitments?: Array<{ id: string; title: string; status: string; type: string }>;
  onReplan?: () => void;
}

export function CommandPalette({ isOpen, onClose, commitments = [], onReplan }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultActions = [
    { id: 'home', title: 'Today Dashboard', subtitle: 'View daily schedule & alerts', icon: Calendar, action: () => { navigate('/'); onClose(); } },
    { id: 'alexa', title: 'Alexa+ Voice Console', subtitle: 'Natural voice planning dialogue', icon: Mic, action: () => { navigate('/alexa'); onClose(); } },
    { id: 'replan', title: 'Quick Action: Replan Day', subtitle: 'Trigger intelligent agent schedule repair', icon: Sparkles, action: () => { onReplan?.(); onClose(); } },
    { id: 'plans', title: 'Living Plans & Proposals', subtitle: 'Review and approve proposed adjustments', icon: CheckSquare, action: () => { navigate('/plans'); onClose(); } },
    { id: 'commitments', title: 'Commitments & Goals', subtitle: 'Manage hard & soft schedule commitments', icon: CheckSquare, action: () => { navigate('/commitments'); onClose(); } },
    { id: 'memory', title: 'Memory & Constraints', subtitle: 'Inspect active hard limits and preferences', icon: Brain, action: () => { navigate('/memory'); onClose(); } },
    { id: 'activity', title: 'Activity & Audit Log', subtitle: 'Immutable event stream & protocol verification', icon: History, action: () => { navigate('/activity'); onClose(); } },
    { id: 'judge', title: 'Judge Mode & Telemetry', subtitle: 'Live safety invariants and MCP audit', icon: Shield, action: () => { navigate('/judge'); onClose(); } },
  ];

  const commitmentActions = commitments.map(c => ({
    id: `comm-${c.id}`,
    title: c.title,
    subtitle: `${c.type.toUpperCase()} commitment · Status: ${c.status}`,
    icon: CheckSquare,
    action: () => { navigate('/commitments'); onClose(); }
  }));

  const allItems = [...defaultActions, ...commitmentActions];
  const filtered = query.trim() === '' 
    ? defaultActions 
    : allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (index: number) => {
    const item = filtered[index];
    if (item) item.action();
  };

  return (
    <div 
      className="command-palette-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 19, 31, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        className="command-palette-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'var(--midnight, #0c1421)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))'
        }}>
          <Search size={18} style={{ color: 'var(--text-muted, #8e9bb0)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % Math.max(1, filtered.length));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + filtered.length) % Math.max(1, filtered.length));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(selectedIndex);
              }
            }}
            placeholder="Type a command or search commitments..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              caretColor: '#e8b36e',
              fontSize: '1.05rem',
              fontWeight: 500,
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={onClose}
            aria-label="Close command palette"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #8e9bb0)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #8e9bb0)', fontSize: '0.9rem' }}>
              No matching commands or commitments found for "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(232, 179, 110, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(232, 179, 110, 0.25)' : '1px solid transparent',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'var(--saffron, #e8b36e)' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#1b2027' : 'var(--text-primary, #ffffff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '0.92rem', 
                        fontWeight: 600, 
                        color: isSelected ? 'var(--saffron, #e8b36e)' : 'var(--text-primary, #ffffff)' 
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8e9bb0)' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <ArrowRight size={14} style={{ color: 'var(--saffron, #e8b36e)' }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          backgroundColor: 'rgba(0,0,0,0.2)',
          fontSize: '0.75rem',
          color: 'var(--text-muted, #8e9bb0)'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>↵</kbd> Select</span>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>esc</kbd> Close</span>
          </div>
          <div>SAARTHI Fast Navigation</div>
        </div>
      </div>
    </div>
  );
}
