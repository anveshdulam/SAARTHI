import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Check,
  CirclePlay,
  Dumbbell,
  FileText,
  GraduationCap,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
  Compass,
  CalendarClock,
  Brain,
} from 'lucide-react';
import { BrandLogo } from '../components/layout/BrandLogo';
import '../styles/cinematic-public-pages.css';

type LandingPageProps = {
  onLogin?: () => void | Promise<void>;
};

const featurePillars = [
  {
    index: '01',
    title: 'Understands your context',
    copy: 'Your commitments, preferences, routines, and hard constraints in one unified personal knowledge base.',
    icon: Compass,
  },
  {
    index: '02',
    title: 'Proactively keeps you on track',
    copy: 'Detects schedule conflicts, missed study sessions, and fatigue risks before your day gets overwhelmed.',
    icon: CalendarClock,
  },
  {
    index: '03',
    title: 'Respects your control',
    copy: 'Every consequential schedule change requires your explicit approval. Nothing ever shifts silently.',
    icon: ShieldCheck,
  },
  {
    index: '04',
    title: 'Built for real life',
    copy: 'Adapts gracefully when plans derail. Keeps your non-negotiable bedtime and personal goals intact.',
    icon: Brain,
  },
];

export function LandingPage({ onLogin: _onLogin }: LandingPageProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const openLogin = () => navigate('/login');

  return (
    <div className="sa-public sa-landing">
      {/* Official Top Navigation Bar */}
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
          <a href="#manifesto" onClick={() => setMenuOpen(false)}>Why SAARTHI</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#control" onClick={() => setMenuOpen(false)}>For Students</a>
          <a href="#control" onClick={() => setMenuOpen(false)}>Security</a>
          <button type="button" className="sa-nav-login" onClick={openLogin}>
            Sign In
          </button>
        </nav>
      </header>

      <main>
        {/* Hero Section matching 07-landing-page-concept.png */}
        <section className="sa-hero" aria-labelledby="sa-hero-title">
          <div className="sa-hero-backdrop" aria-hidden="true" />
          <div className="sa-hero-grain" aria-hidden="true" />
          
          <div className="sa-hero-grid">
            {/* Left Hero Copy */}
            <div className="sa-hero-copy">
              <div className="sa-eyebrow sa-rise-in">
                <span className="sa-eyebrow-dot" /> YOUR PERSONAL EXECUTION PARTNER
              </div>
              <h1 id="sa-hero-title" className="sa-display sa-hero-title">
                Your Goals.<br />
                A <em>Smarter</em> Path.
              </h1>
              <p className="sa-hero-subtitle sa-rise-in sa-delay-2">
                SAARTHI is your AI-powered planning companion that understands your life, protects your priorities, and helps you move forward — one day at a time.
              </p>
              
              <div className="sa-hero-actions sa-rise-in sa-delay-3">
                <button type="button" className="sa-button sa-button-primary" onClick={openLogin}>
                  Get Started <ArrowRight size={17} />
                </button>
                <a href="#workflow" className="sa-button sa-button-quiet">
                  <CirclePlay size={17} /> Watch Demo
                </a>
              </div>
            </div>

            {/* Right Hero: Floating Path Schedule Cards along the Winding Trail */}
            <div className="sa-hero-path-showcase" aria-label="Interactive preview of scheduled commitments along your journey">
              {/* Illuminated SVG Trail */}
              <svg className="sa-trail-svg" viewBox="0 0 540 440" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M 110 80 C 260 110, 300 200, 420 220 C 490 235, 360 340, 220 370" 
                  stroke="url(#trailGlowGradient)" 
                  strokeWidth="2.5" 
                  strokeDasharray="6 6"
                />
                <defs>
                  <linearGradient id="trailGlowGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#83b7d6" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#e8b36e" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f0c3a1" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Card 1: Study */}
              <div className="sa-path-card sa-card-study">
                <div className="sa-path-card-icon">
                  <GraduationCap size={22} />
                </div>
                <div className="sa-path-card-content">
                  <div className="sa-path-card-title">Study</div>
                  <div className="sa-path-card-time">2:00 PM – 4:00 PM</div>
                </div>
              </div>

              {/* Card 2: Gym */}
              <div className="sa-path-card sa-card-gym">
                <div className="sa-path-card-icon">
                  <Dumbbell size={22} />
                </div>
                <div className="sa-path-card-content">
                  <div className="sa-path-card-title">Gym</div>
                  <div className="sa-path-card-time">6:00 PM – 7:00 PM</div>
                </div>
              </div>

              {/* Card 3: Project */}
              <div className="sa-path-card sa-card-project">
                <div className="sa-path-card-icon">
                  <FileText size={22} />
                </div>
                <div className="sa-path-card-content">
                  <div className="sa-path-card-title">Project</div>
                  <div className="sa-path-card-time">8:00 PM – 10:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Badges matching 07-landing-page-concept.png */}
          <div className="sa-hero-bottom-badges">
            <div className="sa-badge-brand">
              <strong>Plan Smarter</strong>
              <span>Live Better</span>
            </div>
            <div className="sa-badge-item">
              <Calendar size={18} style={{ color: '#e8b36e' }} />
              <span>Personalized Schedules</span>
            </div>
            <div className="sa-badge-item">
              <Sparkles size={18} style={{ color: '#e8b36e' }} />
              <span>AI-Powered Adjustments</span>
            </div>
            <div className="sa-badge-item">
              <ShieldCheck size={18} style={{ color: '#e8b36e' }} />
              <span>You Stay in Control</span>
            </div>
          </div>
        </section>

        {/* Manifesto Section */}
        <section className="sa-manifesto" id="manifesto" data-reveal>
          <div className="sa-section-label">A DIFFERENT KIND OF PRODUCTIVITY</div>
          <h2 className="sa-display">
            Not a stricter schedule.<br />
            <em>A kinder way forward.</em>
          </h2>
          <p>
            Traditional planners make you feel guilty when life interrupts. SAARTHI provides real-time context, realistic schedule repairs, and guarantees that you remain the sole decision-maker.
          </p>
        </section>

        {/* 4 Feature Pillars matching Reference Boards */}
        <section className="sa-workflow" id="features">
          <div className="sa-section-heading" data-reveal>
            <div>
              <div className="sa-section-label">WHY SAARTHI?</div>
              <h2 className="sa-display">More than a planner.<br /><em>A partner in your progress.</em></h2>
            </div>
            <p>
              From intention to execution, every part of your day is protected by intelligent context and human agency.
            </p>
          </div>
          
          <div className="sa-workflow-grid">
            {featurePillars.map(({ index, title, copy, icon: Icon }) => (
              <article className="sa-workflow-card" data-reveal key={index}>
                <div className="sa-workflow-card-top">
                  <span className="sa-workflow-number">{index}</span>
                  <span className="sa-workflow-icon"><Icon size={20} /></span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="sa-workflow-line" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        {/* Human Agency & Trust Story */}
        <section className="sa-feature-story" id="control" data-reveal>
          <div className="sa-feature-visual" aria-hidden="true">
            <div className="sa-story-window-head">
              <span>PROACTIVE SCHEDULE REPAIR</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34c759' }} />
            </div>
            
            <div className="sa-story-alert">
              <span className="sa-alert-mark">!</span>
              <div>
                <small style={{ fontSize: '10px', color: '#ff6b6b', fontWeight: 700, letterSpacing: '0.05em' }}>SCHEDULE RISK DETECTED</small>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#FFFFFF' }}>A 2 PM study session was missed.</div>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(220, 53, 69, 0.2)', color: '#ff6b6b' }}>
                Needs attention
              </span>
            </div>

            <div className="sa-story-suggestion">
              <span className="sa-suggestion-mark"><Sparkles size={16} /></span>
              <div>
                <small style={{ fontSize: '10px', color: '#e8b36e', fontWeight: 700, letterSpacing: '0.05em' }}>SAARTHI'S INTELLIGENT PROPOSAL</small>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#FFFFFF', marginTop: '2px' }}>
                  Reschedule focus block to 7:15 PM without violating 10 PM wind-down.
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(245, 240, 232, 0.65)', marginTop: '4px' }}>
                  Bedtime constraint strictly preserved.
                </div>
              </div>
            </div>

            <div className="sa-story-footer">
              <LockKeyhole size={14} style={{ color: '#e8b36e' }} />
              <span>Nothing updates without your explicit click on Approve.</span>
            </div>
          </div>

          <div className="sa-feature-copy">
            <div className="sa-section-label">BUILT AROUND YOUR AGENCY</div>
            <h2 className="sa-display">
              Intelligent proposals.<br />
              <em>Human decisions.</em>
            </h2>
            <p style={{ color: 'rgba(245, 240, 232, 0.75)', fontSize: '15px', lineHeight: 1.8 }}>
              SAARTHI is engineered with strict approval invariants. The agent can suggest, calculate, and evaluate — but only you hold the key to commit changes.
            </p>
            <ul className="sa-trust-list">
              <li><span><Check size={14} /></span> Context-aware proposals derived from your real commitments</li>
              <li><span><Check size={14} /></span> Clear before-and-after schedule comparison</li>
              <li><span><Check size={14} /></span> Cryptographically verifiable audit trail of every decision</li>
            </ul>
            <button type="button" className="sa-button sa-button-primary" onClick={openLogin}>
              Enter SAARTHI <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="sa-closing" data-reveal>
          <div className="sa-section-label">BEGIN WHERE YOU ARE</div>
          <h2 className="sa-display">
            Small consistent steps.<br />
            <em>Big results.</em>
          </h2>
          <p>
            You don't need an unyielding routine. You just need a partner that helps you find the next good step.
          </p>
          <button type="button" className="sa-button sa-button-primary" onClick={openLogin}>
            Start your journey <ArrowRight size={17} />
          </button>
        </section>
      </main>

      {/* Official Footer */}
      <footer className="sa-footer">
        <Link to="/" className="sa-brand-link" aria-label="SAARTHI home">
          <BrandLogo />
        </Link>
        <div className="sa-footer-links">
          <a href="#manifesto">Why SAARTHI</a>
          <a href="#features">Features</a>
          <a href="#control">Security</a>
          <Link to="/login">Sign In</Link>
        </div>
        <span>© {new Date().getFullYear()} SAARTHI · Powered by AWS Cognito</span>
      </footer>
    </div>
  );
}
