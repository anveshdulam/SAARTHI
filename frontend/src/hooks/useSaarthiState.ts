import { useState, useEffect } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  toolsExecuted?: string[];
  requestId?: string;
  isError?: boolean;
}

export function useSaarthiState() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [intelligenceStep, setIntelligenceStep] = useState<string | null>(null);
  
  const [stateData, setStateData] = useState<{ commitments: any[], events: any[], constraints: any[], plans: any[], plan_blocks: any[] }>({
    commitments: [], events: [], constraints: [], plans: [], plan_blocks: []
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const getAuthHeaders = async (baseHeaders: Record<string, string> = {}) => {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (idToken) {
        return { ...baseHeaders, Authorization: `Bearer ${idToken}` };
      }
    } catch {
      // Not signed in to Amplify / Cognito
    }

    // Fallback to demo token if demo mode is active
    return { ...baseHeaders, Authorization: `Bearer demo-token` };
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        return true;
      }
    } catch {
      // Amplify user session not present
    }

    const hasDemoOverride = sessionStorage.getItem('saarthi_demo_override') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
    if (hasDemoOverride) {
      setIsAuthenticated(true);
      return true;
    }

    setIsAuthenticated(false);
    return false;
  };

  const fetchState = async () => {
    try {
      const authed = await checkAuth();
      if (!authed) return;

      const headers = await getAuthHeaders();
      const res = await fetch("http://localhost:3001/api/state", { headers });
      if (res.ok) {
        setIsAuthenticated(true);
        const data = await res.json();
        setStateData(data);
      } else {
        if (res.status === 401) {
          setIsAuthenticated(false);
        }
        console.warn("Could not fetch state from backend:", res.status);
      }
    } catch (e) {
      console.error("Failed to fetch state:", e);
    }
  };

  const syncTimezone = async () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        await fetch("http://localhost:3001/api/preferences/timezone", {
          method: "PUT",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ timezone: tz })
        });
      }
    } catch (e) {
      console.error("Failed to sync timezone:", e);
    }
  };

  useEffect(() => {
    fetchState().then(() => {
      syncTimezone();
    });
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
        headers: await getAuthHeaders({ "Content-Type": "application/json" }),
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
        setMessages(prev => [...prev, { 
          role: "agent", 
          content: `❌ Execution Failed\n\n[${errCode}]\n${replyMsg}\n\nRequest ID: ${reqId}`,
          toolsExecuted: data.toolsExecuted || [],
          requestId: reqId,
          isError: true
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "agent", 
          content: data.reply || "Done.",
          toolsExecuted: data.toolsExecuted || [],
          requestId: reqId,
          isError: false
        }]);
      }
      
      fetchState();
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: `❌ Network or System Error\n\n[NETWORK_ERROR]\n${err.message || "Could not reach the execution engine."}`,
        isError: true
      }]);
    } finally {
      setLoading(false);
      setIntelligenceStep(null);
    }
  };

  const handleApproveCommitment = async (id: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/commitments/${id}/approve`, { 
        method: "POST", 
        headers: await getAuthHeaders() 
      });
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
        method: "POST", 
        headers: await getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ expectedVersion: version })
      });
      const reqId = response.headers.get("X-Request-ID") || "unknown";
      
      let data;
      try { data = await response.json(); } catch (e) { throw new Error("Invalid server response format."); }
      
      if (!response.ok || (data.success === false)) {
        const errCode = data.errorCode || "NETWORK_ERROR";
        const replyMsg = data.reply || data.error || "Plan approval failed.";
        setMessages(prev => [...prev, { role: "agent", content: `❌ Plan Approval Failed\n\n[${errCode}]\n${replyMsg}\n\nRequest ID: ${reqId}` }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "agent", 
          content: `✅ Plan v${version} Approved & Committed\n\nYour living schedule has been updated in the database. All commitments are synchronized.`,
          requestId: reqId
        }]);
      }
      
      fetchState();
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "agent", content: `❌ Network Error\n\n[NETWORK_ERROR]\n${err.message || "Failed to reach server."}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPlan = async (id: string, version: number, reason?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/plans/${id}/reject`, {
        method: "POST", 
        headers: await getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ expectedVersion: version, reason: reason || "User rejected proposed schedule" })
      });
      const reqId = response.headers.get("X-Request-ID") || "unknown";
      
      let data;
      try { data = await response.json(); } catch (e) { throw new Error("Invalid server response format."); }
      
      if (!response.ok || (data.success === false)) {
        const errCode = data.errorCode || "NETWORK_ERROR";
        const replyMsg = data.reply || data.error || "Plan rejection failed.";
        setMessages(prev => [...prev, { role: "agent", content: `❌ Plan Rejection Failed\n\n[${errCode}]\n${replyMsg}\n\nRequest ID: ${reqId}` }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "agent", 
          content: `⚠️ Plan v${version} Rejected\n\nThe proposed schedule was dismissed. Existing commitments remain unchanged.`,
          requestId: reqId
        }]);
      }
      
      fetchState();
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "agent", content: `❌ Network Error\n\n[NETWORK_ERROR]\n${err.message || "Failed to reach server."}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCommitment = async (id: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/commitments/${id}/complete`, {
        method: "POST",
        headers: await getAuthHeaders()
      });
      if (response.ok) {
        await fetchState();
      }
    } catch (err) {
      console.error("Failed to complete commitment:", err);
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
    handleApprovePlan,
    handleRejectPlan,
    handleCompleteCommitment,
    getAuthHeaders
  };
}
