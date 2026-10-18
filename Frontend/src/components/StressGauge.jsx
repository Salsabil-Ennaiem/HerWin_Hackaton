import { useLang } from "../i18n.jsx";

export default function StressGauge({ score }) {
  const { t } = useLang();
  const color = score >= 70 ? "text-error" : score >= 40 ? "text-warning" : "text-success";
  const label = score >= 70 ? t("r_high") : score >= 40 ? t("r_mod") : t("r_low");
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-semibold">{t("d_score")}</span>
      <div className={`radial-progress ${color}`} style={{ "--value": score, "--size": "7rem" }}
        role="progressbar" aria-label={t("d_score")} aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <span className="text-2xl font-bold">{score}</span>
      </div>
      <span className="text-sm opacity-70">{label}</span>
      <p className="max-w-xs text-center text-xs opacity-60">{t("r_indicator_note")}</p>
    </div>
  );
}
