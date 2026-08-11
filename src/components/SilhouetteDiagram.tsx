import type { Aircraft } from '../types';

interface SilhouetteProps {
  aircraft: Aircraft;
  width?: number;
  height?: number;
  showCallouts?: boolean;
  activeCallout?: string | null;
  onCalloutClick?: (id: string) => void;
  className?: string;
}

function getBodyPath(ac: Aircraft): string {
  const isHeli = ac.categoryGroup === 'helicopter';
  const isMilitary = ac.categoryGroup === 'military';
  const isWide = ac.engineCount >= 3 || ['b747', 'a380', 'a330', 'b767', 'b777', 'a350', 'b787'].includes(ac.id);
  const isBiz = ac.categoryGroup === 'business-jets';
  const isProp = ac.categoryGroup === 'propeller';

  if (isHeli) {
    if (ac.id === 'chinook') {
      return 'M 20 55 L 75 55 L 80 48 L 88 48 L 90 55 L 95 55 L 95 62 L 20 62 Z';
    }
    return 'M 30 50 Q 35 42 50 42 Q 65 42 70 50 L 72 58 L 28 58 Z';
  }

  if (isProp && ac.id === 'c172') {
    return 'M 15 48 L 85 48 L 88 52 L 88 58 L 12 58 L 12 52 Z';
  }

  if (isWide) {
    return 'M 8 46 Q 10 38 18 36 L 82 36 Q 90 38 92 46 L 94 54 L 6 54 Z';
  }

  if (isBiz) {
    return 'M 10 44 Q 12 38 20 36 L 80 36 Q 88 38 90 44 L 92 52 L 8 52 Z';
  }

  if (isMilitary && ac.engineCount === 1) {
    return 'M 5 48 L 88 42 L 95 48 L 92 54 L 5 54 Z';
  }

  return 'M 8 44 Q 10 38 16 36 L 84 36 Q 90 38 92 44 L 94 52 L 6 52 Z';
}

function getWingPath(ac: Aircraft): string {
  const isHeli = ac.categoryGroup === 'helicopter';
  const isPropHigh = ac.id === 'c172' || ac.id === 'dash8' || ac.id === 'atr72';
  const isWide = ac.engineCount >= 3 || ['b747', 'a380', 'a330', 'b767', 'b777', 'a350', 'b787'].includes(ac.id);

  if (isHeli) return '';
  if (isPropHigh) return 'M 25 48 L 75 48 L 78 42 L 22 42 Z';
  if (isWide) return 'M 18 50 L 82 50 L 86 44 L 14 44 Z';
  return 'M 22 50 L 78 50 L 82 46 L 18 46 Z';
}

function getTailPath(ac: Aircraft): string {
  const tTail = [
    'b727',
    'md11',
    'g650',
    'citationx',
    'global7500',
    'learjet75',
    'falcon7x',
    'dash8',
    'c909',
    'erj145',
    'crj',
    'bae146',
    'fokker100',
    'b717',
    'md80',
    'atr42',
    'atr72',
  ].includes(ac.id);
  if (tTail) return 'M 88 36 L 92 20 L 96 36 Z M 90 24 L 98 24 L 98 28 L 90 28 Z';
  return 'M 88 36 L 94 18 L 96 36 Z';
}

function getEngines(ac: Aircraft): { x: number; y: number }[] {
  if (ac.categoryGroup === 'helicopter') return [];
  if (ac.engineCount === 1) return [{ x: 12, y: 52 }];

  const rearTwin = ['c909', 'erj145', 'crj', 'fokker100', 'b717', 'md80', 'md11'].includes(ac.id);
  if (ac.engineCount === 2) {
    if (rearTwin) {
      return [
        { x: 72, y: 50 },
        { x: 72, y: 58 },
      ];
    }
    return [
      { x: 32, y: 54 },
      { x: 58, y: 54 },
    ];
  }
  if (ac.engineCount === 3) {
    if (ac.id === 'b727' || ac.id === 'falcon7x') {
      return [
        { x: 30, y: 54 },
        { x: 55, y: 54 },
        { x: 90, y: 48 },
      ];
    }
    return [
      { x: 25, y: 54 },
      { x: 45, y: 54 },
      { x: 70, y: 54 },
    ];
  }
  if (ac.engineCount >= 4) {
    if (ac.id === 'b52') {
      return [
        { x: 22, y: 56 },
        { x: 35, y: 56 },
        { x: 55, y: 56 },
        { x: 68, y: 56 },
      ];
    }
    if (ac.id === 'bae146') {
      return [
        { x: 28, y: 52 },
        { x: 40, y: 52 },
        { x: 55, y: 52 },
        { x: 67, y: 52 },
      ];
    }
    return [
      { x: 22, y: 54 },
      { x: 35, y: 54 },
      { x: 62, y: 54 },
      { x: 75, y: 54 },
    ];
  }
  return [];
}

function getRotorLines(ac: Aircraft): { x1: number; y1: number; x2: number; y2: number }[] {
  if (ac.categoryGroup !== 'helicopter') return [];
  if (ac.id === 'chinook') {
    return [
      { x1: 15, y1: 28, x2: 45, y2: 28 },
      { x1: 55, y1: 28, x2: 85, y2: 28 },
    ];
  }
  return [{ x1: 20, y1: 28, x2: 80, y2: 28 }];
}

export function SilhouetteDiagram({
  aircraft: ac,
  width = 400,
  height = 120,
  showCallouts = false,
  activeCallout = null,
  onCalloutClick,
  className,
}: SilhouetteProps) {
  const body = getBodyPath(ac);
  const wing = getWingPath(ac);
  const tail = getTailPath(ac);
  const engines = getEngines(ac);
  const rotorLines = getRotorLines(ac);

  return (
    <svg
      viewBox="0 0 100 70"
      width={width}
      height={height}
      className={className}
      aria-label={`${ac.family} silhouette diagram`}
    >
      {rotorLines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="rgba(46, 111, 114, 0.5)"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
      ))}
      {wing && <path d={wing} fill="rgba(46, 111, 114, 0.15)" stroke="rgba(46, 111, 114, 0.35)" strokeWidth="0.5" />}
      <path d={body} fill="rgba(35, 32, 26, 0.12)" stroke="rgba(35, 32, 26, 0.45)" strokeWidth="0.8" />
      {tail && <path d={tail} fill="rgba(35, 32, 26, 0.15)" stroke="rgba(35, 32, 26, 0.45)" strokeWidth="0.5" />}
      {engines.map((e, i) => (
        <ellipse
          key={i}
          cx={e.x}
          cy={e.y}
          rx={ac.engineCount >= 4 ? 4 : 5}
          ry={3}
          fill="rgba(60, 125, 84, 0.25)"
          stroke="rgba(60, 125, 84, 0.55)"
          strokeWidth="0.5"
        />
      ))}
      {ac.id === 'b747' && (
        <path d="M 14 36 Q 18 28 28 28 L 38 28 Q 42 32 38 36 Z" fill="rgba(35, 32, 26, 0.08)" stroke="rgba(35, 32, 26, 0.3)" strokeWidth="0.5" />
      )}
      {ac.id === 'a380' && (
        <rect x="12" y="32" width="76" height="8" fill="rgba(35, 32, 26, 0.06)" stroke="rgba(35, 32, 26, 0.25)" strokeWidth="0.5" />
      )}
      {showCallouts &&
        ac.callouts.map((c, i) => (
          <g
            key={c.id}
            className={`callout-pin ${activeCallout === c.id ? 'active' : ''}`}
            onClick={() => onCalloutClick?.(c.id)}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={c.x} cy={c.y} r="4" fill={activeCallout === c.id ? '#3c7d54' : '#c2772f'} stroke="#23201a" strokeWidth="0.5" />
            <text x={c.x} y={c.y + 1.5} textAnchor="middle" fontSize="4" fill="#fffdf8" fontWeight="bold">
              {i + 1}
            </text>
          </g>
        ))}
    </svg>
  );
}

export function MiniSilhouette({ aircraft: ac }: { aircraft: Aircraft }) {
  return <SilhouetteDiagram aircraft={ac} width={120} height={32} />;
}
