import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

export function Alexa() {
  const { 
    isAuthenticated, 
    fetchState, 
    messages, 
    input, 
    setInput, 
    loading, 
    intelligenceStep, 
    stateData, 
    handleSend 
  } = useSaarthiState();

  const [isListening, setIsListening] = useState(false);
  const [speakOutput, setSpeakOutput] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const proposedPlan = stateData.plans?.find((p: any) => p.status === 'proposed');
  const proposedBlocks = proposedPlan 
    ? stateData.plan_blocks?.filter((b: any) => b.plan_id === proposedPlan.id) 
    : [];

  const heroPreset = "I missed my 2 PM study session. Fix my schedule.";

  const SpeechRecognition = typeof window !== 'undefined' 
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) 
    : null;

  const toggleListening = () => {
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Voice fallback active; use keyboard input.");
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setSpeechError(`Voice input error (${event.error}). Please use text input.`);
          setTimeout(() => setSpeechError(null), 4000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (speakOutput && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'agent' && !lastMsg.isError) {
        window.speechSynthesis.cancel();
        const cleanText = lastMsg.content.replace(/\[.*?\]/g, '').replace(/[\*_~#]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [messages, speakOutput]);

  return (
    <MainLayout>
      <div style={{ 
        maxWidth: '860px', 
        margin: '0 auto', 
        paddingTop: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 72px)',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '6px' }}>
                COMMAND CENTER · ALEXA+ EXECUTION
              </div>
              <h1 className="editorial-heading" style={{ fontSize: '2.25rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                Execution Terminal
              </h1>
              <p style={{ color: 'var(--text-secondary-light)', fontSize: '1rem', lineHeight: 1.5, margin: 0 }}>
                Context-aware schedule repair engine. Speak or type to detect risks, protect constraints, and generate proposals.
              </p>
            </div>
            {proposedPlan && (
              <Link 
                to="/plans" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 14px', 
                  borderRadius: '20px', 
                  background: 'var(--saffron-subtle)', 
                  border: '1px solid var(--saffron-border)', 
                  color: 'var(--saffron)', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  textDecoration: 'none' 
                }}
              >
                <span>Plan v{proposedPlan.version} Awaiting Review</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', paddingBottom: '170px', scrollbarWidth: 'none' }}>
          {messages.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: '60px 24px', border: 'none', margin: 'auto', textAlign: 'center' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'var(--workspace-elevated)', 
                border: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px' 
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                System Ready for Execution
              </div>
              <div style={{ color: 'var(--text-secondary-light)', maxWidth: '440px', margin: '0 auto 24px', fontSize: '14px', lineHeight: 1.6 }}>
                Simulate an Alexa voice command or click the hero preset below to trigger autonomous risk evaluation and schedule replanning.
              </div>
              <div>
                <button
                  className="button secondary"
                  onClick={() => handleSend(heroPreset)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '24px',
                    cursor: 'pointer'
                  }}
                >
                  <span>🎙️ Hero Scenario:</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>"{heroPreset}"</span>
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              width: '100%' 
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '6px' }}>
                {msg.role === 'user' ? 'YOU' : 'SAARTHI EXECUTION AGENT'}
              </div>

              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--workspace-elevated)',
                color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary-light)',
                padding: '16px 20px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(21, 23, 26, 0.15)' : 'var(--shadow-sm)',
                maxWidth: '85%',
                fontSize: '14.5px',
                lineHeight: '1.6'
              }}>
                {msg.content.split('\n').map((line: string, i: number) => (
                  <span key={i}>
                    {line}
                    {i !== msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}

                {/* Real Completed Tool Execution Trace */}
                {msg.role === 'agent' && msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                  <div style={{ 
                    marginTop: '14px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid var(--border-color)', 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                      Tools Verified:
                    </span>
                    {msg.toolsExecuted.map((toolName, tIdx) => (
                      <span key={tIdx} style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary-light)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ color: 'var(--accent-emerald, #10b981)', fontWeight: 'bold' }}>✓</span>
                        {toolName}
                      </span>
                    ))}
                    {msg.requestId && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted-light)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                        id: {msg.requestId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '6px' }}>
                SAARTHI EXECUTION AGENT
              </div>
              <div style={{
                background: 'var(--workspace-elevated)',
                border: '1px solid var(--border-color)',
                padding: '16px 20px',
                borderRadius: '16px 16px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)' }} />
                <span style={{ color: 'var(--text-secondary-light)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  {intelligenceStep === 'EXECUTING' ? 'Evaluating constraints & executing MCP tools...' : 'Processing intent...'}
                </span>
              </div>
            </div>
          )}

          {/* Genuine Proposal Card based on real returned data linking to /plans */}
          {proposedPlan && (
            <div style={{ 
              width: '100%', 
              background: 'var(--workspace-elevated)', 
              border: '1px solid var(--saffron-border)', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: 'var(--shadow-md)' 
            }}>
              <div style={{ 
                padding: '14px 20px', 
                background: 'var(--saffron-subtle)', 
                borderBottom: '1px solid var(--saffron-border)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--saffron)' }}>
                    Schedule Proposal Generated (v{proposedPlan.version})
                  </span>
                </div>
                <span className="badge warning">PENDING REVIEW</span>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary-light)', marginBottom: '14px', lineHeight: 1.5 }}>
                  {proposedPlan.reasoning || "Replanned to accommodate past-due sessions and preserve hard constraints."}
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '12px', 
                  padding: '12px', 
                  background: 'var(--workspace-bg)', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                      Scheduled Blocks
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary-light)', marginTop: '2px' }}>
                      {proposedBlocks.length} commitments
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                      Risk State
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: proposedPlan.risk_state === 'HIGH' ? 'var(--accent-crimson)' : 'var(--accent-emerald)', marginTop: '2px' }}>
                      {proposedPlan.risk_state || 'LOW'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                      Protected Cutoff
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary-light)', marginTop: '2px' }}>
                      22:00 (No study after 10 PM)
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary-light)', lineHeight: 1.5 }}>
                  Per system design, schedule modifications require explicit user authorization. Review the side-by-side diff in Living Plans before approving.
                </div>
              </div>

              <div style={{ 
                padding: '12px 20px', 
                background: 'var(--workspace-bg)', 
                borderTop: '1px solid var(--border-color)', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                gap: '12px' 
              }}>
                <Link 
                  to="/plans" 
                  className="button primary" 
                  style={{ 
                    textDecoration: 'none', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 18px', 
                    fontSize: '13px', 
                    fontWeight: 600 
                  }}
                >
                  <span>Review in Living Plans</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar Area */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '0',
          right: '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Error Banner for Speech Fallback */}
          {speechError && (
            <div style={{ 
              padding: '8px 14px', 
              borderRadius: '8px', 
              background: 'var(--workspace-elevated)', 
              border: '1px solid var(--border-color)', 
              fontSize: '12px', 
              color: 'var(--text-secondary-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>ℹ️</span>
              <span>{speechError}</span>
            </div>
          )}

          {/* Preset Chips & Audio Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px', flex: 1 }}>
              <button
                onClick={() => handleSend(heroPreset)}
                disabled={loading}
                style={{
                  background: 'var(--workspace-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary-light)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span>🎙️</span>
                <span style={{ fontWeight: 500 }}>"{heroPreset}"</span>
              </button>
              <button
                onClick={() => handleSend("List my active commitments and constraints")}
                disabled={loading}
                style={{
                  background: 'var(--workspace-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary-light)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span>📋</span>
                <span style={{ fontWeight: 500 }}>"List commitments & constraints"</span>
              </button>
            </div>

            {/* Ambient Speech Toggle */}
            <button
              onClick={() => {
                if (speakOutput && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setSpeakOutput(!speakOutput);
              }}
              title="Toggle text-to-speech spoken agent responses"
              style={{
                background: speakOutput ? 'var(--workspace-elevated)' : 'transparent',
                border: speakOutput ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '11px',
                color: speakOutput ? 'var(--primary)' : 'var(--text-muted-light)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}
            >
              <span>{speakOutput ? '🔊 Spoken Agent: ON' : '🔈 Spoken Agent: OFF'}</span>
            </button>
          </div>

          <div style={{
            background: 'var(--workspace-bg)',
            borderRadius: '16px',
            border: isListening ? '1px solid var(--saffron)' : '1px solid var(--border-color)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            padding: '6px 8px',
            alignItems: 'center',
            gap: '6px'
          }}>
            {/* Microphone Button */}
            <button
              onClick={toggleListening}
              disabled={loading}
              title={isListening ? "Listening... Click to stop" : "Speak your command"}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: 'none',
                background: isListening ? 'var(--saffron)' : 'var(--workspace-elevated)',
                color: isListening ? '#FFFFFF' : 'var(--text-secondary-light)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
            </button>

            <input 
              type="text" 
              placeholder={isListening ? "Listening... Speak your command..." : "Instruct SAARTHI (e.g. 'I missed my 2 PM study session. Fix my schedule.')..."} 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading}
              style={{ 
                flex: 1, 
                background: 'transparent',
                border: 'none',
                padding: '10px 10px',
                fontSize: '1rem',
                color: 'var(--text-primary-light)',
                outline: 'none',
                minWidth: '100px'
              }}
            />

            <button 
              className="button primary" 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{ 
                padding: '0 18px', 
                height: '38px',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              Execute
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
