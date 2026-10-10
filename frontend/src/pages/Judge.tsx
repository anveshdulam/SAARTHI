import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Judge() {
  const { isAuthenticated, fetchState, stateData, loading, intelligenceStep, handleSend } = useSaarthiState();

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
        
        <div style={{ marginBottom: '48px', borderBottom: '1px solid var(--border-color)', paddingBottom: '48px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '12px' }}>
            THE SAARTHI ADVANTAGE
          </div>
          <h1 className="editorial-heading" style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text-primary-light)' }}>
            Execution that adapts to reality.
          </h1>
          <p style={{ color: 'var(--text-secondary-light)', maxWidth: '800px', fontSize: '1.25rem', lineHeight: 1.5 }}>
            Unlike static task managers, SAARTHI is an execution agent that remembers commitments, plans around constraints, and securely asks for approval before taking consequential action.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          
          {/* Execution Narrative Timeline */}
          <div className="card" style={{ padding: '40px', background: 'var(--workspace-elevated)' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '32px' }}>
              EXECUTION LIFECYCLE
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              
              <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                <div style={{ width: '2px', background: 'var(--primary)', position: 'relative', margin: '8px 0 0 5px' }}>
                  <div style={{ position: 'absolute', top: 0, left: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />
                </div>
                <div style={{ paddingBottom: '32px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>Intention & Context</div>
                  <div style={{ color: 'var(--text-secondary-light)', marginTop: '4px' }}>User declares a goal and constraints.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                <div style={{ width: '2px', background: 'var(--warning)', position: 'relative', margin: '8px 0 0 5px' }}>
                  <div style={{ position: 'absolute', top: 0, left: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }} />
                </div>
                <div style={{ paddingBottom: '32px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--warning)' }}>Risk Detected</div>
                  <div style={{ color: 'var(--text-secondary-light)', marginTop: '4px' }}>Schedule conflict or missed session identified.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                <div style={{ width: '2px', background: 'var(--saffron)', position: 'relative', margin: '8px 0 0 5px' }}>
                  <div className="pulse" style={{ position: 'absolute', top: 0, left: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--saffron)' }} />
                </div>
                <div style={{ paddingBottom: '32px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--saffron)' }}>Replanning</div>
                  <div style={{ color: 'var(--text-secondary-light)', marginTop: '4px' }}>Agent computes optimal path forward.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                <div style={{ width: '2px', background: 'var(--success)', position: 'relative', margin: '8px 0 0 5px' }}>
                  <div style={{ position: 'absolute', top: 0, left: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)' }}>Human Approval & Execution</div>
                  <div style={{ color: 'var(--text-secondary-light)', marginTop: '4px' }}>User reviews and accepts the new plan.</div>
                </div>
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Live Scenario Demo */}
            <div className="card" style={{ padding: '40px', borderTop: '4px solid var(--primary)', background: 'var(--workspace-elevated)' }}>
              <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '16px' }}>
                SCENARIO SIMULATOR
              </h2>
              <p style={{ marginBottom: '24px', color: 'var(--text-secondary-light)', lineHeight: 1.5 }}>
                Trigger a realistic execution hazard. SAARTHI will autonomously detect the issue, replan the schedule, and request your approval.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  className="button primary lg" 
                  onClick={() => handleSend("I missed my session.")} 
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Trigger "Missed Session" Hazard
                </button>
                <button 
                  className="button ghost lg" 
                  onClick={() => handleSend("I have a new constraint: no work after 10pm.")} 
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', background: 'var(--workspace-bg)', border: '1px solid var(--workspace-border)' }}
                >
                  Trigger "New Constraint" Hazard
                </button>
              </div>

              {loading && intelligenceStep && (
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--workspace-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderColor: 'var(--border-color)', borderTopColor: 'var(--saffron)', borderWidth: '2px' }}></div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--saffron)', fontSize: '13px', fontWeight: 500 }}>{intelligenceStep}</span>
                </div>
              )}
            </div>

            {/* Technical Evidence Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>ARCHITECTURE</div>
                <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>MCP HTTP</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>v2025-11-25 Protocol</div>
              </div>

              <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>MEMORY</div>
                <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)' }}>Persistent</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>Across restarts</div>
              </div>

              <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>PLANNER</div>
                <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>Deterministic</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>Constraint-solved</div>
              </div>

              <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>SECURITY</div>
                <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--saffron)' }}>Human-in-Loop</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>Guarded execution</div>
              </div>

            </div>

          </div>
        </div>
        
        {/* Live System Trace */}
        <div className="card" style={{ marginTop: '48px', padding: '40px', background: 'var(--workspace-elevated)' }}>
          <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '24px' }}>
            LIVE SYSTEM TRACE
          </h2>
          <div style={{ 
            fontFamily: 'var(--font-mono)',
            fontSize: '13px', 
            maxHeight: '400px', 
            overflowY: 'auto',
            background: 'var(--ink)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--dark-border)',
            color: 'var(--text-secondary-dark)'
          }}>
            {stateData.events.length === 0 ? (
              <div style={{ color: 'var(--text-muted-dark)', textAlign: 'center', padding: '40px 0' }}>
                Awaiting execution events...
              </div>
            ) : (
              stateData.events.slice().reverse().map((event: any) => (
                <div key={event.id} style={{ 
                  marginBottom: '16px', 
                  paddingBottom: '16px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted-dark)' }}>{new Date(event.created_at).toISOString()}</span>
                    <span style={{ 
                      color: event.type.includes('ERROR') ? 'var(--danger)' : 'var(--primary)',
                      fontWeight: 600 
                    }}>{event.type}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary-dark)', wordBreak: 'break-all' }}>
                    {event.entity} event recorded.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
