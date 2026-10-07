import React from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LivingPlan } from '../components/LivingPlan';

export function Plans() {
  const { stateData } = useSaarthiState();

  const activePlan = stateData.plans ? stateData.plans.find((p: any) => p.status === 'active') : null;
  const maxVersion = stateData.plans ? Math.max(0, ...stateData.plans.map((p: any) => p.version)) : 0;
  
  const upcomingBlocks = activePlan && activePlan.blocks ? activePlan.blocks.length : 0;
  const plansAtRisk = stateData.commitments.filter((c: any) => c.status === 'missed').length > 0 ? 1 : 0;

  return (
    <MainLayout>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="display" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>PLANS</h1>
        <div className="body" style={{ color: 'var(--text-secondary)' }}>Plans that adapt when reality changes.</div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="section-title" style={{ margin: 0 }}>ACTIVE PLAN</div>
          <div className="kpi-value">{activePlan ? `PLAN / 0${activePlan.version}` : 'None'}</div>
        </div>
        <div className="kpi-card">
          <div className="section-title" style={{ margin: 0 }}>CURRENT VERSION</div>
          <div className="kpi-value">v{maxVersion}</div>
        </div>
        <div className="kpi-card">
          <div className="section-title" style={{ margin: 0 }}>UPCOMING BLOCKS</div>
          <div className="kpi-value">{upcomingBlocks}</div>
        </div>
        <div className="kpi-card">
          <div className="section-title" style={{ margin: 0 }}>PLANS AT RISK</div>
          <div className="kpi-value" style={{ color: plansAtRisk > 0 ? 'var(--status-danger)' : 'inherit' }}>{plansAtRisk}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="card workspace-light" style={{ flex: 1 }}>
            <div className="section-title">CURRENT PLAN</div>
            {stateData.commitments.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 0', border: 'none' }}>
                <div className="headline" style={{ marginBottom: '8px' }}>No plans yet.</div>
                <div className="body" style={{ maxWidth: '400px' }}>
                  SAARTHI creates plans when there is something to organize.
                </div>
              </div>
            ) : (
              <LivingPlan stateData={stateData} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="card">
            <div className="section-title">PLAN VERSION HISTORY</div>
            <div className="timeline" style={{ marginTop: '16px' }}>
              {stateData.events.filter((e: any) => e.type === 'PLAN_PROPOSED' || e.type === 'PLAN_APPROVED').map((event: any, idx: number, arr: any[]) => {
                const planData = event.new_state ? JSON.parse(event.new_state) : {};
                return (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-time">
                      {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="timeline-content">
                      <div className="headline" style={{ fontSize: '1rem', color: event.type === 'PLAN_PROPOSED' ? 'var(--accent-saffron)' : 'var(--status-success)' }}>
                        PLAN / 0{event.plan_version}
                      </div>
                      <div className="metadata" style={{ marginBottom: '8px' }}>
                        {event.type.replace('_', ' ')}
                      </div>
                      {planData.explanation && (
                        <div className="body" style={{ fontSize: '0.85rem' }}>"{planData.explanation}"</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {stateData.events.length === 0 && (
                <div className="metadata">No plan history available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
