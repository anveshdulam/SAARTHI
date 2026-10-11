import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LivingPlan } from '../components/LivingPlan';
import { LandingPage } from './LandingPage';

export function Plans() {
  const { isAuthenticated, fetchState, stateData, handleApprovePlan, loading } = useSaarthiState();
  const [activeTab, setActiveTab] = useState<'timeline' | 'diff'>('timeline');

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const proposedPlan = stateData.plans?.find((p: any) => p.status === 'proposed');
  const activePlan = stateData.plans?.find((p: any) => p.status === 'accepted') || stateData.plans?.[0];

  const currentDisplayPlan = proposedPlan || activePlan;
  const currentPlanBlocks = currentDisplayPlan 
    ? (stateData.plan_blocks || []).filter((b: any) => b.plan_id === currentDisplayPlan.id)
    : [];

  return (
    <MainLayout>
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '6px' }}>
            SCHEDULE GOVERNANCE · AUTHORITATIVE GATE
          </div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Living Plans
          </h1>
          <div style={{ color: 'var(--text-secondary-light)', fontSize: '1.05rem' }}>
            Inspect adaptive schedules, verify constraint compliance, and authorize proposed changes.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Active / Proposed Plan Card */}
        {proposedPlan ? (
          <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--saffron)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>
                    Version {proposedPlan.version}
                  </div>
                  <span className="badge warning">PROPOSED · AWAITING APPROVAL</span>
                </div>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted-light)' }}>
                  risk: {proposedPlan.risk_state || 'LOW'}
                </span>
              </div>
              <div style={{ color: 'var(--text-primary-light)', fontSize: '15px', lineHeight: 1.5, marginBottom: '12px' }}>
                {proposedPlan.reasoning || "Replanned to accommodate past-due sessions while preserving hard constraints."}
              </div>
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--workspace-bg)', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                fontSize: '13px', 
                color: 'var(--text-secondary-light)' 
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary-light)', marginBottom: '4px' }}>
                  Enforced Constraints & Invariants
                </div>
                <div>• Hard Cutoff: <strong>22:00</strong> (No study after 10 PM)</div>
                <div>• Scheduled Blocks: <strong>{currentPlanBlocks.length} commitments</strong></div>
                <div>• Optimistic Concurrency Lock: <strong>v{proposedPlan.version}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
              <button 
                className="button primary"
                disabled={loading}
                onClick={() => handleApprovePlan(proposedPlan.id, proposedPlan.version)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  fontWeight: 600
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderColor: '#FFFFFF', borderTopColor: 'transparent' }} />
                    <span>Committing Plan...</span>
                  </>
                ) : (
                  <>
                    <span>Approve & Commit Plan (v{proposedPlan.version})</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </>
                )}
              </button>
              <button 
                className="button ghost"
                onClick={() => setActiveTab(activeTab === 'diff' ? 'timeline' : 'diff')}
              >
                {activeTab === 'diff' ? 'View Timeline' : 'View Changes Diff'}
              </button>
            </div>
          </div>
        ) : activePlan ? (
          <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--accent-emerald, #10b981)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>
                    Version {activePlan.version}
                  </div>
                  <span className="badge success">ACTIVE PLAN</span>
                </div>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted-light)' }}>
                  risk: {activePlan.risk_state || 'LOW'}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary-light)', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>
                {activePlan.reasoning || "Active approved schedule currently guiding user commitments."}
              </div>
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--workspace-bg)', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                fontSize: '13px', 
                color: 'var(--text-secondary-light)' 
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary-light)', marginBottom: '4px' }}>
                  Commitment Status
                </div>
                <div>All {currentPlanBlocks.length} scheduled blocks are active and pending execution.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button className="button secondary" disabled style={{ opacity: 0.8 }}>
                Plan v{activePlan.version} Accepted ✓
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '32px', borderTop: '4px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Active Plans</div>
            <div style={{ color: 'var(--text-secondary-light)' }}>
              Use the Alexa terminal to report a schedule disruption and propose a living plan.
            </div>
          </div>
        )}
        
        {/* Historical Plans */}
        {stateData.plans && stateData.plans.length > 0 && stateData.plans.map((p: any) => {
          if (p.id === currentDisplayPlan?.id) return null; // Skip active one shown above
          return (
            <div key={p.id} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Version {p.version}</div>
                <span className={`badge ${p.status === 'accepted' ? 'success' : p.status === 'proposed' ? 'warning' : 'danger'}`}>
                  {p.status.toUpperCase()}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary-light)', fontSize: '14px', marginBottom: '8px' }}>
                {p.status === 'accepted' ? 'Previously active plan.' : p.status === 'invalidated' ? 'Superseded by newer proposal.' : 'Archived plan.'}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '12px', color: 'var(--text-muted-light)' }}>
                Created {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Details & Comparison */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 32px', background: 'var(--bg-elevated)' }}>
          <div 
            onClick={() => setActiveTab('timeline')}
            style={{ 
              padding: '18px 0', 
              borderBottom: activeTab === 'timeline' ? '2px solid var(--primary)' : '2px solid transparent', 
              color: activeTab === 'timeline' ? 'var(--primary)' : 'var(--text-secondary-light)', 
              fontWeight: 600, 
              cursor: 'pointer', 
              marginRight: '36px',
              fontSize: '14px'
            }}
          >
            Schedule Timeline ({currentPlanBlocks.length} Blocks)
          </div>
          <div 
            onClick={() => setActiveTab('diff')}
            style={{ 
              padding: '18px 0', 
              borderBottom: activeTab === 'diff' ? '2px solid var(--primary)' : '2px solid transparent', 
              color: activeTab === 'diff' ? 'var(--primary)' : 'var(--text-secondary-light)', 
              fontWeight: 600, 
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Diff & Prior Comparison</span>
            {proposedPlan && (
              <span className="badge warning" style={{ fontSize: '10px', padding: '2px 6px' }}>
                PROPOSAL DIFF
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '36px' }}>
          {!stateData.plans || stateData.plans.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0', border: 'none' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>No plans yet.</div>
              <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto' }}>
                SAARTHI generates a plan automatically when you report schedule events or run replanning.
              </div>
            </div>
          ) : activeTab === 'timeline' ? (
            <LivingPlan stateData={stateData} />
          ) : (
            /* Diff & Prior Comparison View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary-light)', lineHeight: 1.6 }}>
                Comparing current commitments against <strong>Plan v{currentDisplayPlan?.version}</strong> ({currentDisplayPlan?.status.toUpperCase()}). 
                All times reflect real database records.
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 16px' }}>Commitment</th>
                      <th style={{ padding: '12px 16px' }}>Type</th>
                      <th style={{ padding: '12px 16px' }}>Prior / Current Database Slot</th>
                      <th style={{ padding: '12px 16px' }}>Proposed Living Plan Slot</th>
                      <th style={{ padding: '12px 16px' }}>Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateData.commitments.map((c: any) => {
                      const proposedBlock = currentPlanBlocks.find((b: any) => b.commitment_id === c.id);
                      
                      const priorStart = c.start_time 
                        ? new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : null;
                      const priorEnd = c.end_time 
                        ? new Date(c.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : null;
                      const priorSlot = priorStart && priorEnd 
                        ? `${priorStart} - ${priorEnd}` 
                        : (c.estimated_minutes ? `Unscheduled (~${c.estimated_minutes}m)` : 'Unscheduled');

                      const propStart = proposedBlock 
                        ? new Date(proposedBlock.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : null;
                      const propEnd = proposedBlock 
                        ? new Date(proposedBlock.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : null;
                      const propSlot = propStart && propEnd ? `${propStart} - ${propEnd}` : 'Not scheduled';

                      const isChanged = priorSlot !== propSlot;
                      const isHard = c.type === 'hard';

                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', background: isChanged ? 'var(--workspace-elevated)' : 'transparent' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary-light)' }}>
                            {c.title}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={`badge ${isHard ? 'danger' : 'success'}`}>
                              {c.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-secondary-light)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                            {priorSlot}
                          </td>
                          <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: isChanged ? 600 : 400, color: isChanged ? 'var(--primary)' : 'var(--text-secondary-light)' }}>
                            {propSlot}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {isHard ? (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted-light)' }}>
                                Hard anchor (Fixed)
                              </span>
                            ) : isChanged ? (
                              <span className="badge warning" style={{ fontSize: '11px' }}>
                                Rescheduled
                              </span>
                            ) : (
                              <span className="badge success" style={{ fontSize: '11px' }}>
                                Preserved
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {proposedPlan && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  borderRadius: '10px', 
                  background: 'var(--workspace-bg)', 
                  border: '1px solid var(--saffron-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary-light)' }}>
                    Ready to commit? Approving updates commitment slots in the database and records a verifiable audit event.
                  </div>
                  <button
                    className="button primary"
                    disabled={loading}
                    onClick={() => handleApprovePlan(proposedPlan.id, proposedPlan.version)}
                    style={{ padding: '8px 20px', fontWeight: 600 }}
                  >
                    {loading ? 'Approving...' : `Authorize & Approve Plan v${proposedPlan.version}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
