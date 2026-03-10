import routines from '../data/routines.json';

export default function Home({ onStartRoutine }) {
  return (
    <div className="home">
      <div>
        <h1>Fitness <span>Buddy</span></h1>
        <p>Simple workouts. No nonsense.</p>
      </div>

      {routines.map((routine) => {
        const totalSeconds =
          routine.exercises.length * routine.workDuration +
          (routine.exercises.length - 1) * routine.restDuration;
        const minutes = Math.ceil(totalSeconds / 60);

        return (
          <div
            key={routine.id}
            className="routine-card"
            onClick={() => onStartRoutine(routine)}
          >
            <h2>{routine.name}</h2>
            <p className="meta">
              {routine.exercises.length} exercises · {minutes} min
            </p>
          </div>
        );
      })}
    </div>
  );
}
