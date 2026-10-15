import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword, signOut } from 'aws-amplify/auth';
import { BrandLogo } from '../components/layout/BrandLogo';

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp' | 'confirm' | 'forgot' | 'reset'>('signIn');
  const [email, setEmail] = useState(() => localStorage.getItem('saarthi_auth_email') || '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendInfo, setResendInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpUsername, setSignUpUsername] = useState(() => localStorage.getItem('saarthi_auth_username') || '');

  const getUsernameFromEmail = (rawEmail: string) => {
    return rawEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
  };

  const handleDemoEnter = () => {
    sessionStorage.setItem('saarthi_demo_override', 'true');
    onLogin();
  };

  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password) },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) }
  ];

  const handleResendCode = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setResendInfo('');
    try {
      const targetUser = signUpUsername || localStorage.getItem('saarthi_auth_username') || getUsernameFromEmail(email) || email;
      try {
        await resendSignUpCode({ username: targetUser });
      } catch (err: any) {
        if (targetUser !== email) {
          await resendSignUpCode({ username: email });
        } else {
          throw err;
        }
      }
      setResendInfo('A fresh verification code was sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setResendInfo('');
    
    try {
      if (authMode === 'signIn') {
        let result;
        try {
          result = await signIn({ username: email, password });
        } catch (signInErr: any) {
          if (signInErr.name === 'UserAlreadyAuthenticatedException' || signInErr.message?.includes('already a signed in user')) {
            try {
              await signOut();
              result = await signIn({ username: email, password });
            } catch (retryErr: any) {
              sessionStorage.removeItem('saarthi_demo_override');
              await onLogin();
              return;
            }
          } else {
            throw signInErr;
          }
        }
        
        if (result.isSignedIn) {
          sessionStorage.removeItem('saarthi_demo_override');
          try {
            await onLogin();
          } catch (e) {
            setError("Failed to initialize user session after login.");
            setLoading(false);
          }
          return;
        } else if (result.nextStep) {
          const step = result.nextStep.signInStep;
          if (step === 'CONFIRM_SIGN_UP') {
            const derived = localStorage.getItem('saarthi_auth_username') || getUsernameFromEmail(email);
            setSignUpUsername(derived);
            setAuthMode('confirm');
            setCode('');
          } else if (step === 'RESET_PASSWORD') {
            setAuthMode('forgot');
          } else if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
            setError('Account requires a new password. Please use the "Forgot Password" flow.');
          } else {
            setError(`Unsupported challenge: ${step}. Please contact support.`);
          }
        }
      } else if (authMode === 'signUp') {
        const derivedUsername = getUsernameFromEmail(email);
        setSignUpUsername(derivedUsername);
        localStorage.setItem('saarthi_auth_username', derivedUsername);
        localStorage.setItem('saarthi_auth_email', email);

        const result = await signUp({ 
          username: derivedUsername, 
          password, 
          options: { userAttributes: { email, birthdate: '1990-01-01' } } 
        });
        
        if (result.isSignUpComplete) {
          setAuthMode('signIn');
        } else if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          setAuthMode('confirm');
          setCode('');
        } else {
          setError(`Unsupported sign-up step: ${result.nextStep?.signUpStep}`);
        }
      } else if (authMode === 'confirm') {
        const targetUsername = signUpUsername || localStorage.getItem('saarthi_auth_username') || getUsernameFromEmail(email) || email;
        try {
          await confirmSignUp({ username: targetUsername, confirmationCode: code.trim() });
        } catch (firstErr: any) {
          if (targetUsername !== email) {
            await confirmSignUp({ username: email, confirmationCode: code.trim() });
          } else {
            throw firstErr;
          }
        }
        setAuthMode('signIn');
        setPassword('');
        setCode('');
        setResendInfo('Email verified successfully! Please sign in with your password.');
      } else if (authMode === 'forgot') {
        const result = await resetPassword({ username: email });
        if (result.nextStep?.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
          setAuthMode('reset');
          setCode('');
          setPassword('');
        } else if (result.nextStep?.resetPasswordStep === 'DONE') {
          setAuthMode('signIn');
        } else {
          setError(`Unsupported reset step: ${result.nextStep?.resetPasswordStep}`);
        }
      } else if (authMode === 'reset') {
        await confirmResetPassword({ username: email, confirmationCode: code.trim(), newPassword: password });
        setAuthMode('signIn');
        setPassword('');
        setCode('');
        setResendInfo('Password reset successfully! Please sign in.');
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFBF7', color: 'var(--text-primary-light)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation */}
      <nav style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: 'var(--sp-24) var(--sp-40)'
      }}>
        <BrandLogo />
        <div style={{ display: 'flex', gap: 'var(--sp-24)', alignItems: 'center' }}>
          <a href="#workflow" style={{ fontSize: 'var(--fs-14)', fontWeight: 500, color: 'var(--text-secondary-light)' }}>Product</a>
          <a href="#workflow" style={{ fontSize: 'var(--fs-14)', fontWeight: 500, color: 'var(--text-secondary-light)' }}>Philosophy</a>
          <button className="button ghost" onClick={() => setShowLogin(true)} style={{ color: 'var(--text-primary-light)', fontWeight: 600 }}>Log in</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center', 
        paddingTop: '160px',
        paddingBottom: '80px',
        paddingLeft: '20px',
        paddingRight: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Background Image with Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url(/hero-scenic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(253, 251, 247, 0.7) 0%, rgba(253, 251, 247, 0.95) 40%, rgba(253, 251, 247, 1) 100%)'
          }}></div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          
          <h1 className="editorial-heading" style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
            color: '#2C2A28', 
            marginBottom: 'var(--sp-24)',
            maxWidth: '800px',
            lineHeight: 1.1,
            overflowWrap: 'break-word'
          }}>
            From Intention to Action.
          </h1>
          
          <p style={{ 
            fontSize: 'var(--fs-18)', 
            color: '#5C5852', 
            maxWidth: '600px', 
            lineHeight: 'var(--lh-relaxed)', 
            marginBottom: 'var(--sp-48)' 
          }}>
            The execution engine that protects your commitments, organizes your plans, and remembers your context.
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--sp-16)' }}>
            <button className="button primary lg" style={{ padding: '0 32px' }} onClick={() => setShowLogin(true)}>
              Enter Workspace
            </button>
            <a href="#workflow" className="button ghost lg" style={{ color: '#5C5852', border: '1px solid #E5E2D9' }}>
              See how it works
            </a>
          </div>
          
          {/* Detailed Product Preview */}
          <div className="landing-mockup-preview" style={{ 
            marginTop: '80px', 
            width: '100%', 
            maxWidth: '1100px', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '1px solid var(--border-color)', 
            boxShadow: 'var(--shadow-overlay)', 
            display: 'flex', 
            height: '600px', 
            backgroundColor: 'var(--app-bg)',
            textAlign: 'left'
          }}>
            {/* Fake Sidebar */}
            <div className="landing-mockup-sidebar" style={{ width: '220px', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--dark-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px' }}>
                <BrandLogo className="opacity-70" />
              </div>
              <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-primary-dark)', fontSize: '13px' }}>Today</div>
                <div style={{ padding: '8px 12px', color: 'var(--text-secondary-dark)', fontSize: '13px' }}>Plans</div>
                <div style={{ padding: '8px 12px', color: 'var(--text-secondary-dark)', fontSize: '13px' }}>Commitments</div>
                <div style={{ padding: '8px 12px', color: 'var(--text-secondary-dark)', fontSize: '13px' }}>Memory</div>
              </div>
            </div>
            
            {/* Fake Workspace */}
            <div className="workspace-light" style={{ flex: 1, backgroundColor: 'var(--workspace-bg)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '72px', borderBottom: '1px solid var(--workspace-border)', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary-light)' }}>Monday, October 10</span>
              </div>
              <div style={{ padding: '40px 60px', flex: 1, display: 'flex', gap: '40px' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Active Focus</h2>
                  <div style={{ padding: '24px', background: 'var(--workspace-elevated)', border: '1px solid var(--workspace-border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>IN PROGRESS</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted-light)' }}>10:30 AM - 12:00 PM</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Finalize Q4 Architecture Review</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary-light)' }}>Review the infrastructure changes proposed by the core team and ensure compliance with latency guidelines.</div>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, marginTop: '16px' }}>Upcoming</h2>
                  <div style={{ padding: '16px', background: 'var(--workspace-elevated)', border: '1px solid var(--workspace-border)', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                     <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--saffron)' }}></div>
                     <div>
                       <div style={{ fontWeight: 500 }}>Sync with Product Team</div>
                       <div style={{ fontSize: '13px', color: 'var(--text-secondary-light)' }}>1:00 PM • Strategic Planning</div>
                     </div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Context</h2>
                  <div style={{ padding: '20px', background: 'var(--workspace-elevated)', border: '1px solid var(--workspace-border)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted-light)', letterSpacing: '0.05em', marginBottom: '12px' }}>MEMORY CONSTRAINT</div>
                    <div style={{ fontSize: '14px', lineHeight: 1.5 }}>"Always prioritize latency in architectural decisions. If a change adds &gt;50ms overhead, it requires executive approval."</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Workflow Section */}
      <section id="workflow" style={{ 
        backgroundColor: 'white', 
        padding: '120px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        borderTop: '1px solid #E5E2D9' 
      }}>
        <h2 className="editorial-heading" style={{ fontSize: '2.5rem', marginBottom: '80px', color: '#2C2A28' }}>The Engine's Workflow</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '48px', maxWidth: '1100px', width: '100%' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--saffron)' }}>01. Plan</div>
            <div style={{ color: '#5C5852', lineHeight: '1.6' }}>Living plans adapt when life changes. Generate flexible strategies instead of rigid tasks.</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--saffron)' }}>02. Commit</div>
            <div style={{ color: '#5C5852', lineHeight: '1.6' }}>Declare intentions. SAARTHI tracks them and alerts you when they are at risk.</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--saffron)' }}>03. Execute</div>
            <div style={{ color: '#5C5852', lineHeight: '1.6' }}>Focus on the current step with a distraction-free timeline and workspace context.</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--saffron)' }}>04. Review</div>
            <div style={{ color: '#5C5852', lineHeight: '1.6' }}>Retain context indefinitely. Memory constraints ensure SAARTHI learns your preferences over time.</div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 20px', borderTop: '1px solid #E5E2D9', display: 'flex', justifyContent: 'center', color: '#8C8882', backgroundColor: '#FDFBF7' }}>
        <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <BrandLogo />
            <span style={{ fontSize: '13px' }}>© 2026</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', flexWrap: 'wrap' }}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">System Status</a>
          </div>
        </div>
      </footer>

      {/* Login Overlay */}
      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '440px', 
            backgroundColor: 'var(--workspace-elevated)', 
            borderColor: 'var(--workspace-border)',
            boxShadow: 'var(--shadow-overlay)',
            padding: '32px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h2 className="editorial-heading" style={{ fontSize: '1.75rem', marginBottom: '8px', color: '#2C2A28' }}>
                  {authMode === 'signIn' ? "Welcome back" : 
                   authMode === 'signUp' ? "Create an account" : 
                   authMode === 'confirm' ? "Verify your email" : 
                   "Account recovery"}
                </h2>
                <p style={{ color: 'var(--text-secondary-light)' }}>
                  {authMode === 'confirm' ? "Enter the code sent to your email." : 
                   authMode === 'reset' ? "Enter your new password and the code sent to your email." :
                   "Authenticate to access your workspace."}
                </p>
              </div>
              <button className="icon-button" onClick={() => setShowLogin(false)} style={{ color: 'var(--text-muted-light)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {(authMode === 'signIn' || authMode === 'signUp' || authMode === 'forgot') && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label" style={{ color: 'var(--text-primary-light)', fontWeight: 500 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" className={`input ${error ? 'error' : ''}`} style={{ width: '100%', backgroundColor: 'var(--workspace-bg)', color: 'var(--text-primary-light)', borderColor: error ? 'var(--danger)' : 'var(--workspace-border)', padding: '12px 16px', fontSize: '16px' }} disabled={loading} autoFocus />
                </div>
              )}
              
              {(authMode === 'signIn' || authMode === 'signUp' || authMode === 'reset') && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="label" style={{ color: 'var(--text-primary-light)', fontWeight: 500 }}>
                      {authMode === 'reset' ? "New Password" : "Password"}
                    </label>
                    {authMode === 'signIn' && (
                      <span style={{ fontSize: '13px', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setAuthMode('forgot')}>Forgot password?</span>
                    )}
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" className={`input ${error ? 'error' : ''}`} style={{ width: '100%', backgroundColor: 'var(--workspace-bg)', color: 'var(--text-primary-light)', borderColor: error ? 'var(--danger)' : 'var(--workspace-border)', padding: '12px 16px', fontSize: '16px' }} disabled={loading} />
                  
                  {(authMode === 'signUp' || authMode === 'reset') && (
                    <div style={{ marginTop: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {passwordRules.map((rule, idx) => (
                        <div key={idx} style={{ color: rule.valid ? 'var(--status-success)' : 'var(--text-muted-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {rule.valid ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : (
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor', marginLeft: '5px', marginRight: '5px' }}></div>
                          )}
                          <span style={{ fontWeight: rule.valid ? 500 : 400 }}>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(authMode === 'confirm' || authMode === 'reset') && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label" style={{ color: 'var(--text-primary-light)', fontWeight: 500 }}>Confirmation Code</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)} required placeholder="Enter code" className={`input ${error ? 'error' : ''}`} style={{ width: '100%', backgroundColor: 'var(--workspace-bg)', color: 'var(--text-primary-light)', borderColor: error ? 'var(--danger)' : 'var(--workspace-border)', padding: '12px 16px', fontSize: '16px' }} disabled={loading} autoFocus />
                  
                  {authMode === 'confirm' && (
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted-light)' }}>Code expired or didn't arrive?</span>
                      <button 
                        type="button" 
                        onClick={handleResendCode} 
                        disabled={loading}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}
                      >
                        Resend code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {resendInfo && (
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--status-success)', borderRadius: '6px', color: 'var(--status-success)', fontSize: '13px', marginBottom: '16px' }}>
                  {resendInfo}
                </div>
              )}

              {error && <div className="field-error" style={{ marginBottom: '16px', marginTop: '-4px' }}>{error}</div>}
              
              <button type="submit" className="button primary lg" style={{ width: '100%', fontWeight: 600, marginTop: '8px' }} disabled={loading}>
                {loading ? <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div> : 
                 authMode === 'signIn' ? "Sign In" : 
                 authMode === 'signUp' ? "Create Account" : 
                 authMode === 'confirm' ? "Verify Email" : 
                 authMode === 'forgot' ? "Send Reset Code" : "Reset Password"}
              </button>

              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary-light)' }}>
                {authMode === 'signIn' ? (
                  <>Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setAuthMode('signUp')}>Sign up</span></>
                ) : (
                  <>Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setAuthMode('signIn')}>Sign in</span></>
                )}
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--workspace-border)', textAlign: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleDemoEnter} 
                  style={{ 
                    width: '100%', 
                    padding: '10px 16px', 
                    backgroundColor: 'var(--workspace-elevated)', 
                    border: '1px dashed var(--saffron)', 
                    color: 'var(--saffron)', 
                    borderRadius: '8px', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>⚡</span> Continue in Demo Mode (No Login Required)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
