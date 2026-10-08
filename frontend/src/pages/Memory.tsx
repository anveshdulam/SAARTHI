import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LoginOverlay } from '../components/LoginOverlay';

export function Memory() {
  const { isAuthenticated, fetchState, stateData, handleSend, loading } = useSaarthiState();
  const [newMemory, setNewMemory] = useState('');

  if (!isAuthenticated) return <LoginOverlay onLogin={fetchState} />;

  const handleCreate = () => {
    if (newMemory.trim()) {
      handleSend(`Save this constraint: ${newMemory}`);
      setNewMemory('');
    }
  };

  return (
    <MainLayout>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="display" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>MEMORY</h1>
        <div className="body" style={{ color: 'var(--text-secondary)' }}>Context SAARTHI remembers and uses.</div>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          
          <div className="card">
            <div className="section-title">SAARTHI REMEMBERS</div>
            {stateData.constraints.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 0', border: 'none' }}>
                <div className="headline" style={{ marginBottom: '8px' }}>Nothing remembered yet.</div>
                <div className="body" style={{ maxWidth: '400px' }}>Give SAARTHI a constraint or preference.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stateData.constraints.map((c: any) => (
                  <div key={c.id} style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="headline" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{c.value}</div>
                      <span className="badge success">ACTIVE</span>
                    </div>
                    <div className="metadata" style={{ marginTop: '8px' }}>
                      <strong>Why it matters:</strong> Used when SAARTHI searches for viable recovery windows.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">WHAT SHOULD SAARTHI REMEMBER?</div>
            <div className="input-composer">
              <input 
                type="text" 
                placeholder="e.g. No study after 11 PM..." 
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                disabled={loading}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="button primary" onClick={handleCreate} disabled={loading}>Save constraint</button>
              </div>
            </div>
          </div>
          
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="card">
            <div className="section-title">PERSISTENT MEMORY</div>
            <div className="body" style={{ marginBottom: '16px' }}>Stored across sessions</div>
            <table className="table">
              <tbody>
                <tr><th style={{width: '50%'}}>CONSTRAINTS</th><td>{stateData.constraints.length}</td></tr>
                <tr><th>PREFERENCES</th><td>0</td></tr>
                <tr><th>PLANNING CONTEXT</th><td>Active</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
