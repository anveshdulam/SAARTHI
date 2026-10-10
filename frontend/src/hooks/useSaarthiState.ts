import { useState, useEffect } from 'react';

export function useSaarthiState() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [intelligenceStep, setIntelligenceStep] = useState<string | null>(null);
  
  const [stateData, setStateData] = useState<{ commitments: any[], events: any[], constraints: any[], plans: any[], plan_blocks: any[] }>({
    commitments: [], events: [], constraints: [], plans: [], plan_blocks: []
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/state", { credentials: "include" });
      if (res.ok) {
        setIsAuthenticated(true);
        const data = await res.json();
        setStateData(data);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Failed to fetch state:", e);
      setIsAuthenticated(false);
    }
  };

  const syncTimezone = async () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        await fetch("http://localhost:3001/api/preferences/timezone", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ timezone: tz })
        });
      }
    } catch (e) {
      console.error("Failed to sync timezone:", e);
    }
  };

  useEffect(() => {
    fetchState().then(() => {
      syncTimezone(); // sync once on load after checking auth
    });
    // P0: Removed the aggressive 1.5s global polling loop.
  }, []);

  const runCinematicSequence = async () => {
    // P0: Removed fake setTimeout sequences.
    // System status now accurately reflects the actual network loading state.
    setIntelligenceStep("EXECUTING");
  };

  const handleSend = async (customInput?: string) => {
    const text = customInput !== undefined ? customInput : input;
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: text.trim() }]);
    if (customInput === undefined) setInput('');
    setLoading(true);
    
    // Fire cinematic sequence asynchronously with the network call
    runCinematicSequence();
    
    try {
      const response = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text.trim(), history: messages.filter(m => m.role !== 'agent') })
      });
      
      const reqId = response.headers.get("X-Request-ID") || "unknown";
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Invalid server response format.");
      }

      if (!response.ok || !data.success) {
        const errCode = data.errorCode || "NETWORK_ERROR";
        const replyMsg = data.reply || data.error || "System failure.";
        setMessages(prev => [...prev, { role: "agent", content: `❌ Execution Failed\n\n[${errCode}]\n${replyMsg}\n\nRequest ID: ${reqId}` }]);
      } else {
        setMessages(prev => [...prev, { role: "agent", content: data.reply || "Done." }]);
      }
      
      fetchState();
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "agent", content: `❌ Network or System Error\n\n[NETWORK_ERROR]\n${err.message || "Could not reach the execution engine."}` }]);
    } finally {
      setLoading(false);
      setIntelligenceStep(null);
    }
  };

  const handleApproveCommitment = async (id: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/commitments/${id}/approve`, { method: "POST", credentials: "include" });
      const reqId = response.headers.get("X-Request-ID") || "unknown";
      
      let data;
      try { data = await response.json(); } catch (e) { throw new Error("Invalid server response format."); }
      
      if (!response.ok || !data.success) {
        const errCode = data.errorCode || "NETWORK_ERROR";
        const replyMsg = data.reply || data.error || "Approval failed.";
        setMessages(prev => [...prev, { role: "agent", content: `❌ Approval Failed\n\n[${errCode}]\n${replyMsg}\n\nRequest ID: ${reqId}` }]);
      }
      
      fetchState();
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "agent", content: `❌ Network Error\n\n[NETWORK_ERROR]\n${err.message || "Failed to reach server."}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async (id: string, version: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/plans/${id}/approve`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ expectedVersion: version })
      });
      const reqId = response.headers.get("X-Request-ID") || "unknown";
      
      let data;
      try { data = await response.json(); } catch (e) { throw new Error("Invalid server response format."); }
      
      if (!response.ok || (data.success === false)) {
        const errCode = data.errorCode || "NETWORK_ERROR";
        const replyMsg = data.reply || data.error || "Plan approval failed.";
        setMessages(prev => [...prev, { role: "agent", content: `❌ Plan Approval Failed\n\n[${errCode}]\n${replyMsg}\n\nRequest ID: ${reqId}` }]);
      }
      
      fetchState();
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "agent", content: `❌ Network Error\n\n[NETWORK_ERROR]\n${err.message || "Failed to reach server."}` }]);
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchState,
    isAuthenticated,
    setIsAuthenticated,
    messages,
    input,
    setInput,
    loading,
    intelligenceStep,
    stateData,
    handleSend,
    handleApproveCommitment,
    handleApprovePlan
  };
}
