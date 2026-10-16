import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Activity() {
  const { isAuthenticated, fetchState, stateData } = useSaarthiState();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const filters = ['ALL', 'COMMITMENTS', 'PLANS', 'APPROVALS', 'MEMORY', 'SYSTEM'];

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const filteredEvents = stateData.events.filter((e: any) => {
    let categoryMatch = true;
    if (filter === 'COMMITMENTS') {
      categoryMatch = e.entity === 'commitment' || e.type.includes('COMMITMENT');
    } else if (filter === 'PLANS') {
      categoryMatch = e.entity === 'plan' || e.type.includes('PLAN');
    } else if (filter === 'APPROVALS') {
      categoryMatch = e.type.includes('ACCEPTED') || e.type.includes('APPROVED');
    } else if (filter === 'MEMORY') {
      categoryMatch = e.entity === 'constraint' || e.type.includes('CONSTRAINT');
    } else if (filter === 'SYSTEM') {
      categoryMatch = !e.entity || e.entity === 'system' || (!e.type.includes('COMMITMENT') && !e.type.includes('PLAN'));
    }

    if (!categoryMatch) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const typeMatch = e.type?.toLowerCase().includes(q);
      const entityMatch = e.entity?.toLowerCase().includes(q);
      const idMatch = e.id?.toLowerCase().includes(q);
      const stateMatch = e.new_state ? (typeof e.new_state === 'string' ? e.new_state : JSON.stringify(e.new_state)).toLowerCase().includes(q) : false;
      return typeMatch || entityMatch || idMatch || stateMatch;
    }
    return true;
  });

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '64px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border-color)', paddingBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
                IMMUTABLE AUDIT LOG & TELEMETRY
              </div>
              <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                Activity & Audit Trail
              </h1>
              <p style={{ color: 'var(--text-secondary-light)', fontSize: '1.05rem', margin: 0, maxWidth: '780px' }}>
                Cryptographically verifiable event stream recorded in SQLite. Every proposal, human approval, state mutation, and constraint update is logged.
              </p>
            </div>
            <div>
              <button className="button secondary touch-target" onClick={fetchState} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>🔄</span>
                <span>Refresh Log</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {/* Functional Filters Bar & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', padding: '0 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto' }}>
              {filters.map(f => (
                <div 
                  key={f} 
                  style={{ 
                    padding: '18px 0',
                    cursor: 'pointer', 
                    color: filter === f ? 'var(--primary)' : 'var(--text-muted-light)', 
                    fontWeight: filter === f ? 600 : 500,
                    borderBottom: filter === f ? '2px solid var(--primary)' : '2px solid transparent',
                    fontSize: '12.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </div>
              ))}
            </div>

            {/* Keyword Search Input */}
            <div style={{ padding: '8px 0', minWidth: '220px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 30px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 32px', border: 'none' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                <path d="M2 12h4l2-9 5 18 3-10 4 4h4"/>
              </svg>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                No events found for this filter.
              </div>
              <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto', fontSize: '13.5px' }}>
                Select "ALL" or execute schedule operations to view immutable audit events.
              </div>
            </div>
          ) : (
            <div style={{ padding: '36px 28px', background: 'var(--workspace-bg)' }}>
              <div style={{ 
                position: 'relative', 
                borderLeft: '2px solid var(--workspace-border)', 
                paddingLeft: '32px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '36px' 
              }}>
                
                {filteredEvents.slice().reverse().map((e: any) => {
                  const isAccepted = e.type.includes('ACCEPTED') || e.type.includes('APPROVED');
                  const isProposed = e.type.includes('PROPOSED');
                  const isMissed = e.type.includes('MISSED') || e.type.includes('FAILED');

                  return (
                    <div key={e.id} style={{ position: 'relative' }}>
                      {/* Timeline Dot */}
                      <div style={{ 
                        position: 'absolute', 
                        left: '-37px', 
                        top: '4px', 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: isAccepted ? '#10b981' : isProposed ? 'var(--warning)' : isMissed ? 'var(--danger)' : 'var(--border-color)', 
                        border: '2px solid var(--workspace-bg)',
                        boxShadow: isAccepted ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : undefined
                      }}></div>
                      
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        
                        {/* Timestamp */}
                        <div style={{ width: '90px', flexShrink: 0, marginTop: '2px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-primary-light)', fontWeight: 600 }}>
                            {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted-light)', marginTop: '2px' }}>
                            {new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        
                        {/* Event Content */}
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary-light)', overflowWrap: 'anywhere' }}>
                              {e.type.replace(/_/g, ' ')}
                            </span>
                            <span className={`badge ${isAccepted ? 'success' : isProposed ? 'warning' : isMissed ? 'danger' : 'neutral'}`} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                              {e.entity ? e.entity.toUpperCase() : 'SYSTEM'}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary-light)', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                            Event recorded for entity: <strong>{e.entity || 'system'}</strong>
                            {e.plan_version && <span> · Plan Version: <strong>v{e.plan_version}</strong></span>}
                          </div>

                          {e.new_state && (
                            <div style={{ marginTop: '8px' }}>
                              <button 
                                className="button ghost touch-target"
                                style={{ minHeight: '32px', padding: '0 12px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                                onClick={() => setSelectedEvent(e)}
                              >
                                View State Diff & Payload ↗
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Plan Version Pill */}
                        {e.plan_version && (
                          <div style={{ flexShrink: 0 }}>
                            <span className="badge" style={{ background: 'var(--saffron-subtle)', color: 'var(--saffron)', border: '1px solid var(--saffron-border)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                              v0{e.plan_version}
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
                
              </div>
            </div>
          )}
        </div>

        {/* State Payload Inspector Modal */}
        {selectedEvent && (() => {
          const isErr = selectedEvent.type.includes('ERROR') || selectedEvent.type.includes('FAILED') || selectedEvent.type.includes('MISSED');
          const isSuccess = selectedEvent.type.includes('ACCEPTED') || selectedEvent.type.includes('APPROVED');

          return (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.78)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{
                maxWidth: '640px',
                width: '100%',
                padding: '28px 32px',
                background: '#191B1F',
                color: '#ECEEF1',
                borderRadius: '14px',
                border: '1px solid #2E323B',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                      marginBottom: '8px',
                      background: isErr ? 'rgba(239, 68, 68, 0.18)' : isSuccess ? 'rgba(16, 185, 129, 0.18)' : 'rgba(232, 179, 110, 0.18)',
                      color: isErr ? '#F87171' : isSuccess ? '#34D399' : '#FBBF24',
                      border: isErr ? '1px solid rgba(239, 68, 68, 0.4)' : isSuccess ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(232, 179, 110, 0.4)'
                    }}>
                      {selectedEvent.type}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>Event Payload Inspector</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedEvent(null)} 
                    style={{ background: 'none', border: 'none', color: '#9DA3AE', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ color: '#9DA3AE', width: '110px', flexShrink: 0, fontWeight: 500 }}>Event ID:</span>
                    <code style={{ fontSize: '11.5px', background: '#111315', padding: '3px 8px', borderRadius: '5px', color: '#E8B36E', border: '1px solid #23272F' }}>{selectedEvent.id}</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ color: '#9DA3AE', width: '110px', flexShrink: 0, fontWeight: 500 }}>Timestamp:</span>
                    <span style={{ color: '#ECEEF1', fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>{new Date(selectedEvent.created_at).toISOString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ color: '#9DA3AE', width: '110px', flexShrink: 0, fontWeight: 500 }}>Entity:</span>
                    <span style={{ color: '#ECEEF1', textTransform: 'capitalize' }}>{selectedEvent.entity || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ color: '#9DA3AE', width: '110px', flexShrink: 0, fontWeight: 500 }}>Plan Version:</span>
                    <span style={{ color: '#ECEEF1' }}>{selectedEvent.plan_version ? `v0${selectedEvent.plan_version}` : 'None'}</span>
                  </div>
                  
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ color: '#9DA3AE', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Recorded State JSON:</span>
                    <pre style={{
                      background: '#101215',
                      border: '1px solid #272B33',
                      color: '#ECEEF1',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontFamily: 'var(--font-mono)',
                      overflowX: 'auto',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.55
                    }}>
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedEvent.new_state), null, 2);
                        } catch {
                          return selectedEvent.new_state || 'No state recorded.';
                        }
                      })()}
                    </pre>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="button primary touch-target" 
                    onClick={() => setSelectedEvent(null)}
                    style={{ background: '#E8B36E', color: '#111315', border: 'none', fontWeight: 650, borderRadius: '8px', padding: '10px 22px', fontSize: '13px' }}
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </MainLayout>
  );
}
