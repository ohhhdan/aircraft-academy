import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { LessonCompleteResult } from '../context/AppContext';
import {
  QuizFeedback,
  OptionContent,
  getOptionMarkState,
  optionBtnClass,
  pickerCardClass,
} from '../components/QuizFeedback';
import { LessonComplete } from '../components/LessonComplete';
import { XpPop } from '../components/XpPop';
import { getAircraftById, shuffle } from '../utils/data';
import { deepDiveLearnMore } from '../utils/learnMore';
import { getNodeById, XP_PER_CORRECT } from '../content/lessonPath';
import type { Aircraft, DeepDiveExerciseType } from '../types';

type Phase = 'setup' | 'exercise' | 'result';

interface Exercise {
  type: DeepDiveExerciseType;
  prompt: string;
  data: Record<string, unknown>;
}

function buildExercises(): Exercise[] {
  const ex: Exercise[] = [];

  const a320 = getAircraftById('a320')!;
  const b737 = getAircraftById('b737')!;
  ex.push({
    type: 'equivalent',
    prompt: "Editor calls the A320 the 'Airbus answer to the 737.' Build the correct comparison pair.",
    data: { left: a320, right: b737, options: shuffle([a320, b737, getAircraftById('b787')!, getAircraftById('a330')!]) },
  });

  const b777 = getAircraftById('b777')!;
  const a350 = getAircraftById('a350')!;
  ex.push({
    type: 'equivalent',
    prompt: 'Which pair are the Boeing/Airbus long-haul twinjet rivals?',
    data: { left: b777, right: a350, options: shuffle([b777, a350, getAircraftById('b747')!, getAircraftById('a380')!]) },
  });

  const g650 = getAircraftById('g650')!;
  const phenom = getAircraftById('phenom300')!;
  ex.push({
    type: 'mission',
    prompt: 'A CEO needs transcontinental nonstop range. A weekend leisure hop needs something smaller. Match each mission.',
    data: {
      missions: ['Transcontinental CEO trip', 'Weekend leisure hop'],
      options: shuffle([g650, phenom, getAircraftById('c172')!, getAircraftById('learjet75')!]),
      answers: [g650.id, phenom.id],
    },
  });

  const b747 = getAircraftById('b747')!;
  const a380 = getAircraftById('a380')!;
  ex.push({
    type: 'timeline',
    prompt: "Which entered service first  -  the 'Queen of the Skies' or the A380 Superjumbo?",
    data: {
      options: [
        { label: b747.nickname + ' (B747)', year: b747.introYear, id: b747.id },
        { label: a380.nickname + ' (A380)', year: a380.introYear, id: a380.id },
      ],
      correct: b747.introYear < a380.introYear ? b747.id : a380.id,
    },
  });

  const rangeSet = shuffle([
    getAircraftById('a380')!,
    getAircraftById('b737')!,
    getAircraftById('g650')!,
    getAircraftById('e190')!,
  ]);
  ex.push({
    type: 'range',
    prompt: 'Drag into correct range order (shortest → longest) for the story sidebar.',
    data: { aircraft: rangeSet, correctOrder: [...rangeSet].sort((a, b) => a.rangeNm - b.rangeNm).map((a) => a.id) },
  });

  const b787 = getAircraftById('b787')!;
  ex.push({
    type: 'equivalent',
    prompt: 'The Dreamliner competes directly with which Airbus widebody?',
    data: { left: b787, right: a350, options: shuffle([a350, getAircraftById('a330')!, getAircraftById('a320')!, getAircraftById('b767')!]) },
  });

  return ex;
}

const ALL_EXERCISES = buildExercises();
const TOTAL = 6;

export function DeepDivePage() {
  const [params] = useSearchParams();
  const nodeId = params.get('node');
  const node = nodeId ? getNodeById(nodeId) : undefined;

  const {
    startExercise,
    endExercise,
    loseLife,
    awardLessonComplete,
    canStartExercise,
    preferences,
  } = useApp();
  const [phase, setPhase] = useState<Phase>('setup');
  const [exIndex, setExIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; explanation: string; learnMore?: React.ReactNode; xp?: number } | null>(null);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [lostLifeThisQuestion, setLostLifeThisQuestion] = useState(false);
  const [lessonResult, setLessonResult] = useState<LessonCompleteResult | null>(null);
  const [xpPop, setXpPop] = useState(0);

  const exercise = ALL_EXERCISES[exIndex % ALL_EXERCISES.length];
  const totalRounds = node?.sessionSize ?? TOTAL;

  const resetQuestion = () => {
    setAnswered(false);
    setChosen(null);
    setFeedback(null);
    setSelected([]);
  };

  const failQuestion = (explanation: string, topic: string) => {
    if (!lostLifeThisQuestion) {
      loseLife();
      setLostLifeThisQuestion(true);
    }
    setAnswered(true);
    setFeedback({
      ok: false,
      explanation,
      learnMore: deepDiveLearnMore(topic, preferences.showLearnLinks),
    });
  };

  const passQuestion = (explanation: string) => {
    setAnswered(true);
    const firstTry = !lostLifeThisQuestion;
    if (firstTry) {
      setFirstTryScore((s) => s + 1);
      setXpPop((n) => n + 1);
    }
    setFeedback({ ok: true, explanation, xp: firstTry ? XP_PER_CORRECT : undefined });
  };

  const startSession = () => {
    setExIndex(0);
    setFirstTryScore(0);
    setLessonResult(null);
    setPhase('exercise');
    resetQuestion();
    setLostLifeThisQuestion(false);
    startExercise('deepdive');
  };

  const handleEquivalent = (id: string) => {
    if (answered) return;
    const newSel = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    setSelected(newSel);
    if (newSel.length === 2) {
      const ex = exercise.data as { left: Aircraft; right: Aircraft };
      const ok = newSel.includes(ex.left.id) && newSel.includes(ex.right.id);
      if (ok) {
        passQuestion(`${ex.left.family} ↔ ${ex.right.family} are the matched Boeing/Airbus rivals.`);
      } else {
        failQuestion(
          `The correct pair is ${ex.left.family} and ${ex.right.family}. Look for matching role, range class, and manufacturer rivalry.`,
          `${ex.left.family} and ${ex.right.family}`
        );
      }
    }
  };

  const handleMission = (aircraftId: string, missionIdx: number) => {
    if (answered) return;
    const data = exercise.data as { answers: string[]; missions: string[]; options: Aircraft[] };
    const newSel = [...selected];
    newSel[missionIdx] = aircraftId;
    setSelected(newSel);
    if (newSel.filter(Boolean).length === 2) {
      const allOk = data.answers.every((a, i) => newSel[i] === a);
      if (allOk) {
        passQuestion('Both missions matched to the right aircraft by range and role.');
      } else {
        const g650 = getAircraftById('g650')!;
        const phenom = getAircraftById('phenom300')!;
        failQuestion(
          `Transcontinental CEO trips need long range (${g650.rangeNm.toLocaleString()} nm)  -  ${g650.family}. Weekend hops suit lighter jets like the ${phenom.family} (${phenom.rangeNm.toLocaleString()} nm).`,
          'business jet range and mission fit'
        );
      }
    }
  };

  const handleTimeline = (id: string) => {
    if (answered) return;
    const data = exercise.data as { correct: string; options: { id: string; year: number; label: string }[] };
    setChosen(id);
    const ok = id === data.correct;
    if (ok) {
      const ac = getAircraftById(id)!;
      passQuestion(`${ac.family} entered service in ${ac.introYear}, before the other option.`);
    } else {
      const correctAc = getAircraftById(data.correct)!;
      const chosenAc = getAircraftById(id)!;
      failQuestion(
        `${correctAc.family} (${correctAc.introYear}) entered service before ${chosenAc.family} (${chosenAc.introYear}). Service entry dates anchor timeline questions.`,
        `${correctAc.family} vs ${chosenAc.family}`
      );
    }
  };

  const handleRangeMove = (from: number, to: number) => {
    if (answered) return;
    const data = exercise.data as { aircraft: Aircraft[] };
    const items = selected.length ? [...selected] : data.aircraft.map((a) => a.id);
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setSelected(items);
  };

  const submitRange = () => {
    if (answered) return;
    const data = exercise.data as { correctOrder: string[]; aircraft: Aircraft[] };
    const order = selected.length ? selected : data.aircraft.map((a) => a.id);
    const ok = order.every((id, i) => id === data.correctOrder[i]);
    if (ok) {
      passQuestion('Range order is correct  -  shortest to longest nautical miles.');
    } else {
      const sorted = data.correctOrder.map((id) => getAircraftById(id)!);
      failQuestion(
        `Correct order: ${sorted.map((a) => `${a.family} (${a.rangeNm.toLocaleString()} nm)`).join(' → ')}. Compare range figures in the Index spec grid.`,
        'aircraft range comparison'
      );
    }
  };

  const finishLesson = (finalFirstTry: number) => {
    const result = awardLessonComplete({
      nodeId,
      moduleId: 'deepdive',
      correct: finalFirstTry,
      total: totalRounds,
      baseXp: node?.xpReward ?? 20,
    });
    setLessonResult(result);
    setPhase('result');
    endExercise();
  };

  const nextExercise = () => {
    const next = exIndex + 1;
    const finalFirstTry = firstTryScore;
    if (next >= totalRounds) {
      finishLesson(finalFirstTry);
      return;
    }
    setExIndex(next);
    resetQuestion();
    setLostLifeThisQuestion(false);
  };

  const timelineData = exercise.type === 'timeline' ? (exercise.data as { correct: string; options: { id: string; label: string; year: number }[] }) : null;
  const equivData = exercise.type === 'equivalent' ? (exercise.data as { left: Aircraft; right: Aircraft; options: Aircraft[] }) : null;

  if (phase === 'setup') {
    return (
      <div>
        <div className="eyebrow">{node ? node.title : 'Module 03 · Deep Dive'}</div>
        <h2 className="serif" style={{ margin: '0 0 8px' }}>
          {node ? 'Ready?' : 'Compare and contextualize'}
        </h2>
        <p className="text-faint" style={{ maxWidth: 520, textWrap: 'pretty' }}>
          {node
            ? node.subtitle
            : 'Match rivals, rank range, place aircraft on a timeline, and fit types to missions  -  the context that makes identification stick.'}
        </p>
        <button type="button" className="btn btn-primary pressable" style={{ marginTop: 24 }} onClick={startSession} disabled={!canStartExercise}>
          Start deep dive ({totalRounds} tasks) · +{node?.xpReward ?? 20} XP
        </button>
      </div>
    );
  }

  if (phase === 'result' && lessonResult) {
    return (
      <LessonComplete
        result={lessonResult}
        score={firstTryScore}
        total={totalRounds}
        title={lessonResult.perfect ? 'Deep dive mastered!' : 'Session complete!'}
        onAgain={() => {
          setPhase('setup');
          setLessonResult(null);
        }}
      />
    );
  }

  const data = exercise.data;

  return (
    <div>
      <XpPop trigger={xpPop} amount={XP_PER_CORRECT} />
      <div className="quiz-progress" style={{ marginBottom: 12 }}>
        <div className="quiz-progress-fill" style={{ width: `${((exIndex + 1) / totalRounds) * 100}%` }} />
      </div>
      <div className="mono text-muted" style={{ fontSize: 11, marginBottom: 16 }}>
        {exIndex + 1} / {totalRounds} · DEEP DIVE
        {node ? ` · ${node.title.toUpperCase()}` : ''}
      </div>
      <h2 className="serif" style={{ fontSize: 26, margin: '0 0 16px', textWrap: 'balance' }}>{exercise.prompt}</h2>

      {exercise.type === 'equivalent' && equivData && (
        <div className="visual-picker">
          {equivData.options.map((ac) => {
            const isSelected = selected.includes(ac.id);
            const isWrongSelected = answered && feedback && !feedback.ok && isSelected;
            const mark = answered && feedback?.ok && isSelected
              ? 'correct'
              : isWrongSelected
                ? 'incorrect'
                : answered && feedback && !feedback.ok && (ac.id === equivData.left.id || ac.id === equivData.right.id)
                  ? 'correct'
                  : isSelected
                    ? 'default'
                    : 'default';
            return (
              <button
                key={ac.id}
                type="button"
                className={pickerCardClass(mark as 'default' | 'correct' | 'incorrect' | 'dimmed', isSelected && !answered ? 'selected-correct' : '')}
                onClick={() => handleEquivalent(ac.id)}
                disabled={answered}
              >
                <OptionContent
                  label={ac.family}
                  state={mark as 'default' | 'correct' | 'incorrect' | 'dimmed'}
                />
                <div className="timestamp">{ac.manufacturer}</div>
              </button>
            );
          })}
        </div>
      )}

      {exercise.type === 'mission' && (
        <div>
          {(data as { missions: string[] }).missions.map((mission, mi) => (
            <div key={mi} style={{ marginBottom: 16 }}>
              <strong>{mission}</strong>
              <div className="option-grid">
                {(data as { options: Aircraft[] }).options.map((ac) => (
                  <button
                    key={ac.id + mi}
                    type="button"
                    className={`option-btn ${selected[mi] === ac.id ? 'correct' : ''}`}
                    onClick={() => handleMission(ac.id, mi)}
                    disabled={answered}
                  >
                    {ac.family} ({ac.rangeNm.toLocaleString()} nm)
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {exercise.type === 'timeline' && timelineData && (
        <div className="option-grid">
          {timelineData.options.map((opt) => {
            const label = `${opt.label}  -  entered ${opt.year}`;
            const mark = getOptionMarkState(opt.id, chosen, timelineData.correct, answered);
            return (
              <button
                key={opt.id}
                type="button"
                className={optionBtnClass(mark)}
                onClick={() => handleTimeline(opt.id)}
                disabled={answered}
              >
                <OptionContent label={label} state={mark} />
              </button>
            );
          })}
        </div>
      )}

      {exercise.type === 'range' && (
        <div>
          <div className="drag-rank">
            {((selected.length ? selected : (data as { aircraft: Aircraft[] }).aircraft.map((a) => a.id)) as string[]).map((id, i) => {
              const ac = getAircraftById(id)!;
              return (
                <div key={id} className="drag-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{ac.family}</span>
                  <span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => i > 0 && handleRangeMove(i, i - 1)} disabled={answered}>↑</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => i < 3 && handleRangeMove(i, i + 1)} disabled={answered}>↓</button>
                    <span className="timestamp" style={{ marginLeft: 8 }}>{ac.rangeNm} nm</span>
                  </span>
                </div>
              );
            })}
          </div>
          {!answered && (
            <button type="button" className="btn btn-primary pressable" style={{ marginTop: 12 }} onClick={submitRange}>
              Submit order
            </button>
          )}
        </div>
      )}

      {feedback && (
        <QuizFeedback
          correct={feedback.ok}
          explanation={feedback.explanation}
          learnMore={feedback.learnMore}
          xpGained={feedback.xp}
          onNext={feedback.ok ? nextExercise : undefined}
          onRetry={!feedback.ok ? resetQuestion : undefined}
          nextLabel={exIndex + 1 >= totalRounds ? 'Claim XP →' : 'Next task →'}
        />
      )}
    </div>
  );
}
