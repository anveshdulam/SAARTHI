import React, { useState } from 'react';

export function LoginOverlay({ onLogin }: { onLogin: () => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        onLogin();
      } else {
        setError("Invalid token");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--app-bg)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '400px', background: 'var(--sidebar-bg)' }}>
        <h2 className="headline" style={{ marginBottom: '16px' }}>SAARTHI Login</h2>
        <input 
          type="password" 
          value={token} 
          onChange={e => setToken(e.target.value)} 
          placeholder="Enter server token" 
          style={{ width: '100%', marginBottom: '16px', padding: '8px' }}
        />
        {error && <div style={{ color: 'var(--status-danger)', marginBottom: '16px' }}>{error}</div>}
        <button type="submit" className="button primary" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
}
