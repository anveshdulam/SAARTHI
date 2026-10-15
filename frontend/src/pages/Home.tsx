import { Link } from 'react-router-dom';
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
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Good evening, Aarav
          </h1>
          <div style={{ color: 'var(--text-secondary-light)', fontSize: '1.05rem' }}>
            You have {stateData.commitments.length} commitments today.{' '}
            {atRisk.length > 0 ? (
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                {atRisk.length} session{atRisk.length > 1 ? 's' : ''} missed or at risk. Immediate repair recommended.
              </span>
            ) : pendingApprovals > 0 ? (
              <span style={{ color: 'var(--saffron)', fontWeight: 600 }}>
                A schedule repair plan is awaiting your approval.
              </span>
            ) : (
              'All commitments and stored constraints are currently on track.'
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="button ghost touch-target" 
            onClick={() => handleSend("Replan my day")}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Replan day
          </button>
          <Link to="/alexa" className="button primary touch-target" style={{ textDecoration: 'none' }}>
            Open Alexa+ Voice ↗
          </Link>
        </div>
      </div>

      <div className="today-grid">
        
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
          
          {/* BEAT 2: Proactive Hazard Alert Card (When commitment missed/at-risk) */}
          {atRisk.length > 0 && (
            <div 
              className="card" 
              style={{ 
                padding: '28px', 
                background: 'var(--workspace-elevated)', 
                borderLeft: '5px solid var(--danger)',
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: 'var(--danger)', 
                    display: 'inline-block',
                    boxShadow: '0 0 0 4px var(--danger-subtle)'
                  }}></span>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--danger)', fontWeight: 700 }}>
                    PROACTIVE HAZARD DETECTED · ATTENTION REQUIRED
                  </span>
                </div>
                <span className="badge danger">PAST DUE ({atRisk.length})</span>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ 
                  background: 'var(--danger-subtle)', 
                  color: 'var(--danger)', 
                  borderRadius: '12px', 
                  width: '48px', 
                  height: '48px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0 
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary-light)', marginBottom: '6px' }}>
                    {atRisk[0]?.title || 'Missed Study Session'}
                  </div>
                  <p style={{ color: 'var(--text-secondary-light)', fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px' }}>
                    This commitment was scheduled for {atRisk[0]?.start_time ? new Date(atRisk[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '2:00 PM'} and is now past-due. Unresolved schedule drift threatens downstream blocks and risks violating your <strong>10:00 PM sleep cutoff</strong>.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link 
                      to="/alexa" 
                      className="button primary touch-target" 
                      style={{ textDecoration: 'none' }}
                    >
                      <span>Ask Alexa+ to Repair Schedule</span>
                      <span style={{ fontSize: '15px' }}>↗</span>
                    </Link>
                    <Link 
                      to="/plans" 
                      className="button ghost touch-target" 
                      style={{ textDecoration: 'none' }}
                    >
                      View Living Plan & Proposals
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Focus / Action Required / Proposed Plan Card */}
          <div className="card" style={{ padding: '32px', borderTop: proposedPlanEvent ? '4px solid var(--saffron)' : '4px solid var(--primary)' }}>
            <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '24px' }}>
              {proposedPlanEvent ? 'APPROVAL REQUIRED' : 'NEXT UP'}
            </h2>
            
            {proposedPlanEvent ? (
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--saffron-subtle)', color: 'var(--saffron)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Review schedule change (Plan 0{proposedPlanEvent.plan_version})</div>
                  <div style={{ color: 'var(--text-secondary-light)', marginBottom: '24px', lineHeight: 1.5 }}>A new schedule proposal has been generated by the agent. All hard constraints and 10 PM limits remain protected.</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button 
                      className="button primary touch-target" 
                      onClick={() => handleApprovePlan(JSON.parse(proposedPlanEvent.new_state).planId, proposedPlanEvent.plan_version)}
                    >
                      Approve plan
                    </button>
                    <Link to="/plans" className="button ghost touch-target" style={{ textDecoration: 'none' }}>
                      Inspect before & after diff ↗
                    </Link>
                  </div>
                </div>
              </div>
            ) : (activeCommitments.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{activeCommitments[0]?.title || 'Next block'}</div>
                    <span className="badge success">On track</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary-light)' }}>
                    {activeCommitments[0]?.estimated_minutes ? `${activeCommitments[0].estimated_minutes} min duration` : 'Pending duration'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link to="/plans" className="button ghost touch-target" style={{ textDecoration: 'none' }}>View plan</Link>
                  <button className="button primary touch-target" onClick={() => handleSend(`Complete ${activeCommitments[0]?.title}`)}>Start Action</button>
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
                    className="touch-target"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
          
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

          {/* Stored Invariants Callout */}
          <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)', borderLeft: '3px solid var(--saffron)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
              PROTECTED INVARIANTS
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary-light)', marginBottom: '6px' }}>
              Hard Cutoff: 10:00 PM
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary-light)', lineHeight: 1.5 }}>
              No study or intense focus sessions will be scheduled past 22:00. Any proposed plan must strictly honor this constraint.
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                RECENT UPDATES
              </h2>
              <Link to="/activity" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>View all ↗</Link>
            </div>
             
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {stateData.events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted-light)' }}>No recent activity.</div>
              ) : (
                stateData.events.slice(-5).reverse().map((trace: any) => (
                  <div key={trace.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-color)', marginTop: '6px' }}></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary-light)', marginBottom: '2px', overflowWrap: 'anywhere' }}>{trace.type.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary-light)', overflowWrap: 'anywhere' }}>{trace.entity || 'System event'}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted-light)', whiteSpace: 'nowrap' }}>
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
