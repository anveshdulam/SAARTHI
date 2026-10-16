import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Commitments() {
  const { isAuthenticated, fetchState, stateData, handleSend, loading, handleCompleteCommitment } = useSaarthiState();
  const [newTitle, setNewTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'AT_RISK' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommitment, setSelectedCommitment] = useState<any | null>(null);

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const active = stateData.commitments.filter((c: any) => c.status === 'pending');
  const atRisk = stateData.commitments.filter((c: any) => c.status === 'missed');
  const completed = stateData.commitments.filter((c: any) => c.status === 'completed');

  const filteredCommitments = stateData.commitments.filter((c: any) => {
    if (activeTab === 'ACTIVE' && c.status !== 'pending') return false;
    if (activeTab === 'AT_RISK' && c.status !== 'missed') return false;
    if (activeTab === 'COMPLETED' && c.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = c.title?.toLowerCase().includes(q);
      const typeMatch = c.type?.toLowerCase().includes(q);
      const statusMatch = c.status?.toLowerCase().includes(q);
      return titleMatch || typeMatch || statusMatch;
    }
    return true;
  });

  const handleCreate = () => {
    if (newTitle.trim()) {
      handleSend(`Create a new commitment: ${newTitle}`);
      setNewTitle('');
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '64px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border-color)', paddingBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
                INTENTIONS & TIME ALLOCATIONS
              </div>
              <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                Commitments
              </h1>
              <p style={{ color: 'var(--text-secondary-light)', fontSize: '1.05rem', margin: 0 }}>
                Hard commitments and flexible goals that SAARTHI actively defends and reschedules upon conflict.
              </p>
            </div>

            {/* Quick Add Intention Form */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="What do you need to accomplish?" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                style={{ 
                  width: '300px', 
                  minHeight: '44px',
                  padding: '0 16px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)',
                  background: 'var(--workspace-elevated)',
                  fontSize: '13.5px',
                  color: 'var(--text-primary-light)',
                  outline: 'none'
                }}
                disabled={loading}
              />
              <button 
                className="button primary touch-target" 
                onClick={handleCreate} 
                disabled={loading || !newTitle.trim()}
                style={{ minHeight: '44px', padding: '0 20px' }}
              >
                Add Intention ↗
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs and Data Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {/* Functional Filter Tabs & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', padding: '0 24px', background: 'var(--bg-elevated)', gap: '16px' }}>
            <div style={{ display: 'flex', overflowX: 'auto', gap: '28px' }}>
              <div 
                onClick={() => setActiveTab('ALL')}
                style={{ 
                  padding: '18px 0', 
                  borderBottom: activeTab === 'ALL' ? '2px solid var(--primary)' : '2px solid transparent', 
                  color: activeTab === 'ALL' ? 'var(--primary)' : 'var(--text-muted-light)', 
                  fontWeight: activeTab === 'ALL' ? 600 : 500, 
                  cursor: 'pointer', 
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap'
                }}
              >
                All Commitments ({stateData.commitments.length})
              </div>
              <div 
                onClick={() => setActiveTab('ACTIVE')}
                style={{ 
                  padding: '18px 0', 
                  borderBottom: activeTab === 'ACTIVE' ? '2px solid var(--primary)' : '2px solid transparent', 
                  color: activeTab === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted-light)', 
                  fontWeight: activeTab === 'ACTIVE' ? 600 : 500, 
                  cursor: 'pointer', 
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap'
                }}
              >
                Active Pending ({active.length})
              </div>
              <div 
                onClick={() => setActiveTab('AT_RISK')}
                style={{ 
                  padding: '18px 0', 
                  borderBottom: activeTab === 'AT_RISK' ? '2px solid var(--danger)' : '2px solid transparent', 
                  color: activeTab === 'AT_RISK' ? 'var(--danger)' : 'var(--text-muted-light)', 
                  fontWeight: activeTab === 'AT_RISK' ? 600 : 500, 
                  cursor: 'pointer', 
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap'
                }}
              >
                At Risk / Missed ({atRisk.length})
              </div>
              <div 
                onClick={() => setActiveTab('COMPLETED')}
                style={{ 
                  padding: '18px 0', 
                  borderBottom: activeTab === 'COMPLETED' ? '2px solid #10b981' : '2px solid transparent', 
                  color: activeTab === 'COMPLETED' ? '#10b981' : 'var(--text-muted-light)', 
                  fontWeight: activeTab === 'COMPLETED' ? 600 : 500, 
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap'
                }}
              >
                Completed ({completed.length})
              </div>
            </div>

            {/* Keyword Search Input */}
            <div style={{ padding: '8px 0', minWidth: '220px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search commitments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 30px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredCommitments.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 32px', border: 'none' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                No commitments in this view.
              </div>
              <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto', fontSize: '13.5px' }}>
                {activeTab === 'AT_RISK' ? 'Great news! No commitments are currently past due or at risk.' : 'Create an intention above to schedule it into your living plan.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--workspace-bg)' }}>
                    <th style={{ padding: '14px 24px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Intention</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Scheduled Window</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 24px', textAlign: 'right', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommitments.map((c: any) => {
                    const isHard = c.type === 'hard';
                    const isMissed = c.status === 'missed';
                    const isPending = c.status === 'pending';
                    const isCompleted = c.status === 'completed';

                    const timeWindow = c.start_time && c.end_time 
                      ? `${new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(c.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Flexible / Unscheduled';

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--workspace-border)' }}>
                        <td style={{ padding: '18px 24px', color: 'var(--text-primary-light)', fontWeight: 600, fontSize: '14.5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isMissed && <span style={{ color: 'var(--danger)', fontSize: '16px' }}>⚠️</span>}
                            <span>{c.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '18px 16px' }}>
                          <span className={`badge ${isHard ? 'primary' : 'neutral'}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                            {isHard ? 'HARD FIXED' : 'SOFT FLEX'}
                          </span>
                        </td>
                        <td style={{ padding: '18px 16px', color: 'var(--text-secondary-light)', fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                          {timeWindow}
                        </td>
                        <td style={{ padding: '18px 16px', color: 'var(--text-secondary-light)' }}>
                          {c.estimated_minutes ? `${c.estimated_minutes} min` : '90 min'}
                        </td>
                        <td style={{ padding: '18px 16px' }}>
                          <span className={`badge ${isMissed ? 'danger' : isCompleted ? 'success' : isPending ? 'success' : 'warning'}`}>
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {isPending && (
                              <button 
                                className="button primary touch-target" 
                                style={{ minHeight: '36px', padding: '0 14px', fontSize: '12px' }}
                                onClick={() => handleCompleteCommitment(c.id)}
                              >
                                Mark Done ✓
                              </button>
                            )}
                            <button 
                              className="button ghost touch-target" 
                              style={{ minHeight: '36px', padding: '0 14px', fontSize: '12px' }}
                              onClick={() => setSelectedCommitment(c)}
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commitment Inspector Modal */}
        {selectedCommitment && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(6px)'
          }}>
            <div style={{
              maxWidth: '520px',
              width: '100%',
              padding: '28px 32px',
              background: '#191B1F',
              color: '#ECEEF1',
              borderRadius: '14px',
              border: '1px solid #2E323B',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>Commitment Properties</h3>
                <button 
                  onClick={() => setSelectedCommitment(null)} 
                  style={{ background: 'none', border: 'none', color: '#9DA3AE', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#9DA3AE', width: '90px', flexShrink: 0, fontWeight: 500 }}>ID:</span>
                  <code style={{ fontSize: '11.5px', background: '#111315', padding: '3px 8px', borderRadius: '5px', color: '#E8B36E', border: '1px solid #23272F' }}>{selectedCommitment.id}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#9DA3AE', width: '90px', flexShrink: 0, fontWeight: 500 }}>Title:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{selectedCommitment.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#9DA3AE', width: '90px', flexShrink: 0, fontWeight: 500 }}>Type:</span>
                  <span style={{ color: '#ECEEF1', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedCommitment.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#9DA3AE', width: '90px', flexShrink: 0, fontWeight: 500 }}>Status:</span>
                  <span style={{ color: '#ECEEF1', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedCommitment.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#9DA3AE', width: '90px', flexShrink: 0, fontWeight: 500 }}>Start Time:</span>
                  <span style={{ color: '#ECEEF1', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedCommitment.start_time || 'None'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#9DA3AE', width: '90px', flexShrink: 0, fontWeight: 500 }}>End Time:</span>
                  <span style={{ color: '#ECEEF1', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedCommitment.end_time || 'None'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#9DA3AE', width: '90px', flexShrink: 0, fontWeight: 500 }}>Created:</span>
                  <span style={{ color: '#ECEEF1', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedCommitment.created_at}</span>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="button primary touch-target" 
                  onClick={() => setSelectedCommitment(null)}
                  style={{ background: '#E8B36E', color: '#111315', border: 'none', fontWeight: 650, borderRadius: '8px', padding: '10px 22px', fontSize: '13px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
