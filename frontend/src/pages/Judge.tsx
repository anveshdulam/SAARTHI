import React from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';

export function Judge() {
  const { stateData, loading, intelligenceStep, handleSend } = useSaarthiState();

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: 'var(--spacing-xl)' }}>
        
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div className="section-title">WHY SAARTHI IS DIFFERENT</div>
          <h1 className="display" style={{ marginBottom: '8px' }}>Execution that adapts to reality.</h1>
          <p className="body-large" style={{ color: 'var(--text-secondary)' }}>
            An execution agent that remembers commitments, plans around constraints, and asks before taking consequential action.
          </p>
        </div>

        <div className="dashboard-grid">
          
          {/* Execution Narrative Timeline */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-xl)' }}>
            <div className="timeline" style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline" style={{ textAlign: 'center' }}>INTENTION</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>CONTEXT</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline" style={{ textAlign: 'center', color: 'var(--status-warning)' }}>RISK DETECTED</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline" style={{ textAlign: 'center' }}>PLAN / 03</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline" style={{ textAlign: 'center', color: 'var(--status-danger)' }}>SESSION MISSED</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline pulse" style={{ textAlign: 'center', color: 'var(--accent-saffron)' }}>REPLANNING</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline" style={{ textAlign: 'center' }}>PLAN / 04</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr', paddingBottom: '24px' }}>
                <div className="headline" style={{ textAlign: 'center', color: 'var(--text-primary)' }}>HUMAN APPROVAL</div>
                <div style={{ textAlign: 'center', color: 'var(--border-color)', marginTop: '8px' }}>↓</div>
              </div>
              <div className="timeline-item" style={{ gridTemplateColumns: '1fr' }}>
                <div className="headline" style={{ textAlign: 'center', color: 'var(--status-success)' }}>EXECUTION</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            
            {/* Live Technical Evidence */}
            <div className="card">
              <div className="section-title">TECHNICAL EVIDENCE</div>
              <table className="table">
                <tbody>
                  <tr>
                    <th style={{ width: '40%' }}>MCP</th>
                    <td className="mono" style={{ color: 'var(--text-primary)' }}>Streamable HTTP (2025-11-25)</td>
                  </tr>
                  <tr>
                    <th>Memory</th>
                    <td className="mono" style={{ color: 'var(--status-success)' }}>Persistent</td>
                  </tr>
                  <tr>
                    <th>Planner</th>
                    <td className="mono" style={{ color: 'var(--text-primary)' }}>Deterministic</td>
                  </tr>
                  <tr>
                    <th>Approval</th>
                    <td className="mono" style={{ color: 'var(--accent-saffron)' }}>Human controlled</td>
                  </tr>
                  <tr>
                    <th>Isolation</th>
                    <td className="mono" style={{ color: 'var(--text-primary)' }}>Enforced</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Live Demo Trigger */}
            <div className="card">
              <div className="section-title">LIVE SCENARIO DEMO</div>
              <p className="body" style={{ marginBottom: '16px' }}>
                Trigger a real scenario. SAARTHI will detect the risk, replan against constraints, and request approval.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="button primary" onClick={() => handleSend("I missed my session.")} disabled={loading}>
                  Run "Missed Session" Scenario
                </button>
                <button className="button" onClick={() => handleSend("I have a new constraint: no work after 10pm.")} disabled={loading}>
                  Run "New Constraint" Scenario
                </button>
              </div>
              {loading && intelligenceStep && (
                <div className="badge warning" style={{ marginTop: '16px' }}>
                  {intelligenceStep}
                </div>
              )}
            </div>

            {/* Live System Trace */}
            <div className="card">
              <div className="section-title">LIVE SYSTEM TRACE</div>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxHeight: '300px', overflowY: 'auto' }}>
                {stateData.events.length === 0 ? (
                  <div>Awaiting events...</div>
                ) : (
                  stateData.events.slice().reverse().map((event: any) => (
                    <div key={event.id} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(event.created_at).toISOString()}</span>
                      <br/>
                      <span style={{ color: 'var(--text-primary)' }}>{event.type}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
}
