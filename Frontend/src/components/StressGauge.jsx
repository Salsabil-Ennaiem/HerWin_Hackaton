export default function StressGauge({ score }) {
  const color = score < 40 ? "text-success" : score < 70 ? "text-warning" : "text-error";
  const label = score < 40 ? "Low" : score < 70 ? "Moderate" : "High";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`radial-progress ${color}`}
        style={{ "--value": score, "--size": "7rem", "--thickness": "0.7rem" }}
        role="progressbar"
        aria-valuenow={score}
      >
        <span className="text-2xl font-bold">{score}</span>
      </div>
      <span className="text-sm opacity-70">Stress: {label}</span>
    </div>
  );
}