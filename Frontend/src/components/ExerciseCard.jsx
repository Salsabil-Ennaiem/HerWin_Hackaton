export default function ExerciseCard({ exercise }) {
  return (
    <div className="collapse collapse-arrow bg-base-200">
      <input type="checkbox" />
      <div className="collapse-title font-medium">
        {exercise.title}
        <span className="badge badge-ghost ml-2">{exercise.minutes} min</span>
      </div>
      <div className="collapse-content">
        <ol className="list-decimal ml-5 space-y-1">
          {exercise.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>
    </div>
  );
}