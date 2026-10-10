import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LivingPlan } from '../components/LivingPlan';
import { LandingPage } from './LandingPage';

export function Home() {
  const { isAuthenticated, fetchState, input, setInput, loading, intelligenceStep, stateData, handleSend, handleApprovePlan } = useSaarthiState();

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const activeCommitments = stateData.commitments.filter((c: any) => c.status === 'pending');
  const atRisk = stateData.commitments.filter((c: any) => c.status === 'missed');
  const proposedPlanEvent = stateData.events.filter((e: any) => e.type === 'PLAN_PROPOSED').slice(-1)[0];
  const pendingApprovals = proposedPlanEvent ? 1 : stateData.commitments.filter((c: any) => c.status === 'proposed').length;

  return (
    <MainLayout>
      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Good evening, Anvesh
          </h1>
          <div style={{ color: 'var(--text-secondary-light)', fontSize: '1.1rem' }}>
            You've got {stateData.commitments.length} commitments today. {atRisk.length > 0 ? <span style={{ color: 'var(--danger)' }}>{atRisk.length} need your attention.</span> : (pendingApprovals > 0 ? <span style={{ color: 'var(--saffron)' }}>A plan needs your approval.</span> : 'Everything is on track.')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="button ghost" onClick={() => handleSend("Replan my day")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
            Replan day
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
        
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Active Focus / Action Required */}
          <div className="card" style={{ padding: '32px', borderTop: proposedPlanEvent ? '4px solid var(--saffron)' : '4px solid var(--primary)' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '24px' }}>
              {proposedPlanEvent ? 'APPROVAL REQUIRED' : 'NEXT UP'}
            </h2>
            
            {proposedPlanEvent ? (
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--saffron-subtle)', color: 'var(--saffron)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Review schedule change (Plan 0{proposedPlanEvent.plan_version})</div>
                  <div style={{ color: 'var(--text-secondary-light)', marginBottom: '24px', lineHeight: 1.5 }}>A new schedule proposal has been generated in response to recent events. All hard constraints remain satisfied.</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="button primary" onClick={() => handleApprovePlan(JSON.parse(proposedPlanEvent.new_state).planId, proposedPlanEvent.plan_version)}>Approve plan</button>
                    <button className="button ghost">View changes</button>
                  </div>
                </div>
              </div>
            ) : (activeCommitments.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{activeCommitments[0]?.title || 'Next block'}</div>
                    <span className="badge success">On track</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary-light)' }}>
                    {activeCommitments[0]?.estimated_minutes ? `${activeCommitments[0].estimated_minutes} min duration` : 'Pending duration'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="button ghost">View plan</button>
                  <button className="button primary" onClick={() => handleSend(`Complete ${activeCommitments[0]?.title}`)}>Start Action</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>Declare an intention</div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="e.g. I need to focus on architecture review for 2 hours..." 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
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
                    onClick={() => handleSend()} 
                    disabled={loading || !input.trim()}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      bottom: '8px',
                      padding: '0 20px',
                      background: input.trim() ? 'var(--primary)' : 'var(--workspace-border)',
                      color: input.trim() ? 'white' : 'var(--text-muted-light)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: input.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Send ↗
                  </button>
                </div>
                {loading && intelligenceStep && (
                  <div style={{ color: 'var(--saffron)', fontSize: '13px', fontWeight: 500, animation: 'pulse 2s infinite' }}>
                    {intelligenceStep}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Today's Timeline */}
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '24px' }}>
              TODAY'S TIMELINE
            </h2>
            {stateData.commitments.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary-light)', marginBottom: '8px' }}>No commitments scheduled.</div>
                <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px' }}>
                  SAARTHI works best when it has something to protect. Declare an intention above to get started.
                </div>
              </div>
            ) : (
              <LivingPlan stateData={stateData} />
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Quick Stats */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '20px' }}>
              AT A GLANCE
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary-light)' }}>Total Commitments</span>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{stateData.commitments.length}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary-light)' }}>Completed</span>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--success)' }}>{stateData.commitments.filter((c: any) => c.status === 'completed').length}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary-light)' }}>At Risk</span>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: atRisk.length > 0 ? 'var(--danger)' : 'var(--text-primary-light)' }}>{atRisk.length}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                RECENT UPDATES
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }}>View all</span>
            </div>
             
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {stateData.events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted-light)' }}>No recent activity.</div>
              ) : (
                stateData.events.slice(-5).reverse().map((trace: any) => (
                  <div key={trace.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-color)', marginTop: '6px' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary-light)', marginBottom: '2px' }}>{trace.type.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary-light)' }}>{trace.entity || 'System event'}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted-light)' }}>
                      {new Date(trace.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
