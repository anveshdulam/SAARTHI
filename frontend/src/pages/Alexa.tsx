
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LoginOverlay } from '../components/LoginOverlay';
import { LivingPlan } from '../components/LivingPlan';

export function Alexa() {
  const { isAuthenticated, fetchState, messages, input, setInput, loading, intelligenceStep, stateData, handleSend, handleApprovePlan } = useSaarthiState();

  if (!isAuthenticated) return <LoginOverlay onLogin={fetchState} />;

  return (
    <MainLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-xl) 0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <div className="section-title">ALEXA+ EXPERIENCE</div>
          <h1 className="headline" style={{ color: 'var(--text-secondary)' }}>Voice-driven execution</h1>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
          
          {messages.length === 0 && !loading && (
            <div className="display" style={{ color: 'var(--text-muted)' }}>
              "Alexa, tell Saarthi..."
            </div>
          )}

          {messages.slice(-2).map((msg, idx) => (
            <div key={idx} className="fade-in" style={{ width: '100%', textAlign: 'center' }}>
              <div className="section-title" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                {msg.role === 'user' ? 'YOU' : 'SAARTHI'}
              </div>
              <div className="display" style={{ fontSize: msg.role === 'user' ? '1.75rem' : '2rem', color: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                "{msg.content}"
              </div>
              {idx === 0 && messages.length > 1 && (
                <div style={{ color: 'var(--border-color)', margin: '16px 0' }}>↓</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="fade-in" style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                <span className="badge warning">LISTENING</span>
                <span className="badge warning">THINKING</span>
              </div>
              {intelligenceStep && (
                <div className="mono" style={{ color: 'var(--accent-saffron)' }}>
                  {intelligenceStep}
                </div>
              )}
            </div>
          )}
          
          {!loading && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <span className="badge success">READY</span>
            </div>
          )}

        </div>

        {/* If there's a proposed plan, show it as a review card */}
        {stateData.events.find((e: any) => e.type === 'PLAN_PROPOSED') && (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <LivingPlan stateData={stateData} />
            <div className="approval-box fade-in slide-up" style={{ textAlign: 'center' }}>
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
                Review change
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <div className="input-composer">
            <input 
              type="text" 
              placeholder="Type your voice intent..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading}
              style={{ textAlign: 'center' }}
            />
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
