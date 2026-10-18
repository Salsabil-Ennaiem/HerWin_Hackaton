import { Link } from "react-router-dom";
import { useState } from "react";
import { loadResult } from "../store";
import { downloadIcs, errMsg } from "../api";
import { useLang } from "../i18n.jsx";
import StressGauge from "../components/StressGauge";
import ExerciseCard from "../components/ExerciseCard";
import PlanTimeline from "../components/PlanTimeline";
import ContactsCard from "../components/ContactsCard";
import Toast from "../components/Toast";

export default function Results() {
  const { t } = useLang();
  const [downloadError, setDownloadError] = useState("");
  const r = loadResult();
  if (!r) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">{t("r_none")}</p>
        <Link to="/" className="btn btn-primary">{t("r_write")}</Link>
      </div>
    );
  }
  const emotions = Object.entries(r.mood.emotions || {}).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0.05);

  return (
    <div className="space-y-4">
      {r.distress_flag && <ContactsCard contacts={r.contacts} />}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <StressGauge score={r.stress_score} />
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {emotions.map(([k, v]) => (
              <span key={k} className={`badge ${k === r.mood.dominant ? "badge-primary" : "badge-outline"}`}>
                {k} {Math.round(v * 100)}%
              </span>
            ))}
          </div>
          {r.mood.themes?.length > 0 && (
            <div className="text-xs opacity-60">{t("r_themes")}: {r.mood.themes.join(", ")}</div>
          )}
          <p className="mt-3 text-lg">{r.support_message}</p>
          <Link to="/?tab=chat" className="btn btn-sm btn-ghost no-print">{t("r_chat")}</Link>
        </div>
      </div>

      {r.transcript && (
        <details className="collapse collapse-arrow bg-base-100">
          <summary className="collapse-title text-sm">{t("r_said")}</summary>
          <div className="collapse-content text-sm opacity-80">{r.transcript}</div>
        </details>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">{t("r_try")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {r.exercises.map((e) => <ExerciseCard key={e.id} exercise={e} entryId={r.entry_id} />)}
        </div>
      </section>

      {(r.activities?.indoor?.length > 0 || r.activities?.outdoor?.length > 0) && (
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body p-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div><h3 className="font-semibold">{t("r_in")}</h3><ul className="list-disc list-inside">{r.activities.indoor.map((a) => <li key={a}>{a}</li>)}</ul></div>
            <div><h3 className="font-semibold">{t("r_out")}</h3><ul className="list-disc list-inside">{r.activities.outdoor.map((a) => <li key={a}>{a}</li>)}</ul></div>
          </div>
        </section>
      )}

      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">{t("r_plan")}</h2>
          <PlanTimeline plan={r.plan} />
          <div className="flex flex-wrap gap-2 mt-2 no-print">
            <button className="btn btn-sm btn-outline" onClick={() => window.print()}>{t("r_pdf")}</button>
            <button className="btn btn-sm btn-outline" onClick={() => downloadIcs().catch((e) => setDownloadError(errMsg(e)))}>
              {t("r_ics")}
            </button>
          </div>
        </div>
      </section>
      <Toast message={downloadError} onClose={() => setDownloadError("")} />
    </div>
  );
}
