import exercises from '../data/exercises.json';
import ExerciseAnimation from './ExerciseAnimation';

const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

export default function Library({ onBack }) {
  return (
    <div className="library">
      <div className="library-header">
        <button className="btn btn-secondary btn-small" onClick={onBack}>← Back</button>
        <h1>Exercise Library</h1>
        <p>{sorted.length} exercises</p>
      </div>

      <div className="library-list">
        {sorted.map((exercise) => (
          <div key={exercise.id} className="library-card">
            <div className="library-card-illustration">
              <ExerciseAnimation exerciseId={exercise.id} />
            </div>
            <div className="library-card-info">
              <h3>{exercise.name}</h3>
              <span className="library-tag">{exercise.category}</span>
              <p>{exercise.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
