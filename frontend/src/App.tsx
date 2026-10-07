import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Send, CheckCircle2, AlertTriangle, AlertCircle, Clock, Check, X } from 'lucide-react';
import './index.css';

function MainApp() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stateData, setStateData] = useState<{ commitments: any[], events: any[], constraints: any[] }>({
    commitments: [], events: [], constraints: []
  });

  const fetchState = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/state", { headers: { "Authorization": "Bearer saarthi-demo-token-2026" }});
      const data = await res.json();
      setStateData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput('');
    setLoading(true);
    
    setActionTrace([{ message: "Analyzing context", status: "pending" }]);

    try {
      const response = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer saarthi-demo-token-2026" },
        body: JSON.stringify({ message: userMsg, history: messages.filter(m => m.role !== 'agent') })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "agent", content: data.reply || data.error || "Done." }]);
      fetchState();
    } catch (err) {
      setMessages(prev => [...prev, { role: "agent", content: "I'm having trouble connecting to the execution engine." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommitment = async (id: string) => {
    await fetch(`http://localhost:3001/api/commitments/${id}/approve`, { method: "POST", headers: { "Authorization": "Bearer saarthi-demo-token-2026" }});
    fetchState();
  };

  const handleApprovePlan = async (id: string, version: number) => {
    await fetch(`http://localhost:3001/api/plans/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer saarthi-demo-token-2026" },
      body: JSON.stringify({ expectedVersion: version })
    });
    fetchState();
  };

  return (
    <div className="app-container">
      {/* LEFT PANEL: Conversation */}
      <div className="panel">
        <div className="heading">SAARTHI</div>
        <div className="caption" style={{marginBottom: "2rem"}}>From Intention to Action</div>
        
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", paddingRight: "1rem" }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={msg.role === 'user' ? 'message-user' : 'message-agent'}>
              {msg.role === 'agent' && <div className="caption" style={{marginBottom: "4px"}}>SAARTHI</div>}
              <div className="body">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message-agent caption" style={{opacity: 0.7}}>
              Processing...
            </div>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <input 
            type="text" 
            className="chat-input" 
            placeholder="What changed?" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="button primary" onClick={handleSend} disabled={loading}>
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* CENTER PANEL: Living Plan */}
      <div className="panel" style={{borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", padding: "0 2rem"}}>
        <div className="heading">Living Plan</div>
        
        {stateData.commitments.length === 0 && <div className="caption" style={{marginTop: "1rem"}}>No active commitments.</div>}
        
        {stateData.commitments.map((c: any) => (
          <div key={c.id} className={`plan-block ${c.status === 'proposed' ? 'risk-high' : ''}`}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
              <div>
                <div className="body" style={{fontWeight: 500}}>{c.title}</div>
                <div className="caption">Status: {c.status} | Type: {c.type}</div>
              </div>
              {c.status === 'proposed' && <AlertTriangle size={18} className="status-danger" />}
              {c.status === 'pending' && <Clock size={18} />}
            </div>
            {(c.start_time || c.end_time || c.estimated_minutes) && (
              <div style={{marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                <div>
                  <div className="caption">{c.estimated_minutes ? "Est. Minutes" : "Time"}</div>
                  <div className="mono">{c.estimated_minutes || `${c.start_time} - ${c.end_time}`}</div>
                </div>
              </div>
            )}
            
            {c.status === 'proposed' && (
              <div style={{marginTop: "1rem", display: "flex", gap: "0.5rem"}}>
                <button className="button primary" onClick={() => handleApproveCommitment(c.id)} style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"}}>
                  <Check size={16} /> Approve
                </button>
                <button className="button secondary" style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"}}>
                  <X size={16} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
        
        {stateData.events.filter((e: any) => e.type === 'PLAN_PROPOSED').map((e: any, idx: number) => {
          const plan = JSON.parse(e.new_state);
          return (
            <div key={idx} className="plan-block" style={{borderColor: "var(--primary)", backgroundColor: "rgba(10, 132, 255, 0.05)"}}>
              <div className="body" style={{fontWeight: 500, color: "var(--primary)"}}>Schedule Proposal v{e.plan_version}</div>
              <div className="caption" style={{marginTop: "0.5rem"}}>{plan.explanation}</div>
              <div style={{marginTop: "1rem", display: "flex", gap: "0.5rem"}}>
                <button className="button primary" onClick={() => handleApprovePlan(plan.id, e.plan_version)} style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"}}>
                  <Check size={16} /> Accept Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT PANEL: Context & Action Trace */}
      <div className="panel">
        <div className="heading">Action Trace</div>
        
        <div className="action-trace">
          {stateData.events.length === 0 ? (
            <div className="caption">Awaiting intention...</div>
          ) : (
            stateData.events.slice(0, 10).map((trace: any) => (
              <div key={trace.id} className="trace-item">
                <CheckCircle2 size={16} className="trace-status" />
                <span className="caption">[{trace.type}] {trace.entity} updated</span>
              </div>
            ))
          )}
        </div>

        <div style={{marginTop: "2rem"}}>
          <div className="heading" style={{fontSize: "1rem"}}>Active Constraints</div>
          {stateData.constraints.map((c: any) => (
             <div key={c.id} className="caption" style={{marginTop: "0.5rem"}}>• {c.value} {c.description && `(${c.description})`}</div>
          ))}
          {stateData.constraints.length === 0 && <div className="caption" style={{marginTop: "0.5rem"}}>No constraints set.</div>}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/alexa" element={<MainApp />} />
        <Route path="/judge" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
