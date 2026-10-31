import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LESSON_PATH, MAX_CROWNS, type PathNode } from '../content/lessonPath';
import { formatLifeTimer } from '../utils/data';

type NodeStatus = 'locked' | 'current' | 'done';

function nodeIcon(kind: PathNode['kind'], status: NodeStatus) {
  if (status === 'done') return '★';
  if (kind === 'treasure') return '◆';
  if (kind === 'checkpoint') return '◎';
  if (kind === 'lesson') return '📖';
  return '▶';
}

export function HomePage() {
  const { state, canStartExercise, nextLifeIn, dailyGoal } = useApp();
  const currentNodeRef = useRef<HTMLLIElement | null>(null);

  const { statuses, continueNode } = useMemo(() => {
    const flat = LESSON_PATH.flatMap((u) => u.nodes);
    const map = new Map<string, NodeStatus>();
    let foundCurrent = false;
    let continueNode: PathNode | null = null;

    for (const node of flat) {
      const crowns = state.nodeCrowns[node.id] ?? 0;
      const done = crowns > 0 || state.completedNodes.includes(node.id);
      if (done) {
        map.set(node.id, 'done');
      } else if (!foundCurrent) {
        map.set(node.id, 'current');
        continueNode = node;
        foundCurrent = true;
      } else {
        map.set(node.id, 'locked');
      }
    }
    if (!continueNode && flat.length) {
      // All done — point at last practice for replay
      continueNode = flat[flat.length - 1];
      map.set(continueNode.id, 'current');
    }
    return { statuses: map, continueNode };
  }, [state.nodeCrowns, state.completedNodes]);

  useEffect(() => {
    if (!currentNodeRef.current) return;
    const id = window.setTimeout(() => {
      currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
    return () => window.clearTimeout(id);
  }, [continueNode?.id]);

  const dailyPct = Math.min(100, Math.round((state.dailyXp / dailyGoal) * 100));
  const weakCount = state.mistakeAircraftIds.length;

  return (
    <div className="path-home">
      <section className="path-hud" aria-label="Daily progress">
        <div className="path-hud-item">
          <div className="path-hud-label">Streak</div>
          <div className="path-hud-value path-hud-streak">
            <span aria-hidden>🔥</span> {state.streak}
          </div>
        </div>
        <div className="path-hud-item">
          <div className="path-hud-label">Total XP</div>
          <div className="path-hud-value">{state.xp.toLocaleString()}</div>
        </div>
        <div className="path-hud-item path-hud-item--grow">
          <div className="path-hud-label">Daily goal · {state.dailyXp}/{dailyGoal} XP</div>
          <div className="path-daily-bar">
            <div className="path-daily-fill" style={{ width: `${dailyPct}%` }} />
          </div>
        </div>
        <div className="path-hud-item">
          <div className="path-hud-label">Hearts</div>
          <div className="path-hud-value path-hud-hearts">
            <span aria-hidden>♥</span> {state.lives}
          </div>
          {!canStartExercise && nextLifeIn != null && (
            <div className="mono text-muted" style={{ fontSize: 10 }}>+1 in {formatLifeTimer(nextLifeIn)}</div>
          )}
        </div>
      </section>

      <header className="path-brand">
        <div className="eyebrow">Spotter Field Guide</div>
        <h1 className="serif path-title">Your flight path</h1>
        <p className="path-lead">
          Short lessons. Instant feedback. Come back daily to keep your streak.
        </p>
      </header>

      {continueNode && (
        <div className="path-continue-wrap">
          <Link
            to={canStartExercise ? continueNode.to : '#'}
            className={`btn btn-primary pressable path-continue ${!canStartExercise ? 'is-disabled' : ''}`}
            onClick={(e) => {
              if (!canStartExercise) e.preventDefault();
            }}
            aria-disabled={!canStartExercise}
          >
            {state.completedNodes.length === 0 ? 'Start Unit 1' : 'Continue'} →
          </Link>
          <div className="path-continue-hint mono">
            NEXT · {continueNode.title.toUpperCase()}
          </div>
        </div>
      )}

      {weakCount > 0 && (
        <div className="path-weak-spots">
          <div>
            <div className="mono path-weak-kicker">Practice mistakes</div>
            <p className="path-weak-copy">
              {weakCount} aircraft in your weak-spot queue — clear them with first-try IDs.
            </p>
          </div>
          <Link
            to={canStartExercise ? '/spotter?practice=mistakes&mode=easy' : '#'}
            className={`btn btn-secondary pressable ${!canStartExercise ? 'is-disabled' : ''}`}
            onClick={(e) => {
              if (!canStartExercise) e.preventDefault();
            }}
            aria-disabled={!canStartExercise}
          >
            Practice · {weakCount}
          </Link>
        </div>
      )}

      {!canStartExercise && (
        <div className="path-out-of-hearts">
          <strong>Out of hearts.</strong> Review the Index or wait for one to refill — then jump back on the path.
        </div>
      )}

      <div className="path-units">
        {LESSON_PATH.map((unit, unitIdx) => {
          const unitUnlocked =
            unitIdx === 0 ||
            LESSON_PATH[unitIdx - 1].nodes.every(
              (n) => (state.nodeCrowns[n.id] ?? 0) > 0 || state.completedNodes.includes(n.id)
            );

          return (
            <section key={unit.id} className={`path-unit ${unitUnlocked ? '' : 'is-locked'}`}>
              <div className="path-unit-banner">
                <div className="mono path-unit-kicker">{unit.title}</div>
                <p>{unit.description}</p>
              </div>

              <ol className="path-track">
                {unit.nodes.map((node, i) => {
                  const status = !unitUnlocked ? 'locked' : statuses.get(node.id) ?? 'locked';
                  const crowns = state.nodeCrowns[node.id] ?? 0;
                  const clickable = status !== 'locked' && (canStartExercise || status === 'done');
                  const isCurrent = status === 'current';

                  return (
                    <li
                      key={node.id}
                      ref={isCurrent ? currentNodeRef : undefined}
                      className={`path-node path-node--${status} path-node--${node.kind}`}
                      data-node={node.id}
                    >
                      {i > 0 && <div className="path-connector" aria-hidden />}
                      <Link
                        to={clickable ? node.to : '#'}
                        className="path-node-btn pressable"
                        onClick={(e) => {
                          if (!clickable) e.preventDefault();
                        }}
                        aria-disabled={!clickable}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        <span className="path-node-ring">
                          <span className="path-node-glyph">{nodeIcon(node.kind, status)}</span>
                        </span>
                        <span className="path-node-copy">
                          <span className="path-node-title">{node.title}</span>
                          <span className="path-node-sub">{node.subtitle}</span>
                          <span className="path-crowns" aria-label={`${crowns} of ${MAX_CROWNS} crowns`}>
                            {'♛'.repeat(crowns)}
                            <span className="path-crowns-empty">{'♛'.repeat(Math.max(0, MAX_CROWNS - crowns))}</span>
                          </span>
                        </span>
                        <span className="path-node-xp">+{node.xpReward} XP</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
