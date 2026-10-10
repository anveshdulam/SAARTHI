import React from 'react';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-12 ${className}`}>
      <div style={{ color: 'var(--saffron)' }} className="flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* SAARTHI Lotus Vector */}
          <path d="M12 22s-6-4.5-6-10c0-2.5 1.5-4.5 4-5.5 1.5-4 2-4.5 2-4.5s.5.5 2 4.5c2.5 1 4 3 4 5.5 0 5.5-6 10-6 10z" />
          <path d="M12 22s-10-6-10-12c0-3.5 2.5-6 6-6" />
          <path d="M12 22s10-6 10-12c0-3.5-2.5-6-6-6" />
          <path d="M12 22V12" />
        </svg>
      </div>
      <div className="logo" style={{ 
        fontSize: '1.1rem', 
        fontWeight: 600, 
        letterSpacing: '0.12em',
        color: 'var(--text-primary)'
      }}>
        SAARTHI
      </div>
    </div>
  );
}
