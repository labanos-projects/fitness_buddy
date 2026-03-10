export default function Complete({ routine, onHome }) {
  const totalSeconds =
    routine.exercises.length * routine.workDuration +
    (routine.exercises.length - 1) * routine.restDuration;
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return (
    <div className="complete">
      <h1>🎉</h1>
      <h1>Done!</h1>
      <p>
        You crushed <strong>{routine.name}</strong> in {minutes}:{secs.toString().padStart(2, '0')}
      </p>
      <button className="btn btn-primary" onClick={onHome}>
        ← Back Home
      </button>
    </div>
  );
}
