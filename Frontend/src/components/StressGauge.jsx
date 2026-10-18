export default function StressGauge({ score }) {
  const color = score >= 70 ? "text-error" : score >= 40 ? "text-warning" : "text-success";
  const label = score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`radial-progress ${color}`} style={{ "--value": score, "--size": "7rem" }} role="progressbar">
        <span className="text-2xl font-bold">{score}</span>
      </div>
      <span className="text-sm opacity-70">{label} stress</span>
    </div>
  );
}
