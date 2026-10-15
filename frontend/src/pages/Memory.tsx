import { useState } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Memory() {
  const { isAuthenticated, fetchState, stateData, getAuthHeaders } = useSaarthiState();
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'time_limit' | 'recurring_habit' | 'preference'>('time_limit');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const handleCreateConstraint = async (type: string, value: string, description: string) => {
    if (!value.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('http://localhost:3001/api/constraints', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, value, description })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to save' }));
        throw new Error(errData.error || 'Failed to save constraint');
      }
      setNewDesc('');
      setNewValue('');
      await fetchState();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    const val = newValue.trim() || newDesc.trim();
    handleCreateConstraint(newType, val, newDesc.trim());
  };

  const applyPreset = (type: 'time_limit' | 'recurring_habit' | 'preference', value: string, desc: string) => {
    handleCreateConstraint(type, value, desc);
  };

  const timeLimits = stateData.constraints.filter((c: any) => c.type === 'time_limit');
  const recurringHabits = stateData.constraints.filter((c: any) => c.type === 'recurring_habit');
  const preferences = stateData.constraints.filter((c: any) => c.type !== 'time_limit' && c.type !== 'recurring_habit');

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '64px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border-color)', paddingBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
                PERSISTENT CONTEXT & BOUNDARIES
              </div>
              <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                Agent Memory & Constraints
              </h1>
              <p style={{ color: 'var(--text-secondary-light)', maxWidth: '780px', fontSize: '1.05rem', lineHeight: 1.5, margin: 0 }}>
                Authoritative rules, hard cutoffs, and habits preserved across sessions. SAARTHI grounds every schedule repair in these stored invariants.
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="today-grid">
          
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
            
            {/* Active Constraints Card */}
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, margin: 0 }}>
                  ACTIVE STORED CONSTRAINTS ({stateData.constraints.length})
                </h2>
                <span className="badge success">PERSISTED IN SQLITE</span>
              </div>
              
              {stateData.constraints.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px 0', border: 'none' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                    <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M10.7 18.7a3 3 0 0 1-4.2-4.2l5.5-5.5a5 5 0 0 1 7.1 7.1l-5.5 5.5"/>
                    <circle cx="15.5" cy="15.5" r="2.5"/>
                  </svg>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                    No constraints remembered yet.
                  </div>
                  <div style={{ color: 'var(--text-secondary-light)', maxWidth: '420px', margin: '0 auto', fontSize: '14px' }}>
                    Provide SAARTHI with a hard cutoff (like "No study after 10 PM") or recurring habit to protect during replanning.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stateData.constraints.map((c: any) => {
                    const isTimeLimit = c.type === 'time_limit';
                    const isHabit = c.type === 'recurring_habit';
                    
                    return (
                      <div 
                        key={c.id} 
                        style={{ 
                          padding: '20px', 
                          borderRadius: '12px',
                          background: 'var(--workspace-elevated)',
                          border: '1px solid var(--border-color)',
                          borderLeft: isTimeLimit ? '4px solid var(--saffron)' : isHabit ? '4px solid var(--primary)' : '4px solid #10b981',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary-light)', lineHeight: 1.4 }}>
                            {c.description || c.value}
                          </div>
                          <span className={`badge ${isTimeLimit ? 'warning' : isHabit ? 'primary' : 'success'}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            {c.type.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted-light)' }}>Rule Value:</span>
                            <code style={{ background: 'var(--workspace-bg)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              {c.value}
                            </code>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                            </svg>
                            <span>Enforced during replanning</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create New Constraint Card */}
            <div className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '12px' }}>
                DEFINE A NEW CONSTRAINED INVARIANT
              </h2>
              <p style={{ color: 'var(--text-secondary-light)', fontSize: '13.5px', margin: '0 0 24px', lineHeight: 1.5 }}>
                Stored constraints are injected into Bedrock reasoning on every prompt and enforced authoritatively in the MCP scheduler.
              </p>

              <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary-light)', marginBottom: '6px' }}>
                      Constraint Category
                    </label>
                    <select 
                      value={newType} 
                      onChange={(e) => setNewType(e.target.value as any)}
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--workspace-bg)',
                        fontSize: '13.5px',
                        color: 'var(--text-primary-light)',
                        outline: 'none'
                      }}
                    >
                      <option value="time_limit">Hard Time Cutoff (e.g. Sleep / End of day)</option>
                      <option value="recurring_habit">Recurring Routine (e.g. Gym, Classes)</option>
                      <option value="preference">General Working Preference</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary-light)', marginBottom: '6px' }}>
                      Rule Value (Time or Key)
                    </label>
                    <input 
                      type="text"
                      placeholder={newType === 'time_limit' ? 'e.g. 22:00' : 'e.g. Tue/Thu'}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--workspace-bg)',
                        fontSize: '13.5px',
                        color: 'var(--text-primary-light)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary-light)', marginBottom: '6px' }}>
                    Human Description
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. No study sessions after 10 PM to protect sleep schedule" 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    disabled={saving}
                    style={{ 
                      width: '100%', 
                      background: 'var(--workspace-bg)', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)',
                      fontSize: '14px',
                      color: 'var(--text-primary-light)',
                      outline: 'none',
                      minHeight: '44px'
                    }}
                  />
                </div>

                {saveError && (
                  <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 500 }}>
                    {saveError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="button primary touch-target" 
                    disabled={saving || !newDesc.trim()}
                    style={{ minWidth: '160px' }}
                  >
                    {saving ? 'Saving...' : 'Save Constraint ↗'}
                  </button>
                </div>
              </form>

              {/* Quick Preset Buttons */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '12px' }}>
                  RECOMMENDED SCENARIO PRESETS
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    className="button ghost touch-target" 
                    style={{ fontSize: '12.5px' }} 
                    onClick={() => applyPreset('time_limit', '22:00', 'No study after 10 PM')}
                  >
                    + "No study after 10 PM" (22:00)
                  </button>
                  <button 
                    className="button ghost touch-target" 
                    style={{ fontSize: '12.5px' }} 
                    onClick={() => applyPreset('recurring_habit', 'Gym Tue/Thu', 'Gym on Tuesdays & Thursdays')}
                  >
                    + "Gym Tue/Thu"
                  </button>
                  <button 
                    className="button ghost touch-target" 
                    style={{ fontSize: '12.5px' }} 
                    onClick={() => applyPreset('time_limit', '23:30', 'Sleep by 11:30 PM')}
                  >
                    + "Sleep by 11:30 PM" (23:30)
                  </button>
                </div>
              </div>

            </div>
            
          </div>

          {/* Sidebar Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
            
            {/* Stats Card */}
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '20px' }}>
                MEMORY TELEMETRY
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Total Stored</span>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{stateData.constraints.length}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Hard Time Cutoffs</span>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--saffron)' }}>{timeLimits.length}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Recurring Habits</span>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>{recurringHabits.length}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary-light)' }}>General Preferences</span>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#10b981' }}>{preferences.length}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Cross-Session Recall</span>
                  <span className="badge success">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Architecture Explainer Card */}
            <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)', borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
                HOW SAARTHI USES CONSTRAINTS
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary-light)', marginBottom: '8px' }}>
                Dynamic Injection & Solver Bounding
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary-light)', lineHeight: 1.5, margin: 0 }}>
                1. <strong>Prompt Context:</strong> Bedrock Converse API prompt receives active constraints directly from SQLite via <code>list_constraints</code>.
              </p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary-light)', lineHeight: 1.5, margin: '8px 0 0' }}>
                2. <strong>Mathematical Cutoff:</strong> The solver passes <code>cutoffLocalTime</code> (e.g. <code>22:00</code>) to prevent proposing any study slots after the user's hard limit.
              </p>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
