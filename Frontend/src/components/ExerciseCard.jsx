import { useState } from "react";
import { completeExercise } from "../api";
import { useLang } from "../i18n.jsx";

export default function ExerciseCard({ exercise, entryId }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  const mark = async () => {
    setDone(true);
    try { await completeExercise(exercise.id, entryId); } catch { setDone(false); }
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
        <button className="btn btn-sm btn-primary btn-outline mt-2 self-start no-print" disabled={done} onClick={mark}>
          {done ? t("e_logged") : t("e_done")}
        </button>
      </div>
    </div>
  );
}
