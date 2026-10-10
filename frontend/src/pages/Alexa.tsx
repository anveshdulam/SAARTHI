import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';
import { LivingPlan } from '../components/LivingPlan';

export function Alexa() {
  const { isAuthenticated, fetchState, messages, input, setInput, loading, intelligenceStep, stateData, handleSend, handleApprovePlan } = useSaarthiState();

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  return (
    <MainLayout>
      <div style={{ 
        maxWidth: '840px', 
        margin: '0 auto', 
        paddingTop: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 72px)',
        position: 'relative'
      }}>
        
        <div style={{ paddingBottom: '32px', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
            COMMAND CENTER
          </div>
          <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
            Execution Terminal
          </h1>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '1.1rem', lineHeight: 1.5 }}>
            Instruct SAARTHI using natural language. The engine will parse your intent, consult active constraints, and execute changes.
          </p>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', paddingBottom: '140px', scrollbarWidth: 'none' }}>
          {messages.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: '80px 32px', border: 'none', margin: 'auto' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>System Ready</div>
              <div style={{ color: 'var(--text-secondary-light)', maxWidth: '400px', margin: '0 auto' }}>Type a command or execution intent below to begin.</div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              width: '100%' 
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
                {msg.role === 'user' ? 'YOU' : 'SAARTHI'}
              </div>
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--workspace-elevated)',
                color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary-light)',
                padding: '16px 24px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(21, 23, 26, 0.15)' : 'var(--shadow-sm)',
                maxWidth: '85%',
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                {msg.content.split('\n').map((line: string, i: number) => (
                  <span key={i}>
                    {line}
                    {i !== msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
                SAARTHI
              </div>
              <div style={{
                background: 'var(--workspace-elevated)',
                border: '1px solid var(--border-color)',
                padding: '16px 24px',
                borderRadius: '16px 16px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)' }} />
                <span style={{ color: 'var(--text-secondary-light)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                  {intelligenceStep || 'Processing intent...'}
                </span>
              </div>
            </div>
          )}

          {/* Plan Review Box injected into the timeline if one is proposed */}
          {stateData.events.find((e: any) => e.type === 'PLAN_PROPOSED') && (
            <div style={{ width: '100%', marginTop: '16px', background: 'var(--workspace-elevated)', border: '1px solid var(--saffron-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ padding: '16px 24px', background: 'var(--saffron-subtle)', borderBottom: '1px solid var(--saffron-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--saffron)' }}>Proposal Requires Approval</span>
                <span className="badge warning">PENDING</span>
              </div>
              <div style={{ padding: '24px' }}>
                <LivingPlan stateData={stateData} />
              </div>
              <div style={{ padding: '16px 24px', background: 'var(--workspace-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="button ghost">Dismiss</button>
                <button 
                  className="button primary" 
                  onClick={() => {
                    const event = stateData.events.slice().reverse().find((e: any) => e.type === 'PLAN_PROPOSED');
                    if (event) {
                      const plan = JSON.parse(event.new_state);
                      handleApprovePlan(plan.planId || plan.id, event.plan_version);
                    }
                  }}
                >
                  Approve Plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Input Area */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '0',
          right: '0',
          background: 'var(--workspace-bg)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          display: 'flex',
          padding: '8px',
          alignItems: 'center'
        }}>
          <input 
            type="text" 
            placeholder="Instruct SAARTHI..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
            style={{ 
              flex: 1, 
              background: 'transparent',
              border: 'none',
              padding: '12px 16px',
              fontSize: '1.1rem',
              color: 'var(--text-primary-light)',
              outline: 'none'
            }}
          />
          <button 
            className="button primary" 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{ 
              padding: '0 24px', 
              height: '40px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Execute
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>

      </div>
    </MainLayout>
  );
}
