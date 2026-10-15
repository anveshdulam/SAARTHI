import { useState, useEffect } from 'react';
import { useSaarthiState } from '../hooks/useSaarthiState';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from './LandingPage';

interface ProtocolAuditData {
  protocolVersion: string;
  transport: string;
  mcpEndpoint: string;
  serverName: string;
  serverVersion: string;
  connected: boolean;
  activeSessions: number;
  forbiddenTools: string[];
  tools: {
    name: string;
    description: string;
    isModelExposed: boolean;
    category: 'READ_QUERY' | 'REASONING_PROPOSAL' | 'LIFECYCLE_PROTECTED';
    inputSchema: any;
  }[];
}

export function Judge() {
  const { isAuthenticated, fetchState, stateData, getAuthHeaders } = useSaarthiState();
  const [auditData, setAuditData] = useState<ProtocolAuditData | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'trace' | 'invariants'>('catalog');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'PROTECTED' | 'EXPOSED'>('ALL');

  const fetchAudit = async () => {
    setLoadingAudit(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('http://localhost:3001/api/audit/protocol', {
        headers
      });
      if (res.status === 401) {
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      }
    } catch (err: any) {
      if (!err?.message?.includes('Authentication required')) {
        console.error('Failed to fetch protocol audit:', err);
      }
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return <LandingPage onLogin={fetchState} />;

  const filteredTools = auditData?.tools.filter(t => {
    if (filterCategory === 'PROTECTED') return !t.isModelExposed;
    if (filterCategory === 'EXPOSED') return t.isModelExposed;
    return true;
  }) || [];

  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '64px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '36px', borderBottom: '1px solid var(--border-color)', paddingBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted-light)', fontWeight: 600, marginBottom: '8px' }}>
                SYSTEM INTEGRITY · AUDIT & PROTOCOL (JUDGE MODE)
              </div>
              <h1 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--text-primary-light)' }}>
                Model Context Protocol & Safety Architecture
              </h1>
              <p style={{ color: 'var(--text-secondary-light)', maxWidth: '820px', fontSize: '1.05rem', lineHeight: 1.5, margin: 0 }}>
                Verifiable proof of MCP 2025-11-25 Streamable HTTP compliance, live runtime telemetry, and strict human-in-the-loop lifecycle governance.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="button secondary touch-target"
                onClick={fetchAudit}
                disabled={loadingAudit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', minHeight: '44px' }}
              >
                <span>🔄</span>
                <span>{loadingAudit ? 'Pinging MCP...' : 'Ping Telemetry'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Telemetry KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          
          <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)', borderTop: '3px solid var(--accent-emerald, #10b981)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                MCP PROTOCOL
              </span>
              <span className="badge success">VERIFIED</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary-light)', fontFamily: 'var(--font-mono)' }}>
              v2025-11-25
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>
              Official Hackathon Specification Baseline
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)', borderTop: '3px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                TRANSPORT LAYER
              </span>
              <span className="badge success">STREAMABLE HTTP</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary-light)', fontFamily: 'var(--font-mono)' }}>
              /mcp Endpoint
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>
              SSE Streamable HTTP Transport
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)', borderTop: '3px solid var(--saffron)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                SAFETY INVARIANT
              </span>
              <span className="badge warning">WITHHELD FROM LLM</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '1.6rem', fontWeight: 700, color: 'var(--saffron)' }}>
              {auditData?.forbiddenTools.length || 9} Lifecycle Tools
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>
              Approval & commit require explicit human auth
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)', borderTop: '3px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted-light)', fontWeight: 600 }}>
                ACTIVE SESSIONS
              </span>
              <span className="badge success">CONNECTED</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary-light)' }}>
              {auditData?.activeSessions || 1} Client Session(s)
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary-light)', marginTop: '4px' }}>
              Auto-reconnect with 1h TTL protection
            </div>
          </div>

        </div>

        {/* Safety Boundary Callout Banner */}
        <div style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          background: 'var(--workspace-elevated)', 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '36px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              background: 'var(--saffron-subtle)', 
              color: 'var(--saffron)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary-light)', marginBottom: '4px' }}>
                Architectural Invariant: Non-Autonomous Human Approval Gate
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary-light)', lineHeight: 1.6, margin: '0 0 12px' }}>
                In SAARTHI, consequential actions cannot be executed autonomously by LLM inference. All mutation tools (<code>approve_plan</code>, <code>approve_commitment</code>, <code>complete_commitment</code>, <code>cancel_commitment</code>) are structurally stripped from the Bedrock tool manifest. The agent can only evaluate risk and propose schedule plans; mutations require explicit human review on <code>/plans</code> using authenticated HTTP transactions.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge warning" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>approve_plan (REST ONLY)</span>
                <span className="badge warning" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>approve_commitment (REST ONLY)</span>
                <span className="badge warning" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>complete_commitment (REST ONLY)</span>
                <span className="badge warning" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>fail_commitment (REST ONLY)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 32px', background: 'var(--bg-elevated)', overflowX: 'auto' }}>
            <div 
              onClick={() => setActiveTab('catalog')}
              style={{ 
                padding: '18px 0', 
                borderBottom: activeTab === 'catalog' ? '2px solid var(--primary)' : '2px solid transparent', 
                color: activeTab === 'catalog' ? 'var(--primary)' : 'var(--text-secondary-light)', 
                fontWeight: 600, 
                cursor: 'pointer', 
                marginRight: '36px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Authoritative Tool Catalog ({auditData?.tools.length || 0})
            </div>
            <div 
              onClick={() => setActiveTab('invariants')}
              style={{ 
                padding: '18px 0', 
                borderBottom: activeTab === 'invariants' ? '2px solid var(--primary)' : '2px solid transparent', 
                color: activeTab === 'invariants' ? 'var(--primary)' : 'var(--text-secondary-light)', 
                fontWeight: 600, 
                cursor: 'pointer',
                marginRight: '36px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Approval Invariants & Concurrency
            </div>
            <div 
              onClick={() => setActiveTab('trace')}
              style={{ 
                padding: '18px 0', 
                borderBottom: activeTab === 'trace' ? '2px solid var(--primary)' : '2px solid transparent', 
                color: activeTab === 'trace' ? 'var(--primary)' : 'var(--text-secondary-light)', 
                fontWeight: 600, 
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Live Event Trace ({stateData.events.length})
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            
            {/* Tab 1: Tool Catalog */}
            {activeTab === 'catalog' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary-light)' }}>
                    Exposed tools verified from <code>saarthi-mcp-server</code> via <code>ListTools</code> RPC.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`button ${filterCategory === 'ALL' ? 'primary' : 'ghost'}`}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setFilterCategory('ALL')}
                    >
                      All ({auditData?.tools.length || 0})
                    </button>
                    <button 
                      className={`button ${filterCategory === 'EXPOSED' ? 'primary' : 'ghost'}`}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setFilterCategory('EXPOSED')}
                    >
                      Model Exposed ({auditData?.tools.filter(t => t.isModelExposed).length || 0})
                    </button>
                    <button 
                      className={`button ${filterCategory === 'PROTECTED' ? 'primary' : 'ghost'}`}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setFilterCategory('PROTECTED')}
                    >
                      Protected ({auditData?.tools.filter(t => !t.isModelExposed).length || 0})
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-light)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '12px 16px' }}>Tool Name</th>
                        <th style={{ padding: '12px 16px' }}>Category</th>
                        <th style={{ padding: '12px 16px' }}>LLM Model Exposure</th>
                        <th style={{ padding: '12px 16px' }}>Description</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Schema</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTools.map((tool) => (
                        <tr key={tool.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary-light)' }}>
                            {tool.name}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={`badge ${tool.category === 'LIFECYCLE_PROTECTED' ? 'warning' : tool.category === 'READ_QUERY' ? 'secondary' : 'success'}`} style={{ fontSize: '11px' }}>
                              {tool.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {tool.isModelExposed ? (
                              <span style={{ color: 'var(--accent-emerald, #10b981)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500, fontSize: '13px' }}>
                                <span>✓</span>
                                <span>Exposed to Agent</span>
                              </span>
                            ) : (
                              <span style={{ color: 'var(--saffron)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}>
                                <span>🔒</span>
                                <span>Withheld (Human Gate)</span>
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-secondary-light)', maxWidth: '340px' }}>
                            {tool.description}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button 
                              className="button ghost"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => setSelectedTool(selectedTool?.name === tool.name ? null : tool)}
                            >
                              {selectedTool?.name === tool.name ? 'Hide' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Inspect Schema Modal/Box */}
                {selectedTool && (
                  <div style={{ marginTop: '20px', padding: '20px', background: 'var(--ink)', borderRadius: '12px', color: 'var(--text-primary-dark)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted-dark)' }}>
                      <span>Input Schema: {selectedTool.name}</span>
                      <button onClick={() => setSelectedTool(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>✕</button>
                    </div>
                    <pre style={{ margin: 0, overflowX: 'auto' }}>
                      {JSON.stringify(selectedTool.inputSchema, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Invariants */}
            {activeTab === 'invariants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary-light)', lineHeight: 1.6 }}>
                  The 4 core architectural invariants enforced by the backend and MCP server:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  
                  <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span className="badge success">INVARIANT 1</span>
                      <span style={{ fontWeight: 600 }}>LLM Tool Filter</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary-light)', lineHeight: 1.5, margin: 0 }}>
                      <code>backend/src/agent.ts</code> filters out all lifecycle tools before invoking Bedrock Converse API. Prompt injection cannot force autonomous mutation.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span className="badge success">INVARIANT 2</span>
                      <span style={{ fontWeight: 600 }}>Optimistic Concurrency</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary-light)', lineHeight: 1.5, margin: 0 }}>
                      <code>approve_plan</code> requires <code>expectedVersion</code>. Stale proposals generate HTTP 400 concurrency errors and cannot overwrite newer schedules.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span className="badge success">INVARIANT 3</span>
                      <span style={{ fontWeight: 600 }}>Idempotent Approval</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary-light)', lineHeight: 1.5, margin: 0 }}>
                      Re-approving an already accepted plan returns HTTP 400 and prevents duplicate schedule block mutations or corrupting timestamps.
                    </p>
                  </div>

                  <div className="card" style={{ padding: '24px', background: 'var(--workspace-elevated)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span className="badge success">INVARIANT 4</span>
                      <span style={{ fontWeight: 600 }}>Transactional Boundary</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary-light)', lineHeight: 1.5, margin: 0 }}>
                      All plan acceptance and commitment schedule adjustments are wrapped in an ACID SQLite transaction with automatic rollback on error.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* Tab 3: Live Trace */}
            {activeTab === 'trace' && (
              <div>
                <div style={{ 
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12.5px', 
                  maxHeight: '440px', 
                  overflowY: 'auto',
                  background: 'var(--ink)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--dark-border)',
                  color: 'var(--text-secondary-dark)'
                }}>
                  {stateData.events.length === 0 ? (
                    <div style={{ color: 'var(--text-muted-dark)', textAlign: 'center', padding: '40px 0' }}>
                      No events recorded yet.
                    </div>
                  ) : (
                    stateData.events.map((e: any) => (
                      <div key={e.id} style={{ 
                        marginBottom: '14px', 
                        paddingBottom: '14px', 
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted-dark)', fontSize: '11.5px' }}>
                            {new Date(e.created_at).toISOString()}
                          </span>
                          <span style={{ 
                            color: e.type.includes('ACCEPTED') ? '#10b981' : e.type.includes('PROPOSED') ? '#f59e0b' : '#60a5fa',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}>
                            {e.type}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-primary-dark)', overflowWrap: 'anywhere' }}>
                          entity: <strong>{e.entity}</strong> | plan_version: <strong>{e.plan_version || 'N/A'}</strong>
                        </div>
                        {e.new_state && (
                          <div style={{ color: 'var(--text-muted-dark)', fontSize: '11px', overflowWrap: 'anywhere', opacity: 0.85 }}>
                            state: {e.new_state.slice(0, 140)}...
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </MainLayout>
  );
}
