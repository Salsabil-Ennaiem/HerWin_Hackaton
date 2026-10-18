import { useEffect, useState } from "react";
import { deleteMyData, demoSeed, errMsg, getEvents, getProfile, importIcs, seedCalendar, updateProfile } from "../api";
import { clearResult } from "../store";
import Toast from "../components/Toast";

export default function Profile() {
  const [p, setP] = useState(null);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState(null);

  const load = () => {
    getProfile().then(setP).catch((e) => setToast({ message: errMsg(e) }));
    getEvents().then(setEvents).catch(() => {});
  };
  useEffect(load, []);

  const run = async (fn, ok) => {
    try { await fn(); setMsg(ok); load(); } catch (e) { setToast({ message: errMsg(e) }); }
  };

  const save = () => run(() => updateProfile({
    name: p.name, lang: p.lang, period_tracking: p.period_tracking,
    last_period: p.last_period || null, cycle_len: Number(p.cycle_len) || 28,
  }), "Profile saved");

  const wipe = () => {
    if (!confirm("Delete all your entries, plans and events? This cannot be undone.")) return;
    run(async () => { await deleteMyData(); clearResult(); }, "All your data was deleted");
  };

  if (!p) return <div className="text-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  const set = (k) => (e) => setP({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="space-y-4">
      {msg && <div className="alert alert-success alert-soft">{msg}</div>}

      <div className="card bg-base-100 shadow-sm"><div className="card-body">
        <h2 className="card-title">Profile</h2>
        <label className="form-control">Name
          <input className="input input-bordered w-full" value={p.name} onChange={set("name")} />
        </label>
        <label className="form-control">Language
          <select className="select select-bordered w-full" value={p.lang} onChange={set("lang")}>
            <option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option>
          </select>
        </label>
        <label className="label cursor-pointer justify-start gap-3">
          <input type="checkbox" className="toggle toggle-primary" checked={p.period_tracking} onChange={set("period_tracking")} />
          <span>Cycle-aware plans (optional, stays on this device's database)</span>
        </label>
        {p.period_tracking && (
          <div className="grid grid-cols-2 gap-3">
            <label>Last period start
              <input type="date" className="input input-bordered w-full" value={p.last_period || ""} onChange={set("last_period")} />
            </label>
            <label>Cycle length (days)
              <input type="number" min="20" max="45" className="input input-bordered w-full" value={p.cycle_len} onChange={set("cycle_len")} />
            </label>
          </div>
        )}
        <button className="btn btn-primary self-end" onClick={save}>Save</button>
      </div></div>

      <div className="card bg-base-100 shadow-sm"><div className="card-body">
        <h2 className="card-title">Calendar</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline" onClick={() => run(seedCalendar, "Sample calendar loaded")}>Load sample calendar</button>
          <label className="btn btn-outline">
            Import .ics
            <input type="file" accept=".ics" hidden onChange={(e) => e.target.files[0] && run(() => importIcs(e.target.files[0]), "Calendar imported")} />
          </label>
          <button className="btn btn-outline" onClick={() => run(demoSeed, "Demo data (14 days) loaded")}>Load demo history</button>
        </div>
        <ul className="text-sm space-y-1 mt-2">
          {events.slice(0, 8).map((e) => (
            <li key={e.id}><span className="badge badge-sm mr-2">{e.kind}</span>{e.title} · {new Date(e.start).toLocaleString()}</li>
          ))}
        </ul>
      </div></div>

      <div className="card bg-base-100 shadow-sm border border-error/40"><div className="card-body">
        <h2 className="card-title text-error">Privacy</h2>
        <p className="text-sm">Remove everything this app stored about you.</p>
        <button className="btn btn-error btn-outline self-start" onClick={wipe}>Delete my data</button>
      </div></div>

      <Toast {...(toast || {})} onClose={() => setToast(null)} />
    </div>
  );
}
