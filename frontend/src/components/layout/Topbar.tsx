import React from 'react';

export function Topbar() {
  return (
    <header className="topbar">
      <div className="headline" style={{fontSize: '1rem', fontWeight: 600}}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
        <div style={{padding: '4px 12px', background: 'var(--bg-elevated)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span>Search / Command</span>
          <span style={{fontFamily: 'var(--font-mono)'}}>⌘K</span>
        </div>
        <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem'}}>
          AD
        </div>
      </div>
    </header>
  );
}
