import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Memory() {
  const { isAuthenticated, fetchState, stateData, handleSend, loading } = useSaarthiState();
  const [newMemory, setNewMemory] = useState('');

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const handleCreate = () => {
    if (newMemory.trim()) {
      handleSend(`Save this constraint: ${newMemory}`);
      setNewMemory('');
    }
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Memory
          </h1>
          <div style={{ color: 'var(--text-secondary-light)', fontSize: '1.1rem' }}>
            Context and constraints SAARTHI remembers and uses.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '24px' }}>
              CONSTRAINTS
            </h2>
            
            {stateData.constraints.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 0', border: 'none' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M10.7 18.7a3 3 0 0 1-4.2-4.2l5.5-5.5a5 5 0 0 1 7.1 7.1l-5.5 5.5"/><circle cx="15.5" cy="15.5" r="2.5"/></svg>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>Nothing remembered yet.</div>
                <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto' }}>Give SAARTHI a constraint or preference to remember for future planning.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {stateData.constraints.map((c: any) => (
                  <div key={c.id} style={{ padding: '24px 0', borderBottom: '1px solid var(--workspace-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary-light)', lineHeight: 1.5, paddingRight: '24px' }}>{c.value}</div>
                      <span className="badge success">ACTIVE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary-light)', fontSize: '13px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      Used when SAARTHI generates or modifies living plans.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '24px' }}>
              WHAT SHOULD SAARTHI REMEMBER?
            </h2>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="e.g. No focus blocks after 11 PM..." 
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  background: 'var(--workspace-bg)', 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)',
                  fontSize: '1rem',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              />
              <button 
                onClick={handleCreate} 
                disabled={loading || !newMemory.trim()}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '8px',
                  bottom: '8px',
                  padding: '0 20px',
                  background: newMemory.trim() ? 'var(--primary)' : 'var(--workspace-border)',
                  color: newMemory.trim() ? 'white' : 'var(--text-muted-light)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: newMemory.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
              >
                Save
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="button ghost" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={() => setNewMemory("I have less time today")}>"I have less time today"</button>
              <button className="button ghost" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={() => setNewMemory("Avoid mornings")}>"Avoid mornings"</button>
            </div>
          </div>
          
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '20px' }}>
              MEMORY STATS
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary-light)' }}>Active constraints</span>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{stateData.constraints.length}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary-light)' }}>Session context</span>
                <span style={{ fontWeight: 500, color: 'var(--primary)' }}>Preserved</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary-light)' }}>Last updated</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted-light)' }}>
                  {stateData.constraints.length > 0 ? new Date(stateData.constraints[stateData.constraints.length-1].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
