import { useState, useEffect, useCallback } from 'react';
import exercises from '../data/exercises.json';
import useTimer from '../hooks/useTimer';
import ExerciseAnimation from './ExerciseAnimation';

const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]));

export default function Workout({ routine, onComplete, onQuit }) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | work | rest | done
  const { seconds, isRunning, start, pause, resume, stop } = useTimer();
  const [paused, setPaused] = useState(false);

  const currentExerciseId = routine.exercises[exerciseIndex];
  const currentExercise = exerciseMap[currentExerciseId];
  const totalExercises = routine.exercises.length;

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

  const handlePause = () => {
    if (paused) {
      resume();
      setPaused(false);
    } else {
      pause();
      setPaused(true);
    }
  };

  const handleQuit = () => {
    stop();
    onQuit();
  };

  const progress = ((exerciseIndex) / totalExercises) * 100;

  if (phase === 'ready') {
    return (
      <div className="workout">
        <p className="workout-phase">Get Ready</p>
        <p className="exercise-name">{currentExercise?.name}</p>
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
          ? `Next: ${exerciseMap[routine.exercises[exerciseIndex + 1]]?.name}`
          : currentExercise?.name}
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
          ✕ Quit
        </button>
      </div>
    </div>
  );
}
