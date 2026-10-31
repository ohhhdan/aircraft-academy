import { useMedia } from '../context/MediaContext';
import type { Aircraft } from '../types';
import { SilhouetteDiagram } from './SilhouetteDiagram';

interface AircraftDiagramProps {
  aircraft: Aircraft;
  showCallouts?: boolean;
  activeCallout?: string | null;
  onCalloutClick?: (id: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

export function AircraftDiagram({
  aircraft,
  showCallouts = false,
  activeCallout = null,
  onCalloutClick,
  width,
  height,
  className,
}: AircraftDiagramProps) {
  const { getDiagram, loading } = useMedia();
  const custom = getDiagram(aircraft);

  if (!loading && custom?.url) {
    return (
      <div className={`diagram-viewer ${className ?? ''}`} style={{ position: 'relative' }}>
        <img
          src={custom.url}
          alt={`${aircraft.family} identification diagram`}
          style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
        />
        {showCallouts &&
          aircraft.callouts.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`callout-pin ${activeCallout === c.id ? 'active' : ''}`}
              style={{
                position: 'absolute',
                left: `${c.x}%`,
                top: `${c.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid #fff',
                background: activeCallout === c.id ? '#2cc0b9' : '#ff8c00',
                color: '#0a0f1e',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                zIndex: 2,
              }}
              onClick={() => onCalloutClick?.(c.id)}
              aria-label={c.label}
            >
              {i + 1}
            </button>
          ))}
      </div>
    );
  }

  return (
    <SilhouetteDiagram
      aircraft={aircraft}
      showCallouts={showCallouts}
      activeCallout={activeCallout}
      onCalloutClick={onCalloutClick}
      width={width}
      height={height}
      className={className}
    />
  );
}

export function MiniAircraftDiagram({ aircraft }: { aircraft: Aircraft }) {
  const { getDiagram, loading } = useMedia();
  const custom = getDiagram(aircraft);

  if (!loading && custom?.url) {
    return (
      <img
        src={custom.url}
        alt=""
        style={{ height: 32, width: 'auto', maxWidth: 120, objectFit: 'contain', opacity: 0.85 }}
      />
    );
  }

  return <SilhouetteDiagram aircraft={aircraft} width={120} height={32} />;
}
