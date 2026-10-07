import React, { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';

export function Activity() {
  const { stateData } = useSaarthiState();
  const [filter, setFilter] = useState('ALL');

  const filters = ['ALL', 'COMMITMENTS', 'PLANS', 'APPROVALS', 'MEMORY', 'SYSTEM'];

  return (
    <MainLayout>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="display" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>ACTIVITY</h1>
        <div className="body" style={{ color: 'var(--text-secondary)' }}>Everything SAARTHI changed, proposed, and learned.</div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ display: 'flex', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {filters.map(f => (
            <div 
              key={f} 
              className="metadata" 
              style={{ cursor: 'pointer', color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: filter === f ? 600 : 400 }}
              onClick={() => setFilter(f)}
            >
              {f}
            </div>
          ))}
        </div>

        {stateData.events.length === 0 ? (
          <div className="empty-state" style={{ padding: '64px 0', border: 'none' }}>
            <div className="headline" style={{ marginBottom: '8px' }}>No activity yet.</div>
            <div className="body" style={{ maxWidth: '400px' }}>Your execution history will appear here.</div>
          </div>
        ) : (
          <table className="table" style={{ margin: '0' }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Time</th>
                <th>Event Type</th>
                <th>Entity</th>
                <th>Plan Version</th>
              </tr>
            </thead>
            <tbody>
              {stateData.events.slice().reverse().map((e: any) => (
                <tr key={e.id}>
                  <td className="mono" style={{ color: 'var(--text-muted)', paddingLeft: '24px' }}>
                    {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {e.type.replace(/_/g, ' ')}
                  </td>
                  <td className="metadata">
                    {e.entity || 'System'}
                  </td>
                  <td className="mono" style={{ color: 'var(--accent-saffron)' }}>
                    {e.plan_version ? `v${e.plan_version}` : '-'}
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
