import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { LessonCompleteResult } from '../context/AppContext';
import {
  QuizFeedback,
  OptionContent,
  getOptionMarkState,
  optionBtnClass,
} from '../components/QuizFeedback';
import { LessonComplete } from '../components/LessonComplete';
import { XpPop } from '../components/XpPop';
import { airports, getAirportsByTier, pickRandom, shuffle } from '../utils/data';
import { codesLearnMore } from '../utils/learnMore';
import { getNodeById, XP_PER_CORRECT } from '../content/lessonPath';
import type { Airport, AirportTier } from '../types';

type DrillMode = 'code-to-name' | 'name-to-code' | 'odd-one-out';
type Phase = 'setup' | 'exercise' | 'result';

const TIER_LABELS: Record<AirportTier, { name: string; tag: string }> = {
  easy: { name: 'Ground Level', tag: 'Major international hubs' },
  medium: { name: 'Cruising', tag: 'Mid-size cities & gateways' },
  hard: { name: 'High Altitude', tag: 'Regional fields' },
};

interface AnswerFeedback {
  ok: boolean;
  explanation: string;
  learnMore?: React.ReactNode;
  xp?: number;
}

function getCorrectAnswer(mode: DrillMode, current: Airport, tier: AirportTier, itinerary: Airport[]): string {
  if (mode === 'code-to-name') return `${current.city}, ${current.country}`;
  if (mode === 'name-to-code') return current.iata;
  return itinerary.find((a) => a.tier !== tier)!.iata;
}

export function CodesPage() {
  const [params] = useSearchParams();
  const nodeId = params.get('node');
  const node = nodeId ? getNodeById(nodeId) : undefined;
  const tierParam = params.get('tier') as AirportTier | null;

  const {
    startExercise,
    endExercise,
    loseLife,
    markAirportMastered,
    awardLessonComplete,
    canStartExercise,
    preferences,
  } = useApp();
  const [tier, setTier] = useState<AirportTier>(tierParam ?? preferences.codesTier);
  const [mode, setMode] = useState<DrillMode>('code-to-name');
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [lostLifeThisQuestion, setLostLifeThisQuestion] = useState(false);
  const [current, setCurrent] = useState<Airport | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<Airport[]>([]);
  const [lessonResult, setLessonResult] = useState<LessonCompleteResult | null>(null);
  const [xpPop, setXpPop] = useState(0);
  const totalRounds = node?.sessionSize ?? 15;

  const correctAnswer = current ? getCorrectAnswer(mode, current, tier, itinerary) : '';

  const resetQuestion = useCallback(() => {
    setAnswered(false);
    setChosen(null);
    setFeedback(null);
  }, []);

  const startRound = useCallback(() => {
    const pool = getAirportsByTier(tier);
    const target = pool[Math.floor(Math.random() * pool.length)];
    setCurrent(target);

    if (mode === 'code-to-name') {
      const distractors = pickRandom(
        pool.filter((a) => a.iata !== target.iata),
        3
      ).map((a) => `${a.city}, ${a.country}`);
      setOptions(shuffle([`${target.city}, ${target.country}`, ...distractors]));
    } else if (mode === 'name-to-code') {
      const distractors = pickRandom(
        pool.filter((a) => a.iata !== target.iata),
        3
      ).map((a) => a.iata);
      setOptions(shuffle([target.iata, ...distractors]));
    } else {
      const sameRegion = pickRandom(
        pool.filter((a) => a.iata !== target.iata && a.country === target.country),
        2
      );
      const outsider = pickRandom(
        airports.filter((a) => a.tier !== tier && a.country !== target.country),
        1
      )[0];
      const itin = shuffle([...sameRegion, outsider, target]);
      setItinerary(itin);
      setOptions(itin.map((a) => a.iata));
    }
    setLostLifeThisQuestion(false);
    resetQuestion();
    startExercise('codes');
  }, [tier, mode, startExercise, resetQuestion]);

  const handleAnswer = (answer: string) => {
    if (answered || !current) return;
    const correct = getCorrectAnswer(mode, current, tier, itinerary);
    const ok = answer === correct;
    setChosen(answer);
    setAnswered(true);

    if (ok) {
      if (mode !== 'odd-one-out') markAirportMastered(current.iata);
      const firstTry = !lostLifeThisQuestion;
      if (firstTry) {
        setFirstTryScore((s) => s + 1);
        setXpPop((n) => n + 1);
      }
      setFeedback({
        ok: true,
        xp: firstTry ? XP_PER_CORRECT : undefined,
        explanation:
          mode === 'code-to-name'
            ? `${current.iata} serves ${current.name} in ${current.city}, ${current.country}.`
            : mode === 'name-to-code'
              ? `${current.city} is coded ${current.iata} — ${current.name}.`
              : `${answer} (${airports.find((a) => a.iata === answer)?.city}) is from a different altitude tier than the others.`,
      });
    } else {
      if (!lostLifeThisQuestion) {
        loseLife();
        setLostLifeThisQuestion(true);
      }
      const learnTarget = mode === 'odd-one-out' ? airports.find((a) => a.iata === correct)! : current;
      setFeedback({
        ok: false,
        explanation:
          mode === 'code-to-name'
            ? `${current.iata} is ${current.city}, ${current.country} — not ${answer}. Major hub codes become familiar with repetition.`
            : mode === 'name-to-code'
              ? `The code for ${current.city} is ${correct}, not ${answer}. Three-letter codes are always uppercase IATA standards.`
              : `The outlier is ${correct}. The other codes belong to ${TIER_LABELS[tier].name} airports — ${correct} is from a different tier.`,
        learnMore: codesLearnMore(learnTarget, preferences.showLearnLinks),
      });
    }
  };

  const finishLesson = (finalFirstTry: number) => {
    const result = awardLessonComplete({
      nodeId,
      moduleId: 'codes',
      correct: finalFirstTry,
      total: totalRounds,
      baseXp: node?.xpReward ?? 15,
    });
    setLessonResult(result);
    setPhase('result');
    endExercise();
  };

  const nextRound = () => {
    const newRound = round + 1;
    const finalFirstTry = firstTryScore;
    setRound(newRound);
    if (newRound >= totalRounds) {
      finishLesson(finalFirstTry);
      return;
    }
    startRound();
  };

  const itineraryDisplay = useMemo(() => {
    if (mode !== 'odd-one-out' || itinerary.length === 0) return '';
    return itinerary.map((a) => a.iata).join(' → ');
  }, [mode, itinerary]);

  if (phase === 'setup') {
    return (
      <div>
        <div className="eyebrow-teal">{node ? node.title : 'Module 04 · Airport Codes'}</div>
        <h2 className="serif" style={{ margin: '0 0 8px', textWrap: 'balance' }}>
          {node ? 'Ready?' : 'Three letters. One city.'}
        </h2>
        <p className="text-faint" style={{ maxWidth: 520, textWrap: 'pretty' }}>
          {node
            ? node.subtitle
            : 'Learn IATA airport codes through a tiered departure board — study baggage-tag flashcards, then quiz each level to build accuracy.'}
        </p>

        {!node && (
          <div className="card" style={{ marginTop: 24, padding: 16, borderTop: '1.5px dashed var(--dashed-plate)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--teal)', marginBottom: 8 }}>Sample tag</div>
            <div className="board-display" style={{ fontSize: '1.5rem', padding: 16, marginBottom: 0 }}>
              LHR
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 10, textAlign: 'center' }}>
              London · Heathrow
            </div>
          </div>
        )}

        {!tierParam && (
          <>
            <h3 className="serif" style={{ fontSize: '1.1rem', marginTop: 28 }}>Choose altitude</h3>
            <div className="option-grid" style={{ maxWidth: 520 }}>
              {(['easy', 'medium', 'hard'] as AirportTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`option-btn ${tier === t ? 'correct' : ''}`}
                  onClick={() => setTier(t)}
                >
                  <span className={`tier-badge tier-${t}`}>{TIER_LABELS[t].name}</span>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>{TIER_LABELS[t].tag}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <h3 className="serif" style={{ fontSize: '1.1rem', marginTop: 24 }}>Drill mode</h3>
        <div className="option-grid" style={{ maxWidth: 520 }}>
          <button type="button" className={`option-btn ${mode === 'code-to-name' ? 'correct' : ''}`} onClick={() => setMode('code-to-name')}>
            Code → City
          </button>
          <button type="button" className={`option-btn ${mode === 'name-to-code' ? 'correct' : ''}`} onClick={() => setMode('name-to-code')}>
            City → Code
          </button>
          <button type="button" className={`option-btn ${mode === 'odd-one-out' ? 'correct' : ''}`} onClick={() => setMode('odd-one-out')}>
            Odd one out
          </button>
        </div>

        <button
          type="button"
          className="btn btn-teal pressable"
          style={{ marginTop: 24 }}
          onClick={() => {
            setRound(0);
            setFirstTryScore(0);
            setLessonResult(null);
            setPhase('exercise');
            startRound();
          }}
          disabled={!canStartExercise}
        >
          Board now → ({totalRounds} questions) · +{node?.xpReward ?? 15} XP
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
        title={lessonResult.perfect ? 'Boarding complete!' : 'Codes logged!'}
        onAgain={() => {
          setPhase('setup');
          setLessonResult(null);
        }}
      />
    );
  }

  if (!current) return null;

  return (
    <div>
      <XpPop trigger={xpPop} amount={XP_PER_CORRECT} />
      <div className="quiz-progress" style={{ marginBottom: 12 }}>
        <div className="quiz-progress-fill" style={{ width: `${((round + 1) / totalRounds) * 100}%`, background: 'var(--teal)' }} />
      </div>
      <div className="mono text-muted" style={{ fontSize: 11, marginBottom: 16 }}>
        {round + 1} / {totalRounds} · {TIER_LABELS[tier].name.toUpperCase()} LEVEL
        {node ? ` · ${node.title.toUpperCase()}` : ''}
      </div>

      {mode === 'code-to-name' && (
        <>
          <div className="mono eyebrow-teal" style={{ marginBottom: 8 }}>Departure board</div>
          <div className="board-display">{current.iata}</div>
          <h2 className="serif" style={{ fontSize: 28, margin: '0 0 16px', textWrap: 'balance' }}>
            Which city does this code serve?
          </h2>
        </>
      )}

      {mode === 'name-to-code' && (
        <>
          <div className="mono eyebrow-teal" style={{ marginBottom: 8 }}>Baggage tag</div>
          <div className="wire-copy">
            <strong>{current.city}, {current.country}</strong>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{current.name}</div>
          </div>
          <h2 className="serif" style={{ fontSize: 28, margin: '0 0 16px', textWrap: 'balance' }}>
            What&apos;s the IATA code?
          </h2>
        </>
      )}

      {mode === 'odd-one-out' && (
        <>
          <div className="itinerary">
            <div className="timestamp">ROUTE FRAGMENT</div>
            <div style={{ marginTop: 8 }}>{itineraryDisplay}</div>
          </div>
          <h2 className="serif" style={{ fontSize: 28, margin: '0 0 16px', textWrap: 'balance' }}>
            Which code doesn&apos;t belong at {TIER_LABELS[tier].name}?
          </h2>
        </>
      )}

      <div className="option-grid">
        {options.map((opt) => {
          const mark = getOptionMarkState(opt, chosen, correctAnswer, answered);
          return (
            <button
              key={opt}
              type="button"
              className={optionBtnClass(mark)}
              onClick={() => handleAnswer(opt)}
              disabled={answered}
            >
              <OptionContent label={opt} state={mark} />
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
          onNext={feedback.ok ? nextRound : undefined}
          onRetry={!feedback.ok ? resetQuestion : undefined}
          nextLabel={round + 1 >= totalRounds ? 'Claim XP →' : 'Next →'}
          buttonVariant="teal"
        />
      )}
    </div>
  );
}
