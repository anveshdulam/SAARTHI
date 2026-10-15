import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Cloud,
  CheckCircle,
} from 'lucide-react';
import {
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  resendSignUpCode,
  resetPassword,
  signIn,
  signUp,
} from 'aws-amplify/auth';
import { BrandLogo } from '../components/layout/BrandLogo';
import { useSaarthiState } from '../hooks/useSaarthiState';
import '../styles/cinematic-public-pages.css';

type AuthMode = 'signIn' | 'signUp' | 'confirmSignUp' | 'forgotPassword' | 'resetPassword' | 'newPassword' | 'challenge' | 'setupTotp';

type SignInResultLike = {
  isSignedIn?: boolean;
  nextStep?: {
    signInStep?: string;
    allowedMFATypes?: string[];
  } | any;
};

const normalizeUsername = (email: string) => email.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');

function userFacingError(error: unknown): string {
  const err = error as { name?: string; message?: string };
  switch (err?.name) {
    case 'NotAuthorizedException': return 'Invalid email or password. Please check your credentials.';
    case 'UserNotFoundException': return 'No account found with this email. Switch to Create Account to register.';
    case 'UserNotConfirmedException': return 'Your account requires email verification. Request a new code to complete.';
    case 'CodeMismatchException': return 'Verification code is incorrect. Please recheck your email.';
    case 'ExpiredCodeException': return 'Verification code has expired. Request a new code.';
    case 'UsernameExistsException': return 'An account already exists for this email. Please sign in instead.';
    case 'LimitExceededException': return 'Attempt limit reached. Please wait a moment before trying again.';
    case 'NetworkError': return 'Cannot connect to AWS Cognito. Check your internet connection.';
    default: return err?.message || 'Authentication could not be completed. Please try again.';
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, fetchState } = useSaarthiState();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState(() => localStorage.getItem('saarthi_auth_email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const storedUsername = localStorage.getItem('saarthi_auth_username') || email.trim();

  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const completeAuthentication = async () => {
    sessionStorage.removeItem('saarthi_demo_override');
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) {
      throw new Error('Authentication succeeded, but failed to retrieve AWS Cognito ID token.');
    }
    await fetchState();
    navigate('/', { replace: true });
  };

  const processSignInResult = async (result: SignInResultLike) => {
    if (result.isSignedIn) {
      await completeAuthentication();
      return;
    }

    const step = result.nextStep?.signInStep;
    setCode('');
    switch (step) {
      case 'CONFIRM_SIGN_UP':
        setMode('confirmSignUp');
        setNotice('Please enter the verification code sent to your email.');
        return;
      case 'RESET_PASSWORD':
        setMode('forgotPassword');
        setNotice('Your account requires a password reset.');
        return;
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        setMode('newPassword');
        setNotice('Please set a new password to continue.');
        return;
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
      case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
      case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
        setMode('challenge');
        setNotice('Enter the verification challenge code.');
        return;
      case 'DONE':
        await completeAuthentication();
        return;
      default:
        setError(`Unexpected authentication step: ${step || 'unknown'}. Please try again.`);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'signIn') {
        let result: SignInResultLike;
        try {
          result = await signIn({ username: email.trim(), password });
        } catch (firstError) {
          const err = firstError as { name?: string };
          const savedUsername = localStorage.getItem('saarthi_auth_username');
          if (err?.name === 'UserNotFoundException' && savedUsername && savedUsername !== email.trim()) {
            result = await signIn({ username: savedUsername, password });
          } else {
            throw firstError;
          }
        }
        await processSignInResult(result);
      } else if (mode === 'signUp') {
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        const username = normalizeUsername(email);
        localStorage.setItem('saarthi_auth_username', username);
        localStorage.setItem('saarthi_auth_email', email.trim());
        const result = await signUp({
          username,
          password,
          options: { userAttributes: { email: email.trim() } }
        });
        if (result.isSignUpComplete) {
          setMode('signIn');
          setPassword('');
          setConfirmPassword('');
          setNotice('Account created successfully! Please sign in.');
        } else if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          setMode('confirmSignUp');
          setNotice('Verification code sent! Please check your email inbox.');
        } else {
          setError(`Sign-up requires next step: ${result.nextStep?.signUpStep}`);
        }
      } else if (mode === 'confirmSignUp') {
        await confirmSignUp({
          username: storedUsername || normalizeUsername(email),
          confirmationCode: code.trim()
        });
        setMode('signIn');
        setPassword('');
        setCode('');
        setNotice('Email verified successfully! Please sign in with your password.');
      } else if (mode === 'forgotPassword') {
        const result = await resetPassword({ username: storedUsername || email.trim() });
        if (result.nextStep?.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
          setMode('resetPassword');
          setCode('');
          setPassword('');
          setConfirmPassword('');
          setNotice('Password reset code sent to your email.');
        } else if (result.nextStep?.resetPasswordStep === 'DONE') {
          setMode('signIn');
          setNotice('Password reset complete. Please sign in.');
        }
      } else if (mode === 'resetPassword') {
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        await confirmResetPassword({
          username: storedUsername || email.trim(),
          confirmationCode: code.trim(),
          newPassword: password
        });
        setMode('signIn');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setNotice('Password successfully reset! Please sign in with your new password.');
      } else if (mode === 'newPassword') {
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        const result = await confirmSignIn({ challengeResponse: password });
        setPassword('');
        setConfirmPassword('');
        await processSignInResult(result);
      } else if (mode === 'challenge') {
        const result = await confirmSignIn({ challengeResponse: code.trim() });
        setCode('');
        await processSignInResult(result);
      }
    } catch (err) {
      setError(userFacingError(err));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await resendSignUpCode({ username: storedUsername || normalizeUsername(email) });
      setNotice('A fresh verification code was sent to your email.');
    } catch (err) {
      setError(userFacingError(err));
    } finally {
      setLoading(false);
    }
  };

  const isEmailMode = mode === 'signIn' || mode === 'signUp' || mode === 'forgotPassword';
  const needsPassword = mode === 'signIn' || mode === 'signUp' || mode === 'resetPassword' || mode === 'newPassword';
  const needsCode = mode === 'confirmSignUp' || mode === 'resetPassword' || mode === 'challenge';
  const isNewPassword = mode === 'resetPassword' || mode === 'newPassword' || mode === 'signUp';

  return (
    <div className="sa-public sa-auth-page">
      {/* Background with Scenic Ambient Atmosphere */}
      <div className="sa-auth-page-backdrop" aria-hidden="true" />

      {/* Top Header matching 08-login-page-concept.png */}
      <header className="sa-auth-header">
        <Link to="/" className="sa-brand-link" aria-label="Back to SAARTHI home">
          <BrandLogo />
        </Link>
        <Link to="/" className="sa-auth-back-link">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>

      {/* Centered Auth Container */}
      <div className="sa-auth-container">
        <div className="sa-auth-card-concept">
          <h1 className="sa-auth-title-concept">Welcome Back</h1>
          <p className="sa-auth-subtitle-concept">Continue your journey with SAARTHI</p>

          {/* Pill Tab Switcher matching 08-login-page-concept.png */}
          <div className="sa-auth-tab-pill-box" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signIn'}
              className={`sa-auth-tab-pill ${mode === 'signIn' ? 'is-active' : ''}`}
              onClick={() => { setMode('signIn'); setError(''); setNotice(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signUp'}
              className={`sa-auth-tab-pill ${mode === 'signUp' ? 'is-active' : ''}`}
              onClick={() => { setMode('signUp'); setError(''); setNotice(''); }}
            >
              Create Account
            </button>
          </div>

          {/* Notice & Error Banners */}
          {notice && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(52, 199, 89, 0.15)', border: '1px solid rgba(52, 199, 89, 0.3)', color: '#34c759', fontSize: '13px', marginBottom: '16px' }}>
              {notice}
            </div>
          )}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(220, 53, 69, 0.15)', border: '1px solid rgba(220, 53, 69, 0.35)', color: '#ff6b6b', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Form matching 08-login-page-concept.png */}
          <form onSubmit={submit}>
            {isEmailMode && (
              <div className="sa-auth-field">
                <label>Email</label>
                <div className="sa-auth-input-wrapper">
                  <Mail size={16} className="field-icon" />
                  <input
                    type="email"
                    autoComplete="email"
                    className="sa-auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {needsPassword && (
              <div className="sa-auth-field">
                <label>{mode === 'resetPassword' || mode === 'newPassword' ? 'New Password' : 'Password'}</label>
                <div className="sa-auth-input-wrapper">
                  <LockKeyhole size={16} className="field-icon" />
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    className="sa-auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="sa-password-toggle-btn"
                    onClick={() => setPasswordVisible(v => !v)}
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {isNewPassword && (
              <div className="sa-auth-field">
                <label>Confirm Password</label>
                <div className="sa-auth-input-wrapper">
                  <LockKeyhole size={16} className="field-icon" />
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="sa-auth-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode === 'signUp' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: '4px 0 16px', fontSize: '11px', color: 'rgba(245, 240, 232, 0.65)' }}>
                {passwordRules.map(rule => (
                  <span key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: rule.valid ? '#34c759' : 'rgba(245, 240, 232, 0.5)' }}>
                    <Check size={12} /> {rule.label}
                  </span>
                ))}
              </div>
            )}

            {needsCode && (
              <div className="sa-auth-field">
                <label>Verification Code</label>
                <div className="sa-auth-input-wrapper">
                  <KeyRound size={16} className="field-icon" />
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sa-auth-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    required
                    disabled={loading}
                  />
                </div>
                {mode === 'confirmSignUp' && (
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: 'var(--sa-amber)', fontSize: '12px', cursor: 'pointer', textAlign: 'left', marginTop: '4px' }}
                  >
                    Resend verification code
                  </button>
                )}
              </div>
            )}

            {mode === 'signIn' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="sa-forgot-password-link"
                  onClick={() => { setMode('forgotPassword'); setError(''); setNotice(''); }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="sa-auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signIn' ? 'Sign In →' : mode === 'signUp' ? 'Create Account →' : mode === 'confirmSignUp' ? 'Verify Email →' : mode === 'forgotPassword' ? 'Send Reset Code →' : 'Update Password →'}
            </button>
          </form>

          {/* Bottom Switch Note */}
          <div className="sa-auth-toggle-note">
            {mode === 'signIn' ? (
              <>
                New to SAARTHI?
                <button type="button" onClick={() => { setMode('signUp'); setError(''); setNotice(''); }}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button type="button" onClick={() => { setMode('signIn'); setError(''); setNotice(''); }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Student Quote matching 08-login-page-concept.png */}
        <div className="sa-auth-quote-box">
          <p className="sa-auth-quote">
            “SAARTHI helps me stay consistent even when life gets messy.”
          </p>
          <span className="sa-auth-quote-author">
            — A student building a better tomorrow
          </span>
        </div>

        {/* Security Badges matching 08-login-page-concept.png */}
        <div className="sa-auth-bottom-badges">
          <div className="sa-auth-badge">
            <ShieldCheck size={16} />
            <span>Your data is secure</span>
          </div>
          <div className="sa-auth-badge">
            <Cloud size={16} />
            <span>Powered by AWS Cognito</span>
          </div>
          <div className="sa-auth-badge">
            <CheckCircle size={16} />
            <span>You stay in control</span>
          </div>
        </div>
      </div>
    </div>
  );
}
