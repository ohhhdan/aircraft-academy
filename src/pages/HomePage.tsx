import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAircraftById } from '../utils/data';
import { ImagePlate } from '../components/ImagePlate';

const MODULES = [
  {
    id: 'learn',
    to: '/learn',
    num: '01',
    title: 'Key Features',
    desc: 'Study specimen plates — photo, diagram, and how to spot each type.',
    progressKey: 'learn' as const,
    open: true,
  },
  {
    id: 'spotter',
    to: '/spotter',
    num: '02',
    title: 'Identify by Photo',
    desc: 'Verify aircraft from ramp photos — family level and variant level.',
    progressKey: 'spotter' as const,
    open: true,
  },
  {
    id: 'deepdive',
    to: '/deepdive',
    num: '03',
    title: 'Deep Dive',
    desc: 'Compare rivals, range, service dates, and mission fit.',
    progressKey: 'deepdive' as const,
    open: true,
  },
  {
    id: 'codes',
    to: '/codes',
    num: '04',
    title: 'Airport Codes',
    desc: 'Learn IATA three-letter codes through a tiered departure board.',
    progressKey: 'codes' as const,
    open: true,
  },
];

export function HomePage() {
  const { state, canStartExercise, overallProgress } = useApp();
  const specimen = getAircraftById('b747')!;

  return (
    <div>
      <div className="home-hero">
        <div className="home-hero-copy">
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ochre)', marginBottom: 14 }}>
            Aircraft Identification · Learning Experience
          </div>
          <h1 className="serif" style={{ fontSize: 'clamp(2rem, 5vw, 52px)', lineHeight: 1.02, margin: '0 0 16px', textWrap: 'balance' }}>
            Learn to read the sky.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-faint)', maxWidth: 460, marginBottom: 26, textWrap: 'pretty' }}>
            A spotter&apos;s logbook for building visual literacy — study each aircraft like a field specimen before you practice identification. Observe, study, practice, assess.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/learn" className="btn btn-primary pressable">
              Start with Key Features →
            </Link>
            <Link to="/airpedia" className="btn btn-secondary pressable">
              Open the index
            </Link>
          </div>
        </div>
        <div className="home-hero-specimen">
          <div className="card" style={{ padding: 14 }}>
            <ImagePlate aircraft={specimen} kind="photo" label="Plate I · Specimen" height={280} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12 }}>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{specimen.family}</div>
              {specimen.nickname && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--ochre)' }}>&ldquo;{specimen.nickname}&rdquo;</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--surface-warm)', padding: '18px 20px', marginBottom: 34, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-muted)', marginBottom: 4 }}>
            Field Journal Progress
          </div>
          <div className="serif" style={{ fontSize: 46, fontWeight: 600, lineHeight: 1, color: 'var(--green)' }}>
            {overallProgress}%
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="mastery-bar" style={{ marginBottom: 8 }}>
            <div className="mastery-bar-fill" style={{ width: `${overallProgress}%` }} />
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
            Progress across all four modules — study first, then practice.
          </div>
        </div>
      </div>

      {!canStartExercise && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--brick)' }}>
          <strong style={{ color: 'var(--brick)' }}>Take a break.</strong> Review the Index or wait for your study energy to return. Reference material stays open.
        </div>
      )}

      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-muted)', marginBottom: 14 }}>
        The Curriculum
      </div>
      <div className="module-grid">
        {MODULES.map((mod) => {
          const prog = state.moduleProgress[mod.progressKey];
          const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
          return (
            <Link key={mod.id} to={mod.to} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={`module-card ${mod.open ? '' : 'module-card-locked'} ${mod.id === 'codes' ? 'module-card-teal' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 className="serif">{mod.num} · {mod.title}</h3>
                  <span className="mono" style={{ fontSize: 10, color: mod.id === 'codes' ? 'var(--teal)' : mod.open ? 'var(--ochre)' : 'var(--locked-text)' }}>
                    {mod.open ? 'OPEN' : 'SOON'}
                  </span>
                </div>
                <p>{mod.desc}</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="timestamp">{prog.completed}/{prog.total} complete</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
