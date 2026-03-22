import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import builtInExercises from '../data/exercises.json';
import useTimer from '../hooks/useTimer';
import useAudioCue from '../hooks/useAudioCue';
import useSpeech from '../hooks/useSpeech';
import useWakeLock from '../hooks/useWakeLock';
import ExerciseAnimation from './ExerciseAnimation';

export default function Workout({ routine, onComplete, onQuit, customExercises = [] }) {
  // Merge built-in exercises with any AI-generated custom ones
  const exerciseMap = useMemo(() => {
    const map = Object.fromEntries(builtInExercises.map(e => [e.id, e]));
    customExercises.forEach(e => { if (!map[e.id]) map[e.id] = e; });
    return map;
  }, [customExercises]);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | work | rest | done
  const { seconds, isRunning, start, pause, resume, stop } = useTimer();
  const { playCountdownTick, playPhaseTransition } = useAudioCue();
  const { speak } = useSpeech();
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const [paused, setPaused] = useState(false);
  const prevSecondsRef = useRef(seconds);
  const prevPhaseRef = useRef(null);

  const currentExerciseId = routine.exercises[exerciseIndex];
  const currentExercise = exerciseMap[currentExerciseId];
  const totalExercises = routine.exercises.length;

  // Release wake lock when the component unmounts (e.g. user quits mid-workout).
  // The initial enable is handled in App.jsx's handleStart, which runs inside
  // the RoutineCard onClick — a genuine user gesture required by iOS Safari.
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  const startWork = useCallback(() => {
    setPhase('work');
    start(routine.workDuration, {
      onComplete: () => {
        if (exerciseIndex < totalExercises - 1) {
          setPhase('rest');
          start(routine.restDuration, {
            onComplete: () => {
              setExerciseIndex((i) => i + 1);
            },
          });
        } else {
          setPhase('done');
          onComplete();
        }
      },
    });
  }, [exerciseIndex, totalExercises, routine, start, onComplete]);

  // When exerciseIndex changes (after rest), start the next work phase
  useEffect(() => {
    if (phase === 'rest' && !isRunning && exerciseIndex > 0) {
      startWork();
    }
  }, [exerciseIndex]);

  // Initial countdown / start
  useEffect(() => {
    if (phase === 'ready') {
      start(3, {
        onComplete: () => startWork(),
      });
    }
  }, []);

  useEffect(() => {
    const prevSeconds = prevSecondsRef.current;

    if (seconds > 0 && seconds <= 3 && prevSeconds > seconds) {
      playCountdownTick();
    }

    if (seconds === 0 && prevSeconds > 0) {
      playPhaseTransition();
    }

    prevSecondsRef.current = seconds;
  }, [seconds, playCountdownTick, playPhaseTransition]);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    if (phase === 'ready' && phase !== prevPhase && currentExercise?.name) {
      speak(`Get ready for ${currentExercise.name}`);
    }

    if (phase === 'work' && phase !== prevPhase && currentExercise?.name) {
      speak(`Start ${currentExercise.name}`);
    }

    if (
      phase === 'rest' &&
      phase !== prevPhase &&
      exerciseIndex < totalExercises - 1
    ) {
      const nextExerciseId = routine.exercises[exerciseIndex + 1];
      const nextExercise = exerciseMap[nextExerciseId];
      if (nextExercise?.name) {
        speak(`Next: ${nextExercise.name}`);
      }
    }

    if (phase === 'done' && phase !== prevPhase) {
      speak('Workout complete. Nice job.');
    }

    prevPhaseRef.current = phase;
  }, [phase, currentExercise?.name, exerciseIndex, totalExercises, routine, speak]);

  // Pause/resume — these run directly inside button onClick handlers,
  // so calling requestWakeLock on resume satisfies iOS's user-gesture requirement.
  const handlePause = () => {
    if (paused) {
      resume();
      setPaused(false);
      requestWakeLock(); // re-enable wake lock on resume (user gesture ✓)
    } else {
      pause();
      setPaused(true);
      releaseWakeLock(); // release while paused
    }
  };

  const handleQuit = () => {
    stop();
    releaseWakeLock();
    onQuit();
  };

  const progress = ((exerciseIndex) / totalExercises) * 100;

  if (phase === 'ready') {
    return (
      <div className="workout">
        <p className="workout-phase">Get Ready</p>
        <p className="exercise-name">{currentExercise?.name || currentExerciseId}</p>
        <ExerciseAnimation exerciseId={currentExerciseId} />
        <p className={`timer-display${seconds <= 1 ? ' warning' : ''}`}>{seconds}</p>
        <p className="exercise-description">{currentExercise?.description}</p>
      </div>
    );
  }

  return (
    <div className="workout">
      <p className={`workout-phase ${phase}`}>
        {phase === 'work' ? '💪 Work' : '😮‍💨 Rest'}
      </p>

      <p className="exercise-name">
        {phase === 'rest' && exerciseIndex < totalExercises - 1
          ? `Next: ${exerciseMap[routine.exercises[exerciseIndex + 1]]?.name || routine.exercises[exerciseIndex + 1]}`
          : (currentExercise?.name || currentExerciseId)}
      </p>

      <ExerciseAnimation
        exerciseId={
          phase === 'rest' && exerciseIndex < totalExercises - 1
            ? routine.exercises[exerciseIndex + 1]
            : currentExerciseId
        }
      />

      <p className={`timer-display${seconds <= 3 ? ' warning' : ''}`}>
        {seconds}
      </p>

      {phase === 'work' && (
        <p className="exercise-description">{currentExercise?.description}</p>
      )}

      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="exercise-counter">
        {exerciseIndex + 1} / {totalExercises}
      </p>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handlePause}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button className="btn btn-secondary" onClick={handleQuit}>
          ↩ Quit
        </button>
      </div>
    </div>
  );
}
