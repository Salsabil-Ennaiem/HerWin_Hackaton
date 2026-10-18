import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import { deleteMyData, getEvents, getProfile, seedCalendar, updateProfile } from "../api";
import { clearResult } from "../store";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const refresh = () => {
    getProfile().then(setProfile).catch(() => setError("Could not load profile."));
    getEvents().then(setEvents).catch(() => {});
  };
  useEffect(refresh, []);

  async function save(patch) {
    const next = { ...profile, ...patch };
    setProfile(next);
    try {
      await updateProfile({
        lang: next.lang,
        period_tracking: next.period_tracking,
        last_period: next.last_period || null,
        cycle_len: Number(next.cycle_len),
      });
      setMsg("Saved");
    } catch {
      setError("Could not save.");
    }
  }

  async function seed() {
    await seedCalendar();
    refresh();
    setMsg("Sample calendar loaded");
  }

  async function wipe() {
    if (!window.confirm("Delete ALL your data? This cannot be undone.")) return;
    try {
      await deleteMyData();
      clearResult();
      refresh();
      setMsg("All your data has been deleted.");
    } catch {
      setError("Could not delete data.");
    }
  }

  if (!profile) return <span className="loading loading-spinner" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Language</h2>
        <select
          className="select select-bordered"
          value={profile.lang}
          onChange={(e) => save({ lang: e.target.value })}
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Calendar</h2>
        <button className="btn btn-outline" onClick={seed}>Load sample calendar</button>
        <ul className="space-y-1">
          {events.map((e) => (
            <li key={e.id} className="flex gap-2 items-center">
              <span className="badge">{e.kind}</span>
              <span>{e.title}</span>
              <span className="opacity-60 text-sm">{new Date(e.start).toLocaleString()}</span>
            </li>
          ))}
          {events.length === 0 && <li className="opacity-60">No events yet.</li>}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cycle tracking (optional)</h2>
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={profile.period_tracking}
            onChange={(e) => save({ period_tracking: e.target.checked })}
          />
          <span>Use my cycle to adapt suggestions</span>
        </label>
        {profile.period_tracking && (
          <div className="flex flex-wrap gap-3">
            <label className="form-control">
              <span className="label-text">Last period start</span>
              <input
                type="date"
                className="input input-bordered"
                value={profile.last_period || ""}
                onChange={(e) => save({ last_period: e.target.value })}
              />
            </label>
            <label className="form-control">
              <span className="label-text">Cycle length (days)</span>
              <input
                type="number" min="20" max="45"
                className="input input-bordered w-28"
                value={profile.cycle_len}
                onChange={(e) => save({ cycle_len: e.target.value })}
              />
            </label>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-error">Privacy</h2>
        <button className="btn btn-error" onClick={wipe}>Delete my data</button>
      </section>

      {msg && (
        <div className="toast toast-bottom toast-center">
          <div className="alert alert-success" onAnimationEnd={() => setMsg("")}>
            <span>{msg}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => setMsg("")}>✕</button>
          </div>
        </div>
      )}
      <Toast message={error} onClose={() => setError("")} />
    </div>
  );
}