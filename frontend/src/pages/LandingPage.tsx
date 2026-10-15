import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, AudioLines, CalendarClock, Check,
  CirclePlay, Compass, LockKeyhole, Menu, MoveUpRight, ShieldCheck,
  Sparkles, X, Zap,
} from 'lucide-react';
import { BrandLogo } from '../components/layout/BrandLogo';
import '../styles/cinematic-public-pages.css';

type LandingPageProps = {
  onLogin?: () => void | Promise<void>;
};

const useCases = [
  {
    index: '01',
    title: 'Tell SAARTHI what matters.',
    copy: 'Start with an intention, a commitment, or a day that has gone off course. Speak naturally; you do not need to manage another complicated system.',
    icon: Compass,
  },
  {
    index: '02',
    title: 'Make a plan that fits real life.',
    copy: 'SAARTHI can use your commitments and saved constraints to propose a more realistic next step instead of asking you to start from zero.',
    icon: CalendarClock,
  },
  {
    index: '03',
    title: 'Stay in control of the change.',
    copy: 'Review the proposal before it is applied. Important schedule changes remain yours to approve or reject.',
    icon: ShieldCheck,
  },
];

export function LandingPage({ onLogin }: LandingPageProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -42px 0px' });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const enterDemo = async () => {
    if (import.meta.env.VITE_DEMO_MODE !== 'true') {
      navigate('/login');
      return;
    }
    sessionStorage.setItem('saarthi_demo_override', 'true');
    setDemoLoading(true);
    try {
      await onLogin?.();
      navigate('/', { replace: true });
    } finally {
      setDemoLoading(false);
    }
  };

  const openLogin = () => navigate('/login');

  return (
    <div className="sa-public sa-landing">
      <header className="sa-site-header">
        <Link to="/" aria-label="SAARTHI home" className="sa-brand-link">
          <BrandLogo />
        </Link>
        <button
          type="button"
          className="sa-mobile-menu"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`sa-main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#approach" onClick={() => setMenuOpen(false)}>The approach</a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#control" onClick={() => setMenuOpen(false)}>Your control</a>
          <button type="button" className="sa-nav-login" onClick={openLogin}>Sign in <MoveUpRight size={14} /></button>
        </nav>
      </header>

      <main>
        <section className="sa-hero" aria-labelledby="sa-hero-title">
          <div className="sa-hero-backdrop" aria-hidden="true" />
          <div className="sa-hero-grain" aria-hidden="true" />
          <div className="sa-hero-grid">
            <div className="sa-hero-copy">
              <div className="sa-eyebrow sa-rise-in"><span className="sa-eyebrow-dot" /> YOUR PERSONAL EXECUTION PARTNER</div>
              <h1 id="sa-hero-title" className="sa-display sa-hero-title">
                From intention
                <span>to <em>action.</em></span>
              </h1>
              <p className="sa-hero-subtitle sa-rise-in sa-delay-2">
                Life rarely follows the plan. SAARTHI helps you find the next good step, protect what matters, and move forward without losing control.
              </p>
              <div className="sa-hero-actions sa-rise-in sa-delay-3">
                <button type="button" className="sa-button sa-button-primary" onClick={openLogin}>
                  Start your journey <ArrowRight size={17} />
                </button>
                <a href="#workflow" className="sa-button sa-button-quiet">
                  <CirclePlay size={17} /> See how it works
                </a>
              </div>
              <div className="sa-hero-proof sa-rise-in sa-delay-4">
                <div><ShieldCheck size={16} /><span>Human-approved changes</span></div>
                <span className="sa-proof-separator" />
                <div><LockKeyhole size={16} /><span>Your context, kept personal</span></div>
              </div>
            </div>

            <div className="sa-hero-visual" aria-label="Illustrative preview of a SAARTHI schedule proposal">
              <div className="sa-orbit sa-orbit-one" aria-hidden="true" />
              <div className="sa-orbit sa-orbit-two" aria-hidden="true" />
              <div className="sa-sunlight" aria-hidden="true" />
              <div className="sa-float-note sa-float-note-top">
                <span className="sa-note-icon"><CalendarClock size={16} /></span>
                <span><strong>Plans can change.</strong><small>Your priorities don't have to.</small></span>
              </div>
              <div className="sa-preview-window">
                <div className="sa-preview-topbar">
                  <div className="sa-preview-brand"><span className="sa-preview-mark">S</span> SAARTHI</div>
                  <span className="sa-preview-label">ILLUSTRATIVE PREVIEW</span>
                </div>
                <div className="sa-preview-body">
                  <div className="sa-preview-kicker"><Sparkles size={13} /> A moment to reset</div>
                  <h2>A better plan for the day ahead.</h2>
                  <p>One missed session doesn't have to derail your day.</p>
                  <div className="sa-preview-message">
                    <span className="sa-message-avatar"><AudioLines size={15} /></span>
                    <span><small>YOU</small><strong>“I missed my study session. Help me adjust.”</strong></span>
                  </div>
                  <div className="sa-preview-plan">
                    <div className="sa-plan-title"><span>PROPOSED PLAN</span><span className="sa-plan-status"><span /> Awaiting review</span></div>
                    <div className="sa-plan-row"><span className="sa-plan-time">07:15 PM</span><span className="sa-plan-track"><i className="sa-track-study" /></span><span className="sa-plan-task">Focused study</span></div>
                    <div className="sa-plan-row"><span className="sa-plan-time">08:45 PM</span><span className="sa-plan-track"><i className="sa-track-break" /></span><span className="sa-plan-task">Break & reset</span></div>
                    <div className="sa-plan-guard"><ShieldCheck size={14} /> Example constraint: finish focus work by 10 PM</div>
                  </div>
                  <div className="sa-preview-actions"><span><LockKeyhole size={13} /> Nothing changes without you</span><span className="sa-preview-review">Review <ArrowRight size={13} /></span></div>
                </div>
              </div>
              <div className="sa-float-note sa-float-note-bottom">
                <span className="sa-check-mark"><Check size={14} /></span>
                <span><strong>You stay the decision-maker.</strong><small>Review. Approve. Move forward.</small></span>
              </div>
              <div className="sa-visual-caption">A glimpse of the SAARTHI experience · illustrative, not live data</div>
            </div>
          </div>
          <a href="#approach" className="sa-scroll-cue" aria-label="Scroll to learn about SAARTHI"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></a>
        </section>

        <section className="sa-manifesto" id="approach" data-reveal>
          <div className="sa-section-label">A DIFFERENT KIND OF PRODUCTIVITY</div>
          <h2 className="sa-display">Not a stricter schedule.<br /><em>A kinder way forward.</em></h2>
          <p>Most tools ask you to keep up. SAARTHI helps you recover when the day gets complicated — with context, practical next steps, and you in control of every consequential change.</p>
        </section>

        <section className="sa-workflow" id="workflow">
          <div className="sa-section-heading" data-reveal>
            <div><div className="sa-section-label">A SIMPLE, HUMAN-CENTRED LOOP</div><h2 className="sa-display">Make room for <em>real life.</em></h2></div>
            <p>From the first intention to a better next step, every part of the journey is designed to be understandable and deliberate.</p>
          </div>
          <div className="sa-workflow-grid">
            {useCases.map(({ index, title, copy, icon: Icon }) => (
              <article className="sa-workflow-card" data-reveal key={index}>
                <div className="sa-workflow-card-top"><span className="sa-workflow-number">{index}</span><span className="sa-workflow-icon"><Icon size={20} /></span></div>
                <h3>{title}</h3><p>{copy}</p>
                <span className="sa-workflow-line" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="sa-feature-story" id="control" data-reveal>
          <div className="sa-feature-visual" aria-hidden="true">
            <div className="sa-story-window">
              <div className="sa-story-window-head"><span>THE MOMENT THINGS CHANGE</span><span className="sa-story-window-dot" /></div>
              <div className="sa-story-alert"><span className="sa-alert-mark">!</span><span><small>COMMITMENT AT RISK</small><strong>A study session was missed.</strong></span><span className="sa-alert-status">Needs attention</span></div>
              <div className="sa-story-connector"><span /><span /><span /></div>
              <div className="sa-story-suggestion"><span className="sa-suggestion-mark"><Sparkles size={15} /></span><span><small>SAARTHI'S NEXT STEP</small><strong>Prepare a realistic schedule proposal.</strong><small>Using your stored commitments and constraints.</small></span></div>
              <div className="sa-story-footer"><LockKeyhole size={13} /> You review before anything changes.</div>
            </div>
          </div>
          <div className="sa-feature-copy">
            <div className="sa-section-label">BUILT AROUND YOUR AGENCY</div>
            <h2 className="sa-display">Intelligent support.<br /><em>Human decisions.</em></h2>
            <p>SAARTHI is designed to help plan and propose — not silently take over. You can inspect the suggested change, compare it with the current plan, and decide what happens next.</p>
            <ul className="sa-trust-list">
              <li><span><Check size={14} /></span> Context-aware proposals</li>
              <li><span><Check size={14} /></span> Clear before-and-after review</li>
              <li><span><Check size={14} /></span> Explicit approval for changes</li>
            </ul>
            <button type="button" className="sa-button sa-button-primary" onClick={openLogin}>Enter SAARTHI <ArrowRight size={16} /></button>
          </div>
        </section>

        <section className="sa-closing" data-reveal>
          <div className="sa-closing-glow" aria-hidden="true" />
          <div className="sa-section-label">ONE STEP IS STILL PROGRESS</div>
          <h2 className="sa-display">Begin where you are.<br /><em>Build from there.</em></h2>
          <p>You do not need a perfect day. You just need a good next step.</p>
          <button type="button" className="sa-button sa-button-light" onClick={openLogin}>Start your journey <ArrowRight size={17} /></button>
        </section>
      </main>

      <footer className="sa-footer">
        <Link to="/" className="sa-brand-link" aria-label="SAARTHI home"><BrandLogo /></Link>
        <p>From intention to action.</p>
        <div className="sa-footer-links"><a href="#approach">Our approach</a><a href="#control">Your control</a><Link to="/login">Sign in</Link></div>
        <span className="sa-footer-copy">© {new Date().getFullYear()} SAARTHI</span>
      </footer>

      {import.meta.env.VITE_DEMO_MODE === 'true' && (
        <button type="button" className="sa-demo-fab" onClick={enterDemo} disabled={demoLoading}>
          <Zap size={15} /> {demoLoading ? 'Opening demo…' : 'Try local demo'}
        </button>
      )}
    </div>
  );
}
