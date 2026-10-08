import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LoginOverlay } from '../components/LoginOverlay';

export function Commitments() {
  const { isAuthenticated, fetchState, stateData, handleSend, loading } = useSaarthiState();
  const [newTitle, setNewTitle] = useState('');

  if (!isAuthenticated) return <LoginOverlay onLogin={fetchState} />;

  const active = stateData.commitments.filter((c: any) => c.status === 'pending');
  const atRisk = stateData.commitments.filter((c: any) => c.status === 'missed');
  const proposed = stateData.commitments.filter((c: any) => c.status === 'proposed');
  const completed = stateData.commitments.filter((c: any) => c.status === 'completed');

  const handleCreate = () => {
    if (newTitle.trim()) {
      handleSend(`Create a new commitment: ${newTitle}`);
      setNewTitle('');
    }
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="display" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>COMMITMENTS</h1>
        <div className="body" style={{ color: 'var(--text-secondary)' }}>Things SAARTHI is protecting.</div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card"><div className="section-title" style={{ margin: 0 }}>ACTIVE</div><div className="kpi-value">{active.length}</div></div>
        <div className="kpi-card"><div className="section-title" style={{ margin: 0 }}>AT RISK</div><div className="kpi-value" style={{ color: atRisk.length > 0 ? 'var(--status-danger)' : 'inherit' }}>{atRisk.length}</div></div>
        <div className="kpi-card"><div className="section-title" style={{ margin: 0 }}>PROPOSED</div><div className="kpi-value" style={{ color: proposed.length > 0 ? 'var(--accent-saffron)' : 'inherit' }}>{proposed.length}</div></div>
        <div className="kpi-card"><div className="section-title" style={{ margin: 0 }}>COMPLETED</div><div className="kpi-value">{completed.length}</div></div>
      </div>

      <div className="dashboard-grid">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="section-title" style={{ margin: 0 }}>COMMITMENT TABLE</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="New commitment..." 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 12px', borderRadius: '4px' }}
                disabled={loading}
              />
              <button className="button primary" onClick={handleCreate} disabled={loading}>Create</button>
            </div>
          </div>
          
          {stateData.commitments.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 0', border: 'none' }}>
              <div className="headline" style={{ marginBottom: '8px' }}>No commitments yet.</div>
              <div className="body" style={{ maxWidth: '400px' }}>Create something SAARTHI should protect.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Commitment</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stateData.commitments.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-primary)' }}>{c.title}</td>
                    <td>{c.estimated_minutes ? `${c.estimated_minutes} min` : 'N/A'}</td>
                    <td>
                      <span className={`badge ${c.status === 'missed' ? 'danger' : c.status === 'proposed' ? 'warning' : 'success'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td><button className="button" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
