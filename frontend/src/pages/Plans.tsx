import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LivingPlan } from '../components/LivingPlan';
import { LandingPage } from './LandingPage';

export function Plans() {
  const { isAuthenticated, fetchState, stateData } = useSaarthiState();

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const maxVersion = stateData.plans && stateData.plans.length > 0 ? Math.max(...stateData.plans.map((p: any) => p.version)) : 0;
    
  return (
    <MainLayout>
      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Living Plans
          </h1>
          <div style={{ color: 'var(--text-secondary-light)', fontSize: '1.1rem' }}>
            Your strategies adapt when life changes.
          </div>
        </div>
        <div>
          <button className="button primary">Generate new plan</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {/* Active / Proposed Plan Card */}
        <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--saffron)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>Version {maxVersion || 1}</div>
              <span className="badge warning">PROPOSED</span>
            </div>
            <div style={{ color: 'var(--text-secondary-light)' }}>Generated just now to accommodate recent constraint changes.</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button className="button primary">Approve plan</button>
            <button className="button ghost">View changes</button>
          </div>
        </div>
        
        {/* Historical Plans */}
        {stateData.plans && stateData.plans.length > 0 && stateData.plans.map((p: any, idx: number) => {
          if (idx === 0) return null; // Skip the active/proposed one we just showed
          return (
            <div key={p.id} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Version {p.version}</div>
                <span className={`badge ${p.status === 'accepted' ? 'success' : 'danger'}`}>{p.status.toUpperCase()}</span>
              </div>
              <div style={{ color: 'var(--text-secondary-light)', marginBottom: '8px' }}>
                {p.status === 'accepted' ? 'Previously active plan.' : 'Rejected proposal.'}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '24px', fontSize: '13px', color: 'var(--text-muted-light)' }}>
                Generated {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Details / Timeline */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 32px', background: 'var(--bg-elevated)' }}>
          <div style={{ padding: '20px 0', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginRight: '40px' }}>
            Schedule Timeline
          </div>
          <div style={{ padding: '20px 0', color: 'var(--text-muted-light)', fontWeight: 500, cursor: 'pointer' }}>
            Diff & Changes
          </div>
        </div>
        <div style={{ padding: '40px' }}>
          {!stateData.plans || stateData.plans.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 0', border: 'none' }}>
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>No plans yet.</div>
              <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto' }}>
                SAARTHI generates a plan automatically when you add commitments.
              </div>
            </div>
          ) : (
            <LivingPlan stateData={stateData} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
