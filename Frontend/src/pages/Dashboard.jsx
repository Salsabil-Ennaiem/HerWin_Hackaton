import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PlanTimeline from "../components/PlanTimeline";
import { getDashboard } from "../api";

const stressColor = (s) => (s < 40 ? "bg-success" : s < 70 ? "bg-warning" : "bg-error");

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDashboard().then(setData).catch(() => setError(true));
  }, []);

  if (error) return <p className="text-error">Could not load the dashboard.</p>;
  if (!data) return <span className="loading loading-spinner" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your dashboard</h1>

      {data.upcoming?.length > 0 && (
        <section className="alert">
          <div>
            <h2 className="font-semibold">Coming up</h2>
            <ul>
              {data.upcoming.map((e, i) => (
                <li key={i}>
                  {e.title} · {new Date(e.start).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Stress over time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.entries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="stress" stroke="#e11d48" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-1 mt-2" aria-label="Stress strip">
            {data.entries.map((e) => (
              <div
                key={e.date}
                title={`${e.date}: ${e.stress}`}
                className={`h-4 flex-1 rounded ${stressColor(e.stress)}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Today's plan</h2>
        <PlanTimeline plan={data.today_plan} />
      </section>
    </div>
  );
}