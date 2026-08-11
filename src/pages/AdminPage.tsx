import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMedia } from '../context/MediaContext';
import { aircraft, photoCatalog, getCatalogPhotos } from '../utils/data';
import { CATEGORY_ORDER } from '../types';

export function AdminPage() {
  const {
    records,
    resolved,
    saveSpotPhoto,
    saveDiagram,
    removeSpotPhoto,
    removeDiagram,
    exportPack,
    importPack,
    loading,
  } = useMedia();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = aircraft;
    if (category !== 'all') list = list.filter((a) => a.categoryGroup === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.family.toLowerCase().includes(q) ||
          a.id.includes(q) ||
          a.manufacturer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, category]);

  const catalogStats = photoCatalog.stats;

  const handleImport = async (file: File) => {
    const count = await importPack(file);
    setStatus(`Imported media for ${count} aircraft.`);
  };

  if (loading) {
    return <div className="admin-page"><p>Loading media library…</p></div>;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="eyebrow">Media Admin</div>
          <h1 style={{ margin: '0 0 8px', fontWeight: 400 }}>Aircraft Image Manager</h1>
          <p style={{ margin: 0, color: 'var(--ink-faint)', maxWidth: 640 }}>
            Browser uploads override everything. For photos baked into the build, drop files in{' '}
            <code>photos/</code> and run <code>npm run sync-photos</code> — catalog coverage:{' '}
            {catalogStats.aircraftCovered}/{aircraft.length} aircraft ({catalogStats.matched} files).
          </p>
        </div>
        <Link to="/" className="btn btn-secondary">← Back to app</Link>
      </header>

      <div className="admin-toolbar card">
        <input
          className="search-input"
          style={{ margin: 0 }}
          placeholder="Search aircraft…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className={`aircraft-chip ${category === 'all' ? 'mastered' : ''}`} onClick={() => setCategory('all')}>All</button>
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c.id}
              className={`aircraft-chip ${category === c.id ? 'mastered' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => exportPack()}>Export media pack</button>
          <button className="btn btn-secondary" onClick={() => importRef.current?.click()}>Import media pack</button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </div>
        {status && <p className="feedback-ok" style={{ marginTop: 12, marginBottom: 0 }}>{status}</p>}
      </div>

      <div className="admin-grid">
        {filtered.map((ac) => (
          <AircraftMediaCard
            key={ac.id}
            aircraft={ac}
            hasSpot={!!resolved.get(ac.id)?.spotPhoto}
            hasDiagram={!!resolved.get(ac.id)?.diagram}
            record={records.get(ac.id)}
            onSaveSpot={saveSpotPhoto}
            onSaveDiagram={saveDiagram}
            onClearSpot={removeSpotPhoto}
            onClearDiagram={removeDiagram}
            onStatus={setStatus}
          />
        ))}
      </div>
    </div>
  );
}

interface CardProps {
  aircraft: (typeof aircraft)[0];
  hasSpot: boolean;
  hasDiagram: boolean;
  record?: import('../utils/mediaStore').AircraftMediaRecord;
  onSaveSpot: (id: string, input: { url?: string; file?: File; attribution?: string; variant?: string }) => Promise<void>;
  onSaveDiagram: (id: string, input: { url?: string; file?: File; attribution?: string }) => Promise<void>;
  onClearSpot: (id: string) => Promise<void>;
  onClearDiagram: (id: string) => Promise<void>;
  onStatus: (msg: string) => void;
}

function AircraftMediaCard({
  aircraft: ac,
  hasSpot,
  hasDiagram,
  record,
  onSaveSpot,
  onSaveDiagram,
  onClearSpot,
  onClearDiagram,
  onStatus,
}: CardProps) {
  const { resolved, getSpotPhoto, getDiagram } = useMedia();
  const spot = resolved.get(ac.id)?.spotPhoto ?? (getSpotPhoto(ac).url ? getSpotPhoto(ac) : null);
  const diagram = getDiagram(ac);
  const local = getCatalogPhotos(ac);

  const [spotUrl, setSpotUrl] = useState(record?.spotPhotoUrl ?? '');
  const [spotAttr, setSpotAttr] = useState(record?.spotAttribution ?? '');
  const [diagramUrl, setDiagramUrl] = useState(record?.diagramUrl ?? '');
  const [diagramAttr, setDiagramAttr] = useState(record?.diagramAttribution ?? '');

  return (
    <div className="admin-card card">
      <div className="admin-card-head">
        <div>
          <strong>{ac.family}</strong>
          <div className="timestamp">ID: {ac.id} • {ac.manufacturer}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {local.spot.length > 0 && (
            <span className="tier-badge tier-hard">Local spot ×{local.spot.length}</span>
          )}
          {local.diagram.length > 0 && (
            <span className="tier-badge tier-hard">Local diagram ×{local.diagram.length}</span>
          )}
          {hasSpot && <span className="tier-badge tier-easy">Spot</span>}
          {hasDiagram && <span className="tier-badge tier-medium">Diagram</span>}
        </div>
      </div>

      <div className="admin-media-section">
        <h4>Spot photo <span className="timestamp">(Spotter module)</span></h4>
        {spot?.url && (
          <div className="admin-preview">
            <img src={spot.url} alt={`${ac.family} spot`} />
          </div>
        )}
        <label className="admin-label">
          Upload file
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              await onSaveSpot(ac.id, { file: f, attribution: spotAttr || 'User provided' });
              onStatus(`Spot photo saved for ${ac.family}`);
              e.target.value = '';
            }}
          />
        </label>
        <label className="admin-label">
          Or paste image URL (Wikimedia, etc.)
          <input
            className="search-input"
            placeholder="https://upload.wikimedia.org/..."
            value={spotUrl}
            onChange={(e) => setSpotUrl(e.target.value)}
          />
        </label>
        <label className="admin-label">
          Attribution
          <input
            className="search-input"
            placeholder="Photo credit / source"
            value={spotAttr}
            onChange={(e) => setSpotAttr(e.target.value)}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            onClick={async () => {
              if (!spotUrl.trim()) return;
              await onSaveSpot(ac.id, { url: spotUrl.trim(), attribution: spotAttr || 'User provided' });
              onStatus(`Spot URL saved for ${ac.family}`);
            }}
          >
            Save URL
          </button>
          {hasSpot && (
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={async () => {
                await onClearSpot(ac.id);
                setSpotUrl('');
                onStatus(`Spot photo cleared for ${ac.family}`);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="admin-media-section">
        <h4>Profile diagram <span className="timestamp">(Learn + Airpedia)</span></h4>
        <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 8px' }}>
          Side-view illustration with labeled callouts. Replaces the auto-generated SVG silhouette.
        </p>
        {diagram?.url && (
          <div className="admin-preview">
            <img src={diagram.url} alt={`${ac.family} diagram`} />
          </div>
        )}
        <label className="admin-label">
          Upload diagram
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              await onSaveDiagram(ac.id, { file: f, attribution: diagramAttr });
              onStatus(`Diagram saved for ${ac.family}`);
              e.target.value = '';
            }}
          />
        </label>
        <label className="admin-label">
          Or paste diagram URL
          <input
            className="search-input"
            placeholder="https://..."
            value={diagramUrl}
            onChange={(e) => setDiagramUrl(e.target.value)}
          />
        </label>
        <label className="admin-label">
          Attribution (optional)
          <input
            className="search-input"
            value={diagramAttr}
            onChange={(e) => setDiagramAttr(e.target.value)}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            onClick={async () => {
              if (!diagramUrl.trim()) return;
              await onSaveDiagram(ac.id, { url: diagramUrl.trim(), attribution: diagramAttr });
              onStatus(`Diagram URL saved for ${ac.family}`);
            }}
          >
            Save URL
          </button>
          {hasDiagram && (
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={async () => {
                await onClearDiagram(ac.id);
                setDiagramUrl('');
                onStatus(`Diagram cleared for ${ac.family}`);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
