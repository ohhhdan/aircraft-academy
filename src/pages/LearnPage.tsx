import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { LessonCompleteResult } from '../context/AppContext';
import { MiniAircraftDiagram } from '../components/AircraftDiagram';
import { ImagePlate } from '../components/ImagePlate';
import { PlateCarousel } from '../components/PlateCarousel';
import { AircraftFacts } from '../components/AircraftFacts';
import { LessonComplete } from '../components/LessonComplete';
import { XpPop } from '../components/XpPop';
import {
  QuizFeedback,
  OptionContent,
  getOptionMarkState,
  pickerCardClass,
} from '../components/QuizFeedback';
import {
  aircraft,
  getAircraftByCategory,
  getAircraftByEngineCount,
} from '../utils/data';
import { getNodeById, XP_PER_CORRECT } from '../content/lessonPath';
import { CATEGORY_ORDER, type Aircraft, type CategoryGroup } from '../types';
import { recallLearnMore } from '../utils/learnMore';

type Phase = 'browse' | 'study' | 'recall' | 'result';

const ENGINE_SECTIONS = [
  { label: 'Twin Engine', count: 2 },
  { label: 'Single Engine', count: 1 },
  { label: '3+ Engine', count: 3 },
];

export function LearnPage() {
  const [params] = useSearchParams();
  const nodeId = params.get('node');
  const groupParam = params.get('group') as CategoryGroup | null;
  const pathNode = nodeId ? getNodeById(nodeId) : undefined;

  const {
    startExercise,
    endExercise,
    loseLife,
    markAircraftMastered,
    recordModuleProgress,
    awardLessonComplete,
    recordMistake,
    clearMistake,
    canStartExercise,
    state,
    preferences,
  } = useApp();
  const [category, setCategory] = useState<CategoryGroup | null>(
    groupParam ?? pathNode?.categoryGroup ?? null
  );
  const [lessonResult, setLessonResult] = useState<LessonCompleteResult | null>(null);
  const [engineFilter, setEngineFilter] = useState<number | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [activeCallout, setActiveCallout] = useState<string | null>(null);
  const [studied, setStudied] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('browse');
  const [recallAircraft, setRecallAircraft] = useState<Aircraft[]>([]);
  const [recallCallout, setRecallCallout] = useState<{ label: string; correctId: string } | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; explanation: string; learnMore?: React.ReactNode; xp?: number } | null>(null);
  const [answered, setAnswered] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [lostLifeThisQuestion, setLostLifeThisQuestion] = useState(false);
  const [xpPop, setXpPop] = useState(0);

  const sectionAircraft = useMemo(() => {
    if (!category || engineFilter === null) return [];
    return getAircraftByEngineCount(category, engineFilter);
  }, [category, engineFilter]);

  const handleStartRecall = useCallback(() => {
    if (studied.length < 3) return;
    const ids = studied.slice(-3);
    const acs = ids.map((id) => aircraft.find((a) => a.id === id)!).filter(Boolean);
    const target = acs[Math.floor(Math.random() * acs.length)];
    const callout = target.callouts[Math.floor(Math.random() * target.callouts.length)];
    setRecallAircraft(acs);
    setRecallCallout({ label: callout.label, correctId: target.id });
    setPhase('recall');
    setAnswered(false);
    setChosenId(null);
    setLostLifeThisQuestion(false);
    setFeedback(null);
    startExercise('learn');
  }, [studied, startExercise]);

  const handleRecallAnswer = (id: string) => {
    if (answered || !recallCallout) return;
    const ok = id === recallCallout.correctId;
    const correctAc = aircraft.find((a) => a.id === recallCallout.correctId)!;
    const chosenAc = aircraft.find((a) => a.id === id);
    setChosenId(id);
    setAnswered(true);

    if (ok) {
      const firstTry = !lostLifeThisQuestion;
      markAircraftMastered(id);
      if (firstTry) {
        clearMistake(id);
        setXpPop((n) => n + 1);
      }
      setFeedback({
        ok: true,
        xp: firstTry ? XP_PER_CORRECT : undefined,
        explanation: `"${recallCallout.label}" identifies the ${correctAc.family}.`,
      });
      const newCompleted = Math.min(state.moduleProgress.learn.completed + 1, state.moduleProgress.learn.total);
      recordModuleProgress('learn', newCompleted, state.moduleProgress.learn.total);
    } else {
      if (!lostLifeThisQuestion) {
        loseLife();
        setLostLifeThisQuestion(true);
        recordMistake(recallCallout.correctId);
      }
      setFeedback({
        ok: false,
        explanation: `The answer is ${correctAc.family}${chosenAc ? `, not ${chosenAc.family}` : ''}. The callout "${recallCallout.label}" belongs on the ${correctAc.manufacturer} ${correctAc.family}.`,
        learnMore: recallLearnMore(correctAc, recallCallout.label, preferences.showLearnLinks),
      });
    }
  };

  const resetRecallQuestion = () => {
    setAnswered(false);
    setChosenId(null);
    setFeedback(null);
  };

  const finishStudy = () => {
    let newStudied = studied;
    if (selectedAircraft && !studied.includes(selectedAircraft.id)) {
      newStudied = [...studied, selectedAircraft.id];
      setStudied(newStudied);
    }
    setSelectedAircraft(null);
    setActiveCallout(null);
    setPhase('browse');
    if (newStudied.length >= 3) {
      handleStartRecall();
    }
  };

  const resetBrowse = () => {
    setPhase('browse');
    setCategory(groupParam ?? pathNode?.categoryGroup ?? null);
    setEngineFilter(null);
    setSelectedAircraft(null);
    setFeedback(null);
    endExercise();
  };

  const completePathLesson = (ok: boolean) => {
    if (!ok) {
      resetBrowse();
      return;
    }
    const result = awardLessonComplete({
      nodeId: pathNode?.id ?? (groupParam ? `learn-${groupParam}` : null),
      moduleId: 'learn',
      correct: ok ? 1 : 0,
      total: 1,
      baseXp: pathNode?.xpReward ?? 15,
    });
    setLessonResult(result);
    setPhase('result');
    endExercise();
  };

  if (phase === 'result' && lessonResult) {
    return (
      <LessonComplete
        result={lessonResult}
        score={1}
        total={1}
        title="Study lesson complete!"
        onAgain={() => {
          setLessonResult(null);
          setStudied([]);
          resetBrowse();
        }}
      />
    );
  }

  if (phase === 'recall' && recallCallout) {
    return (
      <div>
        <XpPop trigger={xpPop} amount={XP_PER_CORRECT} />
        <div className="eyebrow">Recall Check</div>
        <h2 className="serif" style={{ margin: '0 0 8px' }}>Match the callout</h2>
        <p style={{ color: 'var(--ink-faint)' }}>
          Which aircraft has the feature: <strong>{recallCallout.label}</strong>?
        </p>
        <div className="visual-picker">
          {recallAircraft.map((ac) => {
            const mark = getOptionMarkState(ac.id, chosenId, recallCallout.correctId, answered);
            return (
              <button
                key={ac.id}
                type="button"
                className={pickerCardClass(mark)}
                onClick={() => handleRecallAnswer(ac.id)}
                disabled={answered || !canStartExercise}
              >
                <div className="mini-silhouette">
                  <MiniAircraftDiagram aircraft={ac} />
                </div>
                <OptionContent label={ac.family} state={mark} />
              </button>
            );
          })}
        </div>
        {feedback && (
          <QuizFeedback
            correct={feedback.ok}
            explanation={feedback.explanation}
            learnMore={feedback.learnMore}
            xpGained={feedback.xp}
            onNext={feedback.ok ? () => completePathLesson(true) : undefined}
            onRetry={!feedback.ok ? resetRecallQuestion : undefined}
            nextLabel="Claim XP →"
          />
        )}
      </div>
    );
  }

  if (selectedAircraft) {
    const callout = selectedAircraft.callouts.find((c) => c.id === activeCallout);
    const features = [
      ...selectedAircraft.callouts.map((c) => ({ label: c.label, blurb: c.description })),
      ...selectedAircraft.keyFeatures
        .filter((f) => !selectedAircraft.callouts.some((c) => c.label.toLowerCase().includes(f.slice(0, 8).toLowerCase())))
        .map((f) => ({ label: f.charAt(0).toUpperCase() + f.slice(1), blurb: f })),
    ].slice(0, 4);
    const oneLineTell =
      selectedAircraft.keyFeatures.slice(0, 2).join(' — ') + (selectedAircraft.keyFeatures.length ? '.' : '');

    return (
      <div>
        <button type="button" className="back-link" onClick={() => { setSelectedAircraft(null); setActiveCallout(null); }}>
          ← Browse
        </button>
        <h2 className="serif" style={{ fontSize: 36, margin: '4px 0 12px' }}>{selectedAircraft.family}</h2>
        {selectedAircraft.nickname && (
          <p className="serif" style={{ fontStyle: 'italic', color: 'var(--ochre)', margin: '0 0 12px' }}>
            &ldquo;{selectedAircraft.nickname}&rdquo;
          </p>
        )}
        <AircraftFacts aircraft={selectedAircraft} />
        <div className="detail-grid" style={{ marginTop: 18 }}>
          <div>
            <PlateCarousel aircraft={selectedAircraft} height={260} />
          </div>
          <div>
            <h3 className="serif" style={{ fontSize: 22, margin: '0 0 16px' }}>How to spot it</h3>
            {features.map((f, i) => (
              <div key={f.label} className="feature-item">
                <div className="feature-badge">{i + 1}</div>
                <div>
                  <strong>{f.label}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-faint)' }}>{f.blurb}</p>
                </div>
              </div>
            ))}
            {callout && (
              <div className="card" style={{ marginTop: 12, padding: 12, boxShadow: 'var(--shadow-sm)' }}>
                <strong>{callout.label}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--ink-faint)' }}>{callout.description}</p>
              </div>
            )}
            <div className="tell-callout">
              <strong style={{ color: 'var(--teal)' }}>One-line tell:</strong> {oneLineTell}
            </div>
            {selectedAircraft.geekFacts.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', marginBottom: 8 }}>Field notes</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-faint)', fontSize: 14 }}>
                  {selectedAircraft.geekFacts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            <button className="btn btn-primary pressable" style={{ marginTop: 20 }} onClick={finishStudy}>
              Log specimen to journal →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (category && engineFilter !== null) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => { setEngineFilter(null); }} style={{ marginBottom: 16 }}>
          ← Categories
        </button>
        <div className="eyebrow">{CATEGORY_ORDER.find((c) => c.id === category)?.label}</div>
        <h2 className="serif" style={{ margin: '0 0 8px' }}>
          {ENGINE_SECTIONS.find((e) => e.count === engineFilter)?.label}
        </h2>
        <p className="text-faint" style={{ fontSize: '0.9rem' }}>
          Select an aircraft type to learn more. After you&apos;ve logged 3 aircraft, answer a question to check your understanding.
        </p>
        <div className="grid-browse" style={{ marginTop: 16 }}>
          {sectionAircraft.map((ac) => (
            <button
              key={ac.id}
              type="button"
              className={`card pressable ${studied.includes(ac.id) ? 'mastered' : ''}`}
              style={{ padding: 14, textAlign: 'left', width: '100%', borderColor: studied.includes(ac.id) ? 'var(--green)' : undefined }}
              onClick={() => { setSelectedAircraft(ac); setPhase('study'); startExercise('learn'); }}
              disabled={!canStartExercise}
            >
              <ImagePlate aircraft={ac} kind="diagram" height={80} />
              <div className="serif" style={{ fontSize: 18, fontWeight: 600, marginTop: 10 }}>{ac.family}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 4 }}>
                {ac.manufacturer.toUpperCase()} · {ac.introYear}
              </div>
            </button>
          ))}
        </div>
        {studied.length >= 3 && (
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleStartRecall}>
          Recall check ({studied.length} logged)
          </button>
        )}
      </div>
    );
  }

  if (category) {
    const meta = CATEGORY_ORDER.find((c) => c.id === category)!;
    return (
      <div>
        <button type="button" className="back-link" onClick={() => setCategory(null)}>
          ← All collections
        </button>
        <div className="eyebrow">Module 01 · Key Features</div>
        <h2 className="serif" style={{ margin: '0 0 8px' }}>{meta.label}</h2>
        <p className="text-faint">{meta.description}</p>
        <div className="engine-section">
          {ENGINE_SECTIONS.map((sec) => {
            const count = getAircraftByEngineCount(category, sec.count).length;
            if (count === 0) return null;
            return (
              <button
                key={sec.count}
                className="category-btn"
                style={{ width: '100%', marginBottom: 8 }}
                onClick={() => setEngineFilter(sec.count)}
              >
                <span>{sec.label}</span>
                <span className="count">{count} aircraft</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="eyebrow">Module 01 · Key Features</div>
      <h2 className="serif" style={{ margin: '0 0 8px' }}>Study aircraft by category</h2>
      <p style={{ color: 'var(--ink-faint)', maxWidth: 560 }}>
        Start with <strong>Commercial Jets</strong> for the types you see at every gate.
      </p>
      <div className="category-list" style={{ marginTop: 20 }}>
        {CATEGORY_ORDER.map((cat) => {
          const count = getAircraftByCategory(cat.id).length;
          return (
            <button
              key={cat.id}
              className="category-btn"
              onClick={() => setCategory(cat.id)}
            >
              <div>
                <strong>{cat.label}</strong>
                <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                  {cat.description}
                </div>
              </div>
              <span className="count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
