
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LivingPlan } from '../components/LivingPlan';
import { LoginOverlay } from '../components/LoginOverlay';

export function Home() {
  const { isAuthenticated, fetchState, input, setInput, loading, intelligenceStep, stateData, handleSend, handleApprovePlan } = useSaarthiState();

  if (!isAuthenticated) return <LoginOverlay onLogin={fetchState} />;

  const activeCommitments = stateData.commitments.filter((c: any) => c.status === 'pending');
  const atRisk = stateData.commitments.filter((c: any) => c.status === 'missed');
  const proposedPlanEvent = stateData.events.filter((e: any) => e.type === 'PLAN_PROPOSED').slice(-1)[0];
  const pendingApprovals = proposedPlanEvent ? 1 : stateData.commitments.filter((c: any) => c.status === 'proposed').length;

  let heroHeading = "Everything is on track.";
  let heroSub = "Your schedule is protected and constraints are active.";
  if (proposedPlanEvent) {
    heroHeading = "Approval required.";
    heroSub = "A new schedule proposal has been generated. Please review the living plan.";
  } else if (atRisk.length > 0) {
    heroHeading = `${atRisk[0].title} is at risk.`;
    heroSub = `You missed the planned session. SAARTHI is awaiting your instructions or will attempt to recalculate.`;
  }

  return (
    <MainLayout>
      <div style={{marginBottom: 'var(--spacing-xl)'}}>
        <h1 className="display" style={{fontSize: '1.5rem', marginBottom: '8px'}}>Good evening, Anvesh</h1>
        <div className="body" style={{color: 'var(--text-secondary)'}}>Here's what needs your attention.</div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="section-title" style={{margin: 0}}>ACTIVE COMMITMENTS</div>
          <div className="kpi-value">{activeCommitments.length}</div>
        </div>
        <div className="kpi-card">
          <div className="section-title" style={{margin: 0}}>AT RISK</div>
          <div className="kpi-value" style={{color: atRisk.length > 0 ? 'var(--status-danger)' : 'inherit'}}>{atRisk.length}</div>
        </div>
        <div className="kpi-card">
          <div className="section-title" style={{margin: 0}}>PENDING APPROVALS</div>
          <div className="kpi-value" style={{color: pendingApprovals > 0 ? 'var(--accent-saffron)' : 'inherit'}}>{pendingApprovals}</div>
        </div>
        <div className="kpi-card">
          <div className="section-title" style={{margin: 0}}>TODAY'S CAPACITY</div>
          <div className="kpi-value">3h 40m</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)'}}>
          
          {/* PRIMARY ACTION COMPOSER */}
          <div className="card">
            <div className="section-title">Tell SAARTHI what changed...</div>
            <div className="input-composer">
              <input 
                type="text" 
                placeholder="Declare an intention or report a change..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div className="chip-container">
                  <div className="chip" onClick={() => setInput("I missed my session")}>"I missed my session"</div>
                  <div className="chip" onClick={() => setInput("I have less time today")}>"I have less time today"</div>
                </div>
                <button className="button primary" onClick={() => handleSend()} disabled={loading}>
                  Send ↗
                </button>
              </div>
            </div>
            {loading && intelligenceStep && (
               <div className="badge warning" style={{marginTop: '16px', animation: 'pulse 2s infinite'}}>
                 {intelligenceStep}
               </div>
            )}
          </div>

          {/* WHAT MATTERS NOW / DECISION SURFACE */}
          {(atRisk.length > 0 || proposedPlanEvent) && (
            <div className="card" style={{borderLeft: '3px solid var(--accent-saffron)'}}>
              <div className="section-title">WHAT MATTERS NOW</div>
              <div className="headline" style={{marginBottom: '8px'}}>{heroHeading}</div>
              <div className="body" style={{marginBottom: '16px'}}>{heroSub}</div>
              
              {/* Approval Action Center */}
              {proposedPlanEvent && (
                <div className="approval-box">
                  <div className="section-title" style={{color: 'var(--accent-saffron)'}}>ACTION REQUIRES YOUR APPROVAL</div>
                  <div className="headline" style={{fontSize: '1.1rem', marginBottom: '8px'}}>Review schedule change (Plan 0{proposedPlanEvent.plan_version})</div>
                  <div className="body" style={{marginBottom: '16px'}}>Impact: Constraints remain satisfied.</div>
                  <div style={{display: 'flex', gap: '12px'}}>
                    <button className="button primary" onClick={() => handleApprovePlan(JSON.parse(proposedPlanEvent.new_state).planId, proposedPlanEvent.plan_version)}>Approve change</button>
                    <button className="button">Reject</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIVING PLAN */}
          {stateData.commitments.length === 0 ? (
            <div className="empty-state">
              <div className="headline" style={{marginBottom: '8px'}}>No commitments yet.</div>
              <div className="body" style={{maxWidth: '400px', marginBottom: '24px'}}>
                SAARTHI works best when it has something to protect, plan, or adapt.
              </div>
              <button className="button primary" onClick={() => setInput("I want to commit to 2 hours of Deep Work every day.")}>
                Create Commitment →
              </button>
            </div>
          ) : (
            <LivingPlan stateData={stateData} />
          )}

        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)'}}>
          
          {/* NEEDS YOUR ATTENTION */}
          <div className="card">
            <div className="section-title">NEEDS YOUR ATTENTION</div>
            {pendingApprovals > 0 ? (
               <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                 <div>
                   <div className="headline" style={{fontSize: '0.95rem'}}>Review schedule change</div>
                   <div className="metadata">PLAN → PLAN 0{proposedPlanEvent?.plan_version || 2}</div>
                 </div>
                 <button className="button primary" style={{fontSize: '0.75rem', padding: '4px 8px'}}>Review</button>
               </div>
            ) : (
               <div className="metadata" style={{padding: '16px 0'}}>Nothing needs your attention.</div>
            )}
          </div>

          {/* MEMORY */}
          <div className="card">
            <div className="section-title">MEMORY</div>
            <div className="headline" style={{fontSize: '1rem', marginBottom: '12px'}}>SAARTHI Remembers</div>
            <div className="body" style={{fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px'}}>Constraints</div>
            <ul style={{paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
              {stateData.constraints.map((c: any) => (
                <li key={c.id} style={{marginBottom: '4px'}}>{c.value}</li>
              ))}
              {stateData.constraints.length === 0 && <li style={{listStyle: 'none', marginLeft: '-20px'}} className="metadata">No constraints set.</li>}
            </ul>
            <div className="divider" style={{margin: '16px 0', borderTop: '1px solid var(--border-color)'}} />
            <div className="metadata">
              <strong>Why this matters:</strong> These constraints are used when selecting recovery windows during replanning.
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="card">
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
               <div className="section-title" style={{margin: 0}}>ACTIVITY</div>
               <div style={{display: 'flex', gap: '8px'}}>
                 <span className="metadata" style={{color: 'var(--text-primary)', cursor: 'pointer'}}>All</span>
                 <span className="metadata" style={{cursor: 'pointer'}}>Plans</span>
               </div>
             </div>
             <table className="table">
               <tbody>
                 {stateData.events.length === 0 ? (
                   <tr><td colSpan={2} className="metadata" style={{textAlign: 'center', border: 'none'}}>No recent activity.</td></tr>
                 ) : (
                   stateData.events.slice(-5).reverse().map((trace: any) => (
                     <tr key={trace.id}>
                       <td style={{fontFamily: 'var(--font-mono)', color: 'var(--text-muted)'}}>
                         {new Date(trace.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </td>
                       <td>{trace.type.replace(/_/g, ' ')}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
