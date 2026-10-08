import { useState, useEffect } from 'react';

export function useSaarthiState() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [intelligenceStep, setIntelligenceStep] = useState<string | null>(null);
  
  const [stateData, setStateData] = useState<{ commitments: any[], events: any[], constraints: any[], plans: any[] }>({
    commitments: [], events: [], constraints: [], plans: []
  });

  const getAuthToken = () => import.meta.env.VITE_SAARTHI_AUTH_TOKEN || "";

  const fetchState = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/state", { headers: { "Authorization": `Bearer ${getAuthToken()}` }});
      if (res.ok) {
        const data = await res.json();
        setStateData(data);
      }
    } catch (e) {
      console.error("Failed to fetch state:", e);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, []);

  const runCinematicSequence = async () => {
    setIntelligenceStep("UNDERSTANDING");
    await new Promise(r => setTimeout(r, 600));
    setIntelligenceStep("CONTEXT UPDATED");
    await new Promise(r => setTimeout(r, 600));
    setIntelligenceStep("CAPACITY RECALCULATED");
    await new Promise(r => setTimeout(r, 800));
    setIntelligenceStep("PLAN UPDATED");
    await new Promise(r => setTimeout(r, 400));
    setIntelligenceStep(null);
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ message: text.trim(), history: messages.filter(m => m.role !== 'agent') })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "agent", content: data.reply || data.error || "Done." }]);
      fetchState();
    } catch (err) {
      setMessages(prev => [...prev, { role: "agent", content: "I could not reach the execution engine. No actions were performed." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommitment = async (id: string) => {
    await fetch(`http://localhost:3001/api/commitments/${id}/approve`, { method: "POST", headers: { "Authorization": `Bearer ${getAuthToken()}` }});
    fetchState();
  };

  const handleApprovePlan = async (id: string, version: number) => {
    await fetch(`http://localhost:3001/api/plans/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getAuthToken()}` },
      body: JSON.stringify({ expectedVersion: version })
    });
    fetchState();
  };

  return {
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
