import builtinRoutines from '../data/routines.json';

function RoutineCard({ routine, onStart, onEdit }) {
  const totalSeconds =
    routine.exercises.length * routine.workDuration +
    Math.max(0, routine.exercises.length - 1) * routine.restDuration;
  const minutes = Math.ceil(totalSeconds / 60);

  return (
    <div className={`routine-card${routine.isCustom ? ' routine-card-custom' : ''}`} onClick={() => onStart(routine)}>
      <div className="routine-card-body">
        <div>
          <h2>{routine.name}</h2>
          <p className="meta">{routine.exercises.length} exercises · {minutes} min</p>
        </div>
        <button
          className="routine-edit-btn"
          onClick={e => { e.stopPropagation(); onEdit(routine); }}
          aria-label="Edit workout"
        >
          ✏️
        </button>
      </div>
    </div>
  );
}

export default function Home({ onStartRoutine, onOpenLibrary, onOpenComposer, onEditRoutine, savedRoutines = [] }) {
  return (
    <div className="home">
      <div>
        <h1>Fitness <span>Buddy</span></h1>
        <p>Simple workouts. No nonsense.</p>
      </div>

      {builtinRoutines.map(routine => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          onStart={onStartRoutine}
          onEdit={onEditRoutine}
        />
      ))}

      {savedRoutines.length > 0 && (
        <>
          <p className="home-section-label">My Workouts</p>
          {savedRoutines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onStart={onStartRoutine}
              onEdit={onEditRoutine}
            />
          ))}
        </>
      )}

      <button className="btn btn-accent" onClick={onOpenComposer}>✨ AI Workout Composer</button>
      <button className="btn btn-secondary" onClick={onOpenLibrary}>📖 Exercise Library</button>
    </div>
  );
}
