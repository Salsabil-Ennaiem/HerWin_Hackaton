import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard, errMsg } from "../api";
import { useLang } from "../i18n.jsx";
import PlanTimeline from "../components/PlanTimeline";

const tone = (s) => (s >= 70 ? "bg-error" : s >= 40 ? "bg-warning" : "bg-success");

export default function Dashboard() {
  const { t } = useLang();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { getDashboard().then(setD).catch((e) => setErr(errMsg(e))); }, []);

  if (err) return <div className="alert alert-error">{err}</div>;
  if (!d) return <div className="text-center py-10"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="space-y-4">
      {d.next_event && (
        <div className="stats shadow bg-base-100 w-full">
          <div className="stat">
            <div className="stat-title">{t("d_next")}: {d.next_event.title}</div>
            <div className="stat-value">{d.next_event.days_left}</div>
            <div className="stat-desc">{t("d_days")}</div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">{t("d_14")}</h2>
          {d.mood_trend.length === 0 ? (
            <p className="text-sm opacity-70">{t("d_empty")}</p>
          ) : (
            <div className="h-64" dir="ltr">
              <ResponsiveContainer>
                <LineChart data={d.mood_trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickFormatter={(x) => x.slice(5)} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="stress" stroke="#7c3aed" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex gap-1 mt-2">
            {d.stress_strip.map((s, i) => <div key={i} className={`flex-1 h-6 rounded ${tone(s)}`} title={`${s}`} />)}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">{t("d_today")}</h2>
          <PlanTimeline plan={d.today_plan} />
        </div>
      </div>
    </div>
  );
}
