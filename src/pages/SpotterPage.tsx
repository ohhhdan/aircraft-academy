import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { LessonCompleteResult } from '../context/AppContext';
import { MiniAircraftDiagram } from '../components/AircraftDiagram';
import { LessonComplete } from '../components/LessonComplete';
import { XpPop } from '../components/XpPop';
import {
  QuizFeedback,
  OptionContent,
  getOptionMarkState,
  optionBtnClass,
  pickerCardClass,
} from '../components/QuizFeedback';
import { useMedia } from '../context/MediaContext';
import { aircraft, getAircraftById, pickRandom, shuffle } from '../utils/data';
import { getNodeById, XP_PER_CORRECT } from '../content/lessonPath';
import { spotterLearnMore } from '../utils/learnMore';
import type { Aircraft, CategoryGroup } from '../types';

type Mode = 'easy' | 'hard';
type Phase = 'setup' | 'exercise' | 'result';

interface AnswerFeedback {
  ok: boolean;
  explanation: string;
  learnMore?: React.ReactNode;
}

export function SpotterPage() {
  const [params] = useSearchParams();
  const nodeId = params.get('node');
  const node = nodeId ? getNodeById(nodeId) : undefined;
  const groupParam = (params.get('group') as CategoryGroup | null) ?? node?.categoryGroup;
  const modeParam = params.get('mode') as Mode | null;

  const practiceMistakes = params.get('practice') === 'mistakes';

  const {
    startExercise,
    endExercise,
    loseLife,
    markAircraftMastered,
    awardLessonComplete,
    recordMistake,
    clearMistake,
    canStartExercise,
    preferences,
    state,
  } = useApp();
  const { getSpotPhoto } = useMedia();
  const [mode, setMode] = useState<Mode>(modeParam ?? preferences.spotterMode);
  const [phase, setPhase] = useState<Phase>('setup');
  const [current, setCurrent] = useState<Aircraft | null>(null);
  const [options, setOptions] = useState<Aircraft[]>([]);
  const [variantOptions, setVariantOptions] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [lostLifeThisQuestion, setLostLifeThisQuestion] = useState(false);
  /** First-try corrects (Duolingo-style accuracy) */
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [round, setRound] = useState(0);
  const [lessonResult, setLessonResult] = useState<LessonCompleteResult | null>(null);
  const [xpPop, setXpPop] = useState(0);
  const totalRounds = practiceMistakes
    ? Math.min(10, Math.max(4, state.mistakeAircraftIds.length || 8))
    : node?.sessionSize ?? 10;

  const pool = useMemo(() => {
    if (practiceMistakes && state.mistakeAircraftIds.length > 0) {
      const weak = state.mistakeAircraftIds
        .map((id) => getAircraftById(id))
        .filter((a): a is Aircraft => Boolean(a));
      if (weak.length >= 1) {
        // Pad with same-category peers so we always have distractors
        const cat = weak[0].categoryGroup;
        const peers = aircraft.filter((a) => a.categoryGroup === cat && !weak.some((w) => w.id === a.id));
        return [...weak, ...peers].slice(0, Math.max(4, weak.length + 3));
      }
    }
    if (!groupParam) return aircraft;
    const filtered = aircraft.filter((a) => a.categoryGroup === groupParam);
    return filtered.length >= 4 ? filtered : aircraft;
  }, [groupParam, practiceMistakes, state.mistakeAircraftIds]);

  const correctAnswer = current
    ? mode === 'easy'
      ? current.family
      : current.variants[0]
    : '';

  const photo = useMemo(() => {
    if (!current) return null;
    const variant = mode === 'hard' ? current.variants[0] : undefined;
    return getSpotPhoto(current, variant);
  }, [current, mode, getSpotPhoto]);

  const location = useMemo(() => {
    if (!current?.spotterLocations) return 'Unknown location';
    return current.spotterLocations[Math.floor(Math.random() * current.spotterLocations.length)];
  }, [current]);

  const resetQuestion = useCallback(() => {
    setAnswered(false);
    setChosen(null);
    setFeedback(null);
  }, []);

  const startRound = useCallback(() => {
    // Prefer unresolved mistakes first when practicing weak spots
    let target: Aircraft;
    if (practiceMistakes && state.mistakeAircraftIds.length > 0) {
      const weakPool = state.mistakeAircraftIds
        .map((id) => getAircraftById(id))
        .filter((a): a is Aircraft => Boolean(a) && pool.some((p) => p.id === a.id));
      target = weakPool.length
        ? weakPool[Math.floor(Math.random() * weakPool.length)]
        : shuffle(pool)[0];
    } else {
      target = shuffle(pool)[0];
    }
    const distractors = pickRandom(
      pool.filter((a) => a.categoryGroup === target.categoryGroup && a.id !== target.id),
      3
    );
    if (distractors.length < 3) {
      const extra = pickRandom(
        pool.filter((a) => a.id !== target.id && !distractors.some((d) => d.id === a.id)),
        3 - distractors.length
      );
      distractors.push(...extra);
    }
    setCurrent(target);
    setOptions(shuffle([target, ...distractors.slice(0, 3)]));
    if (mode === 'hard') {
      const wrongVariants = pickRandom(
        pool.filter((a) => a.id !== target.id),
        3
      ).flatMap((a) => a.variants.slice(0, 1));
      setVariantOptions(shuffle([target.variants[0], ...wrongVariants.slice(0, 3)]));
    }
    setLostLifeThisQuestion(false);
    resetQuestion();
    setPhase('exercise');
    startExercise('spotter');
  }, [mode, startExercise, resetQuestion, pool, practiceMistakes, state.mistakeAircraftIds]);

  const handleAnswer = (answer: string) => {
    if (answered || !current) return;
    const ok = answer === correctAnswer;
    setChosen(answer);
    setAnswered(true);

    if (ok) {
      setFeedback({
        ok: true,
        explanation: `This is the ${correctAnswer}. ${current.nickname ? `"${current.nickname}" — ` : ''}Logged.`,
      });
      markAircraftMastered(current.id);
      if (!lostLifeThisQuestion) {
        setFirstTryScore((s) => s + 1);
        setXpPop((n) => n + 1);
        clearMistake(current.id);
      }
    } else {
      if (!lostLifeThisQuestion) {
        loseLife();
        setLostLifeThisQuestion(true);
        recordMistake(current.id);
      }
      setFeedback({
        ok: false,
        explanation: `The answer is ${correctAnswer}. You chose ${answer}. Compare fuselage shape, wing position, and engines.`,
        learnMore: spotterLearnMore(current, preferences.showLearnLinks),
      });
    }
  };

  const finishLesson = (finalFirstTry: number) => {
    const result = awardLessonComplete({
      nodeId,
      moduleId: 'spotter',
      correct: finalFirstTry,
      total: totalRounds,
    });
    setLessonResult(result);
    setPhase('result');
    endExercise();
  };

  const nextRound = () => {
    const newRound = round + 1;
    // Include this question's first-try outcome (score state is already updated)
    const finalFirstTry = firstTryScore;
    setRound(newRound);
    if (newRound >= totalRounds) {
      finishLesson(finalFirstTry);
      return;
    }
    startRound();
  };

  if (phase === 'setup') {
    return (
      <div>
        <div className="eyebrow">
          {practiceMistakes ? 'Practice · Weak Spots' : node ? node.title : 'Photo ID'}
        </div>
        <h2 className="serif" style={{ margin: '0 0 8px' }}>
          {practiceMistakes ? 'Clear your mistakes' : node ? 'Ready?' : 'Read the ramp'}
        </h2>
        <p className="text-faint" style={{ maxWidth: 520, textWrap: 'pretty' }}>
          {practiceMistakes
            ? `Review the ${state.mistakeAircraftIds.length} aircraft you missed recently — first-try correct clears them from the queue.`
            : node
              ? node.subtitle
              : 'Practice identification from spotter plates — family level first, then variants.'}
        </p>
        {!modeParam && (
          <div className="option-grid" style={{ maxWidth: 440, marginTop: 20 }}>
            <button
              type="button"
              className={`option-btn ${mode === 'easy' ? 'correct' : ''}`}
              onClick={() => setMode('easy')}
            >
              <strong>Family ID</strong>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>e.g. Boeing 737</div>
            </button>
            <button
              type="button"
              className={`option-btn ${mode === 'hard' ? 'correct' : ''}`}
              onClick={() => setMode('hard')}
            >
              <strong>Variant ID</strong>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>e.g. 737-800 vs MAX</div>
            </button>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary pressable"
          style={{ marginTop: 24 }}
          onClick={() => {
            setRound(0);
            setFirstTryScore(0);
            setLessonResult(null);
            startRound();
          }}
          disabled={!canStartExercise}
        >
          Start · {totalRounds} questions · +{node?.xpReward ?? 20} XP
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
        title={lessonResult.perfect ? 'Perfect flight!' : 'Lesson complete!'}
        onAgain={() => {
          setPhase('setup');
          setLessonResult(null);
        }}
      />
    );
  }

  if (!current || !photo) return null;

  return (
    <div>
      <XpPop trigger={xpPop} amount={XP_PER_CORRECT} />
      <div className="quiz-progress" style={{ marginBottom: 12 }}>
        <div className="quiz-progress-fill" style={{ width: `${((round + 1) / totalRounds) * 100}%` }} />
      </div>
      <div className="mono text-muted" style={{ fontSize: 11, marginBottom: 16 }}>
        {round + 1} / {totalRounds} · {mode === 'easy' ? 'FAMILY ID' : 'VARIANT ID'}
        {practiceMistakes ? ' · WEAK SPOTS' : node ? ` · ${node.title.toUpperCase()}` : ''}
      </div>

      <div className="wire-copy">
        <div className="timestamp">SPOTTER PHOTO</div>
        Submitted from <strong>{location}</strong>. Identify before logging.
      </div>

      <div className="photo-frame">
        {photo.url ? (
          <img src={photo.url} alt="Aircraft for identification" />
        ) : (
          <div className="text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            Photo pending
          </div>
        )}
        <div className="photo-credit">{photo.attribution}</div>
      </div>

      <h2 className="serif" style={{ fontSize: 28, margin: '20px 0 16px', textWrap: 'balance' }}>
        {mode === 'easy'
          ? 'Which aircraft family is shown?'
          : `Which variant of the ${current.family} is shown?`}
      </h2>

      {mode === 'easy' ? (
        <div className="visual-picker">
          {options.map((ac) => {
            const mark = getOptionMarkState(ac.family, chosen, correctAnswer, answered);
            return (
              <button
                key={ac.id}
                type="button"
                className={pickerCardClass(mark)}
                onClick={() => handleAnswer(ac.family)}
                disabled={answered}
              >
                <div className="mini-silhouette">
                  <MiniAircraftDiagram aircraft={ac} />
                </div>
                <OptionContent label={ac.family} state={mark} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="option-grid">
          {variantOptions.map((v) => {
            const mark = getOptionMarkState(v, chosen, correctAnswer, answered);
            return (
              <button
                key={v}
                type="button"
                className={optionBtnClass(mark)}
                onClick={() => handleAnswer(v)}
                disabled={answered}
              >
                <OptionContent label={v} state={mark} />
              </button>
            );
          })}
        </div>
      )}

      {feedback && (
        <QuizFeedback
          correct={feedback.ok}
          explanation={feedback.explanation}
          learnMore={feedback.learnMore}
          onNext={feedback.ok ? nextRound : undefined}
          onRetry={!feedback.ok ? resetQuestion : undefined}
          nextLabel={round + 1 >= totalRounds ? 'Claim XP →' : 'Next →'}
        />
      )}
    </div>
  );
}
