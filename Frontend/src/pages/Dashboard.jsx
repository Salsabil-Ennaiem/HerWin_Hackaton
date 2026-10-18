import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard, errMsg } from "../api";
import { useLang } from "../i18n.jsx";
import PlanTimeline from "../components/PlanTimeline";

const tone = (score) => (score >= 70 ? "bg-error" : score >= 40 ? "bg-warning" : "bg-success");
const locale = { en: "en-GB", fr: "fr-FR", ar: "ar" };

export default function Dashboard() {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const fetchDashboard = useCallback(() => {
    getDashboard().then(setData).catch((error) => setErr(errMsg(error)));
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const retry = () => {
    setErr("");
    setData(null);
    fetchDashboard();
  };

  if (err) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <p role="alert" className="text-error">{err}</p>
          <button className="btn btn-outline btn-sm" onClick={retry}>{t("d_retry")}</button>
        </div>
      </div>
    );
  }
  if (!data) return <div className="text-center py-10"><span className="loading loading-spinner loading-lg" /></div>;

  const trend = [...data.mood_trend].sort((a, b) => a.date.localeCompare(b.date));
  const latest = trend.at(-1);
  const previous = trend.at(-2);
  const change = latest && previous ? latest.stress - previous.stress : null;
  const formatDate = (date) => new Intl.DateTimeFormat(locale[lang] || locale.en, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));

  return (
    <div className="space-y-5">
      {data.next_event && (
        <section className="card overflow-hidden bg-primary text-primary-content shadow-sm">
          <div className="card-body flex-row items-center justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-sm opacity-80">{t("d_next")}</p>
              <h2 className="truncate text-lg font-semibold">{data.next_event.title}</h2>
            </div>
            <div className="shrink-0 text-center">
              <div className="text-4xl font-bold leading-none">{data.next_event.days_left}</div>
              <div className="mt-1 text-xs opacity-80">
                {data.next_event.days_left === 1 ? t("d_day") : t("d_days")}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="card bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="card-title">{t("d_14")}</h2>
              <p className="mt-1 text-sm opacity-65">{t("d_chart_hint")}</p>
            </div>
            {latest && (
              <div className="rounded-2xl bg-base-200 px-4 py-2 text-end">
                <p className="text-xs opacity-70">{t("d_latest")} · {formatDate(latest.date)}</p>
                <p className="text-xl font-bold">{latest.stress}<span className="text-sm font-normal opacity-60">/100</span></p>
                {change !== null && (
                  <p className={`text-xs ${change > 0 ? "text-error" : change < 0 ? "text-success" : "opacity-70"}`}>
                    {change > 0 ? `+${change} ${t("d_change_up")}` :
                      change < 0 ? `${Math.abs(change)} ${t("d_change_down")}` : t("d_no_change")}
                  </p>
                )}
              </div>
            )}
          </div>

          {trend.length === 0 ? (
            <div className="rounded-2xl bg-base-200/70 p-6 text-center">
              <p className="text-sm opacity-70">{t("d_empty")}</p>
              <Link to="/" className="btn btn-primary btn-sm mt-4">{t("d_empty_action")}</Link>
            </div>
          ) : (
            <>
              <div className="h-64 min-w-0" dir="ltr">
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                    accessibilityLayer aria-label={t("d_14")}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={24}
                      tick={{ fontSize: 12, fill: "currentColor" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
                      tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      labelFormatter={(date) => formatDate(date)}
                      formatter={(value) => [`${value}/100`, t("d_score")]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                    />
                    <Line type="monotone" dataKey="stress" name={t("d_score")} stroke="#7c3aed"
                      strokeWidth={3} dot={{ r: 4, fill: "#7c3aed" }} activeDot={{ r: 6 }}
                      isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-1.5" aria-label={t("d_14")}>
                {trend.slice(-7).map((point) => (
                  <div key={point.date} className={`h-2 flex-1 rounded-full ${tone(point.stress)}`}
                    title={`${formatDate(point.date)} · ${point.stress}/100`}
                    aria-label={`${formatDate(point.date)}: ${point.stress}/100`} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title">{t("d_today")}</h2>
          <PlanTimeline plan={data.today_plan} />
        </div>
      </section>
    </div>
  );
}
