import { useState } from "react";
import { completeExercise, errMsg } from "../api";
import { useLang } from "../i18n.jsx";
import Toast from "./Toast";

export default function ExerciseCard({ exercise, entryId }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mark = async () => {
    setBusy(true);
    try {
      await completeExercise(exercise.id, entryId);
      setDone(true);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{exercise.title}</h3>
          <span className="badge badge-ghost">{exercise.minutes} {t("e_min")}</span>
        </div>
        <ol className="list-decimal list-inside text-sm space-y-0.5">
          {exercise.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <button className="btn btn-sm btn-primary btn-outline mt-2 self-start no-print" disabled={done || busy} onClick={mark}>
          {busy ? <span className="loading loading-spinner loading-xs" /> : done ? t("e_logged") : t("e_done")}
        </button>
      </div>
      <Toast message={error} onClose={() => setError("")} />
    </div>
  );
}
