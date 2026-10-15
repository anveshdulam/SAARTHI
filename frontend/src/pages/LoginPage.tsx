import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, LockKeyhole,
  Mail, ShieldCheck, Sparkles, ArrowUpRight,
} from 'lucide-react';
import {
  confirmResetPassword, confirmSignIn, confirmSignUp, fetchAuthSession,
  resendSignUpCode, resetPassword, setUpTOTP, signIn, signUp,
} from 'aws-amplify/auth';
import { BrandLogo } from '../components/layout/BrandLogo';
import { useSaarthiState } from '../hooks/useSaarthiState';
import '../styles/cinematic-public-pages.css';

type AuthMode = 'signIn' | 'signUp' | 'confirmSignUp' | 'forgotPassword' | 'resetPassword' | 'newPassword' | 'challenge' | 'setupTotp' | 'mfaSelection';
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
    case 'NotAuthorizedException': return 'That email and password combination was not accepted.';
    case 'UserNotFoundException': return 'We could not find an account for that email. Create an account or check the address.';
    case 'UserNotConfirmedException': return 'Your account still needs email verification. Request a new code to continue.';
    case 'CodeMismatchException': return 'That verification code does not match. Check the code and try again.';
    case 'ExpiredCodeException': return 'That code has expired. Request a fresh code and try again.';
    case 'UsernameExistsException': return 'An account already exists for this username or email. Try signing in instead.';
    case 'LimitExceededException': return 'Too many attempts were made. Wait a little before trying again.';
    case 'NetworkError': return 'We could not reach the authentication service. Check your connection and retry.';
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
  const [mfaChoices, setMfaChoices] = useState<string[]>(['SMS', 'TOTP']);
  const [selectedMfa, setSelectedMfa] = useState('TOTP');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');

  const storedEmail = localStorage.getItem('saarthi_auth_email')?.trim().toLowerCase();
  const savedUsername = localStorage.getItem('saarthi_auth_username');
  const storedUsername = storedEmail === email.trim().toLowerCase() && savedUsername ? savedUsername : email.trim();

  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  useEffect(() => {
    if (isAuthenticated === true) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const completeAuthentication = async () => {
    sessionStorage.removeItem('saarthi_demo_override');
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) throw new Error('Authentication completed without an ID token. Please sign in again.');
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
        setNotice('Your account needs email verification before you can sign in.');
        return;
      case 'RESET_PASSWORD':
        setMode('forgotPassword');
        setNotice('Your account requires a password reset before continuing.');
        return;
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        setMode('newPassword');
        setNotice('Choose a new password to finish signing in.');
        return;
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
      case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
      case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
        setMode('challenge');
        setNotice('Complete the verification challenge to continue.');
        return;
      case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP': {
        const setup = await setUpTOTP();
        setTotpSecret(setup.sharedSecret);
        setTotpUri(setup.getSetupUri('SAARTHI', email.trim()).toString());
        setMode('setupTotp');
        setNotice('Add SAARTHI to your authenticator app, then enter the generated code.');
        return;
      }
      case 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION': {
        const available = result.nextStep?.allowedMFATypes;
        const choices = Array.isArray(available) && available.length ? available : ['SMS', 'TOTP'];
        setMfaChoices(choices);
        setSelectedMfa(choices[0]);
        setMode('mfaSelection');
        setNotice('Choose how you want to verify your identity.');
        return;
      }
      case 'DONE':
        await completeAuthentication();
        return;
      default:
        setError(`Your account requires an authentication step that this screen does not yet support (${step || 'unknown step'}). Try password recovery or contact the project administrator.`);
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
          const savedEmail = localStorage.getItem('saarthi_auth_email')?.trim().toLowerCase();
          const savedUsername = localStorage.getItem('saarthi_auth_username');
          if (err?.name === 'UserNotFoundException' && savedEmail === email.trim().toLowerCase() && savedUsername && savedUsername !== email.trim()) {
            result = await signIn({ username: savedUsername, password });
          } else {
            throw firstError;
          }
        }
        await processSignInResult(result);
      } else if (mode === 'signUp') {
        if (password !== confirmPassword) throw new Error('Your passwords do not match.');
        const username = normalizeUsername(email);
        localStorage.setItem('saarthi_auth_username', username);
        localStorage.setItem('saarthi_auth_email', email.trim());
        const result = await signUp({ username, password, options: { userAttributes: { email: email.trim() } } });
        if (result.isSignUpComplete) {
          setMode('signIn');
          setPassword('');
          setConfirmPassword('');
          setNotice('Your account was created. Sign in to continue.');
        } else if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          setMode('confirmSignUp');
          setNotice('We sent a verification code to your email.');
        } else {
          setError(`The sign-up flow needs another step (${result.nextStep?.signUpStep || 'unknown'}).`);
        }
      } else if (mode === 'confirmSignUp') {
        await confirmSignUp({ username: storedUsername || normalizeUsername(email), confirmationCode: code.trim() });
        setMode('signIn');
        setPassword('');
        setCode('');
        setNotice('Email verified. Sign in with your password.');
      } else if (mode === 'forgotPassword') {
        const result = await resetPassword({ username: storedUsername || email.trim() });
        if (result.nextStep?.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
          setMode('resetPassword');
          setCode('');
          setPassword('');
          setConfirmPassword('');
          setNotice('A password-reset code was sent to your email.');
        } else if (result.nextStep?.resetPasswordStep === 'DONE') {
          setMode('signIn');
          setNotice('Password recovery completed. Sign in again.');
        } else {
          setError(`The password-reset flow needs another step (${result.nextStep?.resetPasswordStep || 'unknown'}).`);
        }
      } else if (mode === 'resetPassword') {
        if (password !== confirmPassword) throw new Error('Your new passwords do not match.');
        await confirmResetPassword({ username: storedUsername || email.trim(), confirmationCode: code.trim(), newPassword: password });
        setMode('signIn');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setNotice('Password updated. Sign in with your new password.');
      } else if (mode === 'newPassword') {
        if (password !== confirmPassword) throw new Error('Your new passwords do not match.');
        const result = await confirmSignIn({ challengeResponse: password });
        setPassword('');
        setConfirmPassword('');
        await processSignInResult(result);
      } else if (mode === 'challenge' || mode === 'setupTotp') {
        const result = await confirmSignIn({ challengeResponse: code.trim() });
        setCode('');
        await processSignInResult(result);
      } else if (mode === 'mfaSelection') {
        const result = await confirmSignIn({ challengeResponse: selectedMfa });
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
      setNotice('A new verification code has been sent.');
    } catch (err) {
      setError(userFacingError(err));
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = async () => {
    if (import.meta.env.VITE_DEMO_MODE !== 'true' || loading) return;
    sessionStorage.setItem('saarthi_demo_override', 'true');
    setLoading(true);
    setError('');
    try {
      await fetchState();
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const isEmailMode = mode === 'signIn' || mode === 'signUp' || mode === 'forgotPassword';
  const needsPassword = mode === 'signIn' || mode === 'signUp' || mode === 'resetPassword' || mode === 'newPassword';
  const needsCode = mode === 'confirmSignUp' || mode === 'resetPassword' || mode === 'challenge' || mode === 'setupTotp';
  const isNewPassword = mode === 'resetPassword' || mode === 'newPassword' || mode === 'signUp';
  const title: Record<AuthMode, string> = {
    signIn: 'Welcome back.', signUp: 'Make room to grow.', confirmSignUp: 'Check your inbox.',
    forgotPassword: 'Let’s get you back.', resetPassword: 'Set a new password.',
    newPassword: 'One last step.', challenge: 'Verify it’s you.', setupTotp: 'Secure your account.',
    mfaSelection: 'Choose verification.',
  };
  const subtitle: Record<AuthMode, string> = {
    signIn: 'Pick up where your intentions left off.', signUp: 'Create an account and make your next step count.',
    confirmSignUp: 'Enter the confirmation code sent to your email.', forgotPassword: 'We’ll send a secure reset code to your account email.',
    resetPassword: 'Enter the code and choose a new password.', newPassword: 'Your account needs a new password before you continue.',
    challenge: 'Enter the one-time code from your verification method.', setupTotp: 'Connect an authenticator app and enter its current code.',
    mfaSelection: 'Choose an available method for this sign-in.',
  };

  return (
    <div className="sa-public sa-auth-page">
      <div className="sa-auth-landscape" aria-hidden="true">
        <div className="sa-auth-landscape-image" />
        <div className="sa-auth-landscape-shade" />
        <div className="sa-auth-copy">
          <Link to="/" className="sa-brand-link" aria-label="Back to SAARTHI home"><BrandLogo /></Link>
          <span className="sa-auth-overline"><span /> A MORE INTENTIONAL DAY</span>
          <h1 className="sa-display">Small steps.<br /><em>Clearer days.</em></h1>
          <p>Life will change the plan. You still get to choose the next step.</p>
          <div className="sa-auth-steps" aria-label="SAARTHI workflow">
            <div className="sa-auth-step is-current"><span>01</span><div><strong>Bring your intention</strong><small>Start with what matters today.</small></div></div>
            <div className="sa-auth-step"><span>02</span><div><strong>Find a realistic path</strong><small>Use your context, not guesswork.</small></div></div>
            <div className="sa-auth-step"><span>03</span><div><strong>Stay in control</strong><small>Review before changes happen.</small></div></div>
          </div>
          <p className="sa-auth-landscape-caption">From intention to action — on your terms.</p>
        </div>
      </div>

      <main className="sa-auth-main">
        <header className="sa-auth-mobile-brand"><Link to="/" className="sa-brand-link"><BrandLogo /></Link><Link to="/" className="sa-back-home"><ArrowLeft size={14} /> Home</Link></header>
        <section className="sa-auth-card" aria-labelledby="sa-auth-title">
          <div className="sa-auth-card-glow" aria-hidden="true" />
          <div className="sa-auth-card-inner">
            <div className="sa-auth-topline"><span className="sa-auth-secure"><LockKeyhole size={13} /> SECURE ACCOUNT ACCESS</span><span className="sa-auth-step-count">SAARTHI / 01</span></div>
            <div className="sa-auth-heading">
              <div className="sa-auth-symbol"><Sparkles size={18} /></div>
              <div><h2 id="sa-auth-title" className="sa-display">{title[mode]}</h2><p>{subtitle[mode]}</p></div>
            </div>

            <div className="sa-auth-tabs" role="tablist" aria-label="Authentication mode">
              <button type="button" role="tab" aria-selected={mode === 'signIn'} className={mode === 'signIn' ? 'is-active' : ''} onClick={() => { setMode('signIn'); setError(''); setNotice(''); }}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'signUp'} className={mode === 'signUp' ? 'is-active' : ''} onClick={() => { setMode('signUp'); setError(''); setNotice(''); }}>Create account</button>
            </div>

            <form className="sa-auth-form" onSubmit={submit}>
              {isEmailMode && <label className="sa-field"><span>Email address</span><span className="sa-input-shell"><Mail size={16} /><input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required disabled={loading} autoFocus /></span></label>}

              {needsPassword && <label className="sa-field"><span>{mode === 'resetPassword' || mode === 'newPassword' ? 'New password' : 'Password'}</span><span className="sa-input-shell"><KeyRound size={16} /><input autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} type={passwordVisible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'signIn' ? 'Enter your password' : 'Create a strong password'} required disabled={loading} /><button type="button" className="sa-password-toggle" aria-label={passwordVisible ? 'Hide password' : 'Show password'} onClick={() => setPasswordVisible((value) => !value)}>{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>}

              {isNewPassword && <label className="sa-field"><span>Confirm password</span><span className="sa-input-shell"><LockKeyhole size={16} /><input autoComplete="new-password" type={passwordVisible ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it once more" required disabled={loading} /></span></label>}

              {mode === 'signUp' && <div className="sa-password-rules"><span>Password checklist</span><div>{passwordRules.map((rule) => <span key={rule.label} className={rule.valid ? 'is-valid' : ''}><Check size={12} /> {rule.label}</span>)}</div></div>}

              {needsCode && <label className="sa-field"><span>{mode === 'setupTotp' ? 'Authenticator code' : mode === 'challenge' ? 'Verification code' : 'Confirmation code'}</span><span className="sa-input-shell"><ShieldCheck size={16} /><input inputMode="numeric" autoComplete="one-time-code" type="text" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter the code" required disabled={loading} /></span>{mode === 'confirmSignUp' && <button type="button" className="sa-inline-action" onClick={resendCode} disabled={loading}>Resend verification code</button>}</label>}

              {mode === 'setupTotp' && <div className="sa-totp-help"><strong>Authenticator setup</strong><p>Use your authenticator app to add SAARTHI. Open the setup link when supported or enter the secret manually.</p>{totpUri && <a href={totpUri} className="sa-inline-action">Open authenticator setup <ArrowUpRight size={13} /></a>}{totpSecret && <code>{totpSecret}</code>}</div>}

              {mode === 'mfaSelection' && <fieldset className="sa-mfa-options"><legend>Available methods</legend>{mfaChoices.map((choice) => <label key={choice}><input type="radio" value={choice} checked={selectedMfa === choice} onChange={() => setSelectedMfa(choice)} /> {choice.replace(/_/g, ' ').toLowerCase()}</label>)}</fieldset>}

              {mode === 'signIn' && <div className="sa-auth-options"><span className="sa-auth-assurance"><LockKeyhole size={12} /> Secure Cognito session</span><button type="button" onClick={() => { setMode('forgotPassword'); setError(''); setNotice(''); }}>Forgot password?</button></div>}
              {notice && <div className="sa-auth-notice" role="status">{notice}</div>}
              {error && <div className="sa-auth-error" role="alert">{error}</div>}

              <button type="submit" className="sa-button sa-button-primary sa-auth-submit" disabled={loading}>
                {loading ? <span className="sa-button-spinner" aria-hidden="true" /> : null}
                {loading ? 'Please wait…' : mode === 'signIn' ? 'Sign in securely' : mode === 'signUp' ? 'Create account' : mode === 'confirmSignUp' ? 'Verify email' : mode === 'forgotPassword' ? 'Send reset code' : mode === 'resetPassword' ? 'Update password' : mode === 'newPassword' ? 'Set new password' : mode === 'mfaSelection' ? 'Continue' : 'Verify and continue'}
                {!loading && <ArrowRight size={16} />}
              </button>

              {(mode === 'challenge' || mode === 'setupTotp' || mode === 'mfaSelection' || mode === 'newPassword') && <button type="button" className="sa-auth-back" onClick={() => { setMode('signIn'); setCode(''); setPassword(''); setConfirmPassword(''); setError(''); setNotice(''); }}>Back to sign in</button>}
              {(mode === 'forgotPassword' || mode === 'resetPassword' || mode === 'confirmSignUp') && <button type="button" className="sa-auth-back" onClick={() => { setMode('signIn'); setError(''); setNotice(''); }}>Return to sign in</button>}
            </form>

            <div className="sa-auth-divider"><span /> <small>YOUR PLAN. YOUR CALL.</small> <span /></div>
            <p className="sa-auth-control-note"><ShieldCheck size={15} /> Every consequential plan change stays under your control.</p>

            {import.meta.env.VITE_DEMO_MODE === 'true' && <button type="button" className="sa-demo-login" onClick={enterDemo} disabled={loading}><ZapIcon /> Continue in local demo mode <ArrowRight size={14} /></button>}

            <div className="sa-auth-bottom">{mode === 'signIn' ? <>New to SAARTHI? <button type="button" onClick={() => { setMode('signUp'); setError(''); setNotice(''); }}>Create your account</button></> : <>Already have an account? <button type="button" onClick={() => { setMode('signIn'); setError(''); setNotice(''); }}>Sign in</button></>}</div>
          </div>
        </section>
        <footer className="sa-auth-footer"><span>© {new Date().getFullYear()} SAARTHI</span><span><LockKeyhole size={12} /> Authentication powered by Amazon Cognito</span></footer>
      </main>
    </div>
  );
}

function ZapIcon() {
  return <span className="sa-demo-bolt" aria-hidden="true">✦</span>;
}
