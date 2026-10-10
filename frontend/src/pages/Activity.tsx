import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Activity() {
  const { isAuthenticated, fetchState, stateData } = useSaarthiState();

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;
  
  const [filter, setFilter] = useState('ALL');
  const filters = ['ALL', 'COMMITMENTS', 'PLANS', 'APPROVALS', 'MEMORY', 'SYSTEM'];

  return (
    <MainLayout>
      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Activity
          </h1>
          <div style={{ color: 'var(--text-secondary-light)', fontSize: '1.1rem' }}>
            Everything SAARTHI changed, proposed, and learned.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '32px', padding: '0 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)', overflowX: 'auto' }}>
          {filters.map(f => (
            <div 
              key={f} 
              style={{ 
                padding: '20px 0',
                cursor: 'pointer', 
                color: filter === f ? 'var(--primary)' : 'var(--text-muted-light)', 
                fontWeight: filter === f ? 600 : 500,
                borderBottom: filter === f ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </div>
          ))}
        </div>

        {stateData.events.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 32px', border: 'none' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M2 12h4l2-9 5 18 3-10 4 4h4"/></svg>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>No activity yet.</div>
            <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto' }}>Your execution history will appear here.</div>
          </div>
        ) : (
          <div style={{ padding: '40px 32px', background: 'var(--workspace-bg)' }}>
            <div style={{ position: 'relative', borderLeft: '2px solid var(--workspace-border)', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              {stateData.events.slice().reverse().map((e: any, idx: number) => (
                <div key={e.id} style={{ position: 'relative' }}>
                  {/* Timeline Dot */}
                  <div style={{ 
                    position: 'absolute', 
                    left: '-37px', 
                    top: '2px', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: e.type.includes('PROPOSED') ? 'var(--warning)' : e.type.includes('COMPLETED') ? 'var(--success)' : 'var(--border-color)', 
                    border: '2px solid var(--workspace-bg)' 
                  }}></div>
                  
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    <div style={{ width: '80px', flexShrink: 0, marginTop: '1px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted-light)' }}>
                        {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted-light)', marginTop: '4px' }}>
                        {new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary-light)', marginBottom: '8px' }}>
                        {e.type.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary-light)', lineHeight: 1.5 }}>
                        {e.entity || 'System update performed.'}
                      </div>
                    </div>
                    
                    {e.plan_version && (
                      <div style={{ flexShrink: 0 }}>
                        <span className="badge" style={{ background: 'var(--saffron-subtle)', color: 'var(--saffron)', border: 'none' }}>
                          v{e.plan_version}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
