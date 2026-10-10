import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Commitments() {
  const { isAuthenticated, fetchState, stateData, handleSend, loading } = useSaarthiState();
  const [newTitle, setNewTitle] = useState('');

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const active = stateData.commitments.filter((c: any) => c.status === 'pending');
  const atRisk = stateData.commitments.filter((c: any) => c.status === 'missed');
  const completed = stateData.commitments.filter((c: any) => c.status === 'completed');

  const handleCreate = () => {
    if (newTitle.trim()) {
      handleSend(`Create a new commitment: ${newTitle}`);
      setNewTitle('');
    }
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Commitments
          </h1>
          <div style={{ color: 'var(--text-secondary-light)', fontSize: '1.1rem' }}>
            The intentions SAARTHI is actively protecting.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="What do you need to do?" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="input"
            style={{ 
              width: '320px', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)',
              background: 'var(--workspace-elevated)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
            }}
            disabled={loading}
          />
          <button className="button primary" style={{ padding: '0 24px' }} onClick={handleCreate} disabled={loading || !newTitle.trim()}>
            Add Intention
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 32px', background: 'var(--bg-elevated)' }}>
          <div style={{ padding: '20px 0', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginRight: '40px' }}>
            Active ({active.length})
          </div>
          <div style={{ padding: '20px 0', color: 'var(--text-muted-light)', fontWeight: 500, cursor: 'pointer', marginRight: '40px' }}>
            At Risk ({atRisk.length})
          </div>
          <div style={{ padding: '20px 0', color: 'var(--text-muted-light)', fontWeight: 500, cursor: 'pointer' }}>
            Completed ({completed.length})
          </div>
        </div>

        {stateData.commitments.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 32px', border: 'none' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>No active commitments.</div>
            <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto' }}>Create an intention above. SAARTHI will generate a plan to help you achieve it.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--workspace-bg)' }}>
                <th style={{ padding: '16px 32px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Intention</th>
                <th style={{ padding: '16px 16px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Duration</th>
                <th style={{ padding: '16px 16px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 16px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Declared</th>
                <th style={{ padding: '16px 32px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {stateData.commitments.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--workspace-border)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover:bg-[var(--workspace-bg)]">
                  <td style={{ padding: '24px 32px', color: 'var(--text-primary-light)', fontWeight: 500, fontSize: '15px' }}>
                    {c.title}
                  </td>
                  <td style={{ padding: '24px 16px', color: 'var(--text-secondary-light)' }}>
                    {c.estimated_minutes ? `${c.estimated_minutes} min` : 'Unestimated'}
                  </td>
                  <td style={{ padding: '24px 16px' }}>
                    <span className={`badge ${c.status === 'missed' ? 'danger' : c.status === 'proposed' ? 'warning' : 'success'}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '24px 16px', color: 'var(--text-muted-light)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                    <button className="button ghost" style={{ padding: '8px 16px' }}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
