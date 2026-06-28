import { useCallback, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MiniAircraftDiagram } from '../components/AircraftDiagram';
import {
  QuizFeedback,
  OptionContent,
  getOptionMarkState,
  optionBtnClass,
  pickerCardClass,
} from '../components/QuizFeedback';
import { useMedia } from '../context/MediaContext';
import { aircraft, pickRandom, shuffle } from '../utils/data';
import { spotterLearnMore } from '../utils/learnMore';
import type { Aircraft } from '../types';

type Mode = 'easy' | 'hard';
type Phase = 'setup' | 'exercise' | 'result';

interface AnswerFeedback {
  ok: boolean;
  explanation: string;
  learnMore?: React.ReactNode;
}

export function SpotterPage() {
  const {
    startExercise,
    endExercise,
    loseLife,
    markAircraftMastered,
    recordModuleProgress,
    canStartExercise,
    state,
    preferences,
  } = useApp();
  const { getSpotPhoto } = useMedia();
  const [mode, setMode] = useState<Mode>(preferences.spotterMode);
  const [phase, setPhase] = useState<Phase>('setup');
  const [current, setCurrent] = useState<Aircraft | null>(null);
  const [options, setOptions] = useState<Aircraft[]>([]);
  const [variantOptions, setVariantOptions] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [lostLifeThisQuestion, setLostLifeThisQuestion] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const totalRounds = 10;

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
    const pool = shuffle(aircraft);
    const target = pool[0];
    const distractors = pickRandom(
      aircraft.filter((a) => a.categoryGroup === target.categoryGroup && a.id !== target.id),
      3
    );
    if (distractors.length < 3) {
      const extra = pickRandom(
        aircraft.filter((a) => a.id !== target.id && !distractors.includes(a)),
        3 - distractors.length
      );
      distractors.push(...extra);
    }
    setCurrent(target);
    setOptions(shuffle([target, ...distractors.slice(0, 3)]));
    if (mode === 'hard') {
      const wrongVariants = pickRandom(
        aircraft.filter((a) => a.id !== target.id),
        3
      ).flatMap((a) => a.variants.slice(0, 1));
      setVariantOptions(shuffle([target.variants[0], ...wrongVariants.slice(0, 3)]));
    }
    setLostLifeThisQuestion(false);
    resetQuestion();
    setPhase('exercise');
    startExercise('spotter');
  }, [mode, startExercise, resetQuestion]);

  const handleAnswer = (answer: string) => {
    if (answered || !current) return;
    const ok = answer === correctAnswer;
    setChosen(answer);
    setAnswered(true);

    if (ok) {
      setFeedback({
        ok: true,
        explanation: `This is the ${correctAnswer}. ${current.nickname ? `"${current.nickname}" — ` : ''}Logged to your spotter journal.`,
      });
      markAircraftMastered(current.id);
      setScore((s) => s + 1);
    } else {
      if (!lostLifeThisQuestion) {
        loseLife();
        setLostLifeThisQuestion(true);
      }
      setFeedback({
        ok: false,
        explanation: `The answer is ${correctAnswer}. You chose ${answer}. Compare the photo to the diagram — ${mode === 'easy' ? 'look at overall fuselage shape, wing position, and engine count' : 'variant details like winglets, door count, or engine type often give it away'}.`,
        learnMore: spotterLearnMore(current, preferences.showLearnLinks),
      });
    }
  };

  const nextRound = () => {
    const newRound = round + 1;
    setRound(newRound);
    if (newRound >= totalRounds) {
      const newCompleted = Math.min(
        state.moduleProgress.spotter.completed + score,
        state.moduleProgress.spotter.total
      );
      recordModuleProgress('spotter', newCompleted, state.moduleProgress.spotter.total);
      setPhase('result');
      endExercise();
      return;
    }
    startRound();
  };

  if (phase === 'setup') {
    return (
      <div>
        <div className="eyebrow">Module 02 · Identify by Photo</div>
        <h2 className="serif" style={{ margin: '0 0 8px' }}>Read the ramp</h2>
        <p className="text-faint" style={{ maxWidth: 520, textWrap: 'pretty' }}>
          Practice identification from real spotter photographs — family level first, then variant level when you&apos;re ready.
        </p>
        <div className="option-grid" style={{ maxWidth: 440, marginTop: 20 }}>
          <button
            type="button"
            className={`option-btn ${mode === 'easy' ? 'correct' : ''}`}
            onClick={() => setMode('easy')}
          >
            <strong>Family ID</strong>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>e.g. Boeing 737, Airbus A320</div>
          </button>
          <button
            type="button"
            className={`option-btn ${mode === 'hard' ? 'correct' : ''}`}
            onClick={() => setMode('hard')}
          >
            <strong>Variant ID</strong>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>e.g. 737-800 vs MAX 8</div>
          </button>
        </div>
        <button
          type="button"
          className="btn btn-primary pressable"
          style={{ marginTop: 24 }}
          onClick={() => { setRound(0); setScore(0); startRound(); }}
          disabled={!canStartExercise}
        >
          Start spotting ({totalRounds} photos)
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div>
        <div className="eyebrow">Photo ID</div>
        <h2 className="serif">Session complete</h2>
        <p className="serif" style={{ fontSize: 28, fontWeight: 600, color: 'var(--green)', margin: '8px 0 16px' }}>
          {Math.round((score / totalRounds) * 100)}% this round
        </p>
        <p className="text-faint">You identified {score} of {totalRounds} photos correctly.</p>
        <button type="button" className="btn btn-primary pressable" style={{ marginTop: 20 }} onClick={() => setPhase('setup')}>
          New session
        </button>
      </div>
    );
  }

  if (!current || !photo) return null;

  return (
    <div>
      <div className="quiz-progress" style={{ marginBottom: 12 }}>
        <div className="quiz-progress-fill" style={{ width: `${((round + 1) / totalRounds) * 100}%` }} />
      </div>
      <div className="mono text-muted" style={{ fontSize: 11, marginBottom: 16 }}>
        {round + 1} / {totalRounds} · {mode === 'easy' ? 'FAMILY ID' : 'VARIANT ID'}
      </div>

      <div className="wire-copy">
        <div className="timestamp">SPOTTER PHOTO</div>
        Submitted from <strong>{location}</strong>. Identify the aircraft before logging it.
      </div>

      <div className="photo-frame">
        {photo.url ? (
          <img src={photo.url} alt="Aircraft for identification" />
        ) : (
          <div className="text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            Photo pending — see PHOTO_NEEDS.md
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
          nextLabel={round + 1 >= totalRounds ? 'See results →' : 'Next →'}
        />
      )}
    </div>
  );
}
