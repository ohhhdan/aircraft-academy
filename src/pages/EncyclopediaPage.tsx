import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AircraftDiagram } from '../components/AircraftDiagram';
import { ImagePlate } from '../components/ImagePlate';
import { useMedia } from '../context/MediaContext';
import { aircraft, airports } from '../utils/data';
import type { Aircraft } from '../types';

type Tab = 'aircraft' | 'airports';
type RefFilter = 'all' | 'jet' | 'propeller' | 'oldies' | 'airbus' | 'boeing';

const REF_FILTERS: { id: RefFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'jet', label: 'Jet' },
  { id: 'propeller', label: 'Propeller' },
  { id: 'oldies', label: 'Oldies' },
  { id: 'airbus', label: 'Airbus' },
  { id: 'boeing', label: 'Boeing' },
];

function applyRefFilter(list: Aircraft[], filter: RefFilter): Aircraft[] {
  switch (filter) {
    case 'jet':
      return list.filter((a) => a.categoryGroup !== 'propeller' && a.categoryGroup !== 'helicopter');
    case 'propeller':
      return list.filter((a) => a.categoryGroup === 'propeller');
    case 'oldies':
      return list.filter((a) => a.introYear < 1980 || a.skycardsCategories.some((c) => c.toLowerCase().includes('old')));
    case 'airbus':
      return list.filter((a) => a.manufacturer.toLowerCase().includes('airbus'));
    case 'boeing':
      return list.filter((a) => a.manufacturer.toLowerCase().includes('boeing'));
    default:
      return list;
  }
}

export function EncyclopediaPage() {
  const { exerciseSession } = useApp();
  const navigate = useNavigate();
  const { getSpotPhoto } = useMedia();
  const [tab, setTab] = useState<Tab>('aircraft');
  const [search, setSearch] = useState('');
  const [refFilter, setRefFilter] = useState<RefFilter>('all');
  const [selected, setSelected] = useState<Aircraft | null>(null);
  const [activeCallout, setActiveCallout] = useState<string | null>(null);

  const filteredAircraft = useMemo(() => {
    let list = applyRefFilter(aircraft, refFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.family.toLowerCase().includes(q) ||
          a.manufacturer.toLowerCase().includes(q) ||
          a.id.includes(q) ||
          (a.nickname?.toLowerCase().includes(q) ?? false) ||
          a.skycardsCategories.some((c) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, refFilter]);

  const filteredAirports = useMemo(() => {
    if (!search) return airports.slice(0, 50);
    const q = search.toUpperCase();
    return airports.filter(
      (a) =>
        a.iata.includes(q) ||
        a.icao.includes(q) ||
        a.city.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  if (exerciseSession?.active) {
    return (
      <div className="card index-locked">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <h2 className="serif" style={{ margin: '16px 0 8px' }}>Index locked</h2>
        <p className="text-faint">
          Finish your current quiz before opening the reference index.
        </p>
        <button type="button" className="btn btn-primary pressable" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          Return to quiz
        </button>
      </div>
    );
  }

  if (selected) {
    const callout = selected.callouts.find((c) => c.id === activeCallout);
    const equivs = selected.equivalents.map((id) => aircraft.find((a) => a.id === id)?.family).filter(Boolean);
    const features = selected.keyFeatures.slice(0, 4);

    return (
      <div>
        <button type="button" className="back-link" onClick={() => { setSelected(null); setActiveCallout(null); }}>
          ← Back to index
        </button>
        <div className="mono text-muted" style={{ fontSize: 11 }}>
          {selected.manufacturer.toUpperCase()} · {selected.introYear}
        </div>
        <h2 className="serif" style={{ fontSize: 36, margin: '4px 0' }}>{selected.family}</h2>
        {selected.nickname && (
          <p className="serif" style={{ fontStyle: 'italic', color: 'var(--ochre)', margin: '0 0 20px' }}>
            &ldquo;{selected.nickname}&rdquo;
          </p>
        )}
        <div className="detail-grid">
          <div>
            <ImagePlate aircraft={selected} kind="photo" label="Plate A · Photograph" height={220} />
            <div style={{ marginTop: 14 }}>
              <AircraftDiagram
                aircraft={selected}
                showCallouts
                activeCallout={activeCallout}
                onCalloutClick={setActiveCallout}
              />
            </div>
          </div>
          <div>
            <table className="spec-table">
              <tbody>
                <tr><td>Service entry</td><td>{selected.introYear}</td></tr>
                <tr><td>Range</td><td>{selected.rangeNm.toLocaleString()} nm</td></tr>
                <tr><td>Engines</td><td>{selected.engineCount}</td></tr>
                <tr><td>Variants</td><td>{selected.variants.join(', ')}</td></tr>
                <tr><td>Role</td><td>{selected.role}</td></tr>
                {equivs.length > 0 && <tr><td>Rival</td><td>{equivs.join(', ')}</td></tr>}
              </tbody>
            </table>

            <h3 className="serif" style={{ fontSize: 22, margin: '20px 0 12px' }}>How to spot it</h3>
            {features.map((f, i) => (
              <div key={f} className="feature-item">
                <div className="feature-badge">{i + 1}</div>
                <div>
                  <strong>{f.charAt(0).toUpperCase() + f.slice(1)}</strong>
                </div>
              </div>
            ))}
            {callout && (
              <div className="card" style={{ marginTop: 12, padding: 12, boxShadow: 'var(--shadow-sm)' }}>
                <strong>{callout.label}</strong>
                <p className="text-faint" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{callout.description}</p>
              </div>
            )}
            {selected.keyFeatures.length > 0 && (
              <div className="tell-callout">
                <strong style={{ color: 'var(--teal)' }}>One-line tell:</strong>{' '}
                {selected.keyFeatures.slice(0, 2).join(' — ')}.
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <div className="mono text-muted" style={{ fontSize: 10, marginBottom: 8 }}>Appears in collections</div>
              {selected.skycardsCategories.map((tag) => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="eyebrow">Reference · Index</div>
      <h2 className="serif" style={{ margin: '0 0 8px' }}>Aircraft index</h2>
      <p className="text-faint" style={{ fontSize: '0.95rem', maxWidth: 560, textWrap: 'pretty' }}>
        Search and filter every specimen in the logbook. Available anytime outside an active quiz.
      </p>

      <input
        className="search-input"
        placeholder={tab === 'aircraft' ? '⌕ Search aircraft, maker, nickname…' : '⌕ Search IATA, ICAO, city…'}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" className={`btn ${tab === 'aircraft' ? 'btn-primary' : 'btn-secondary'} pressable`} onClick={() => setTab('aircraft')}>
          Aircraft ({aircraft.length})
        </button>
        <button type="button" className={`btn ${tab === 'airports' ? 'btn-primary' : 'btn-secondary'} pressable`} onClick={() => setTab('airports')}>
          Airports ({airports.length})
        </button>
      </div>

      {tab === 'aircraft' && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {REF_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`aircraft-chip ${refFilter === f.id ? 'mastered' : ''}`}
                onClick={() => setRefFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="grid-ref">
            {filteredAircraft.map((ac) => {
              const photo = getSpotPhoto(ac);
              return (
                <button key={ac.id} type="button" className="ref-card pressable" onClick={() => setSelected(ac)}>
                  <div className="ref-card-thumb">
                    {photo.url ? (
                      <img src={photo.url} alt={ac.family} />
                    ) : (
                      <span className="text-muted" style={{ fontSize: 12 }}>No photo</span>
                    )}
                  </div>
                  <div className="ref-card-title">{ac.family}</div>
                  <div className="ref-card-meta">
                    {ac.manufacturer} · {ac.introYear}
                    {ac.nickname ? ` · “${ac.nickname}”` : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === 'airports' && (
        <div className="encyclopedia-list" style={{ maxHeight: 'none' }}>
          {filteredAirports.map((ap) => (
            <div key={ap.iata} className="encyclopedia-item">
              <span className={`tier-badge tier-${ap.tier}`}>{ap.tier}</span>{' '}
              <strong>{ap.iata}</strong> / {ap.icao} — {ap.city}, {ap.country}
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{ap.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
