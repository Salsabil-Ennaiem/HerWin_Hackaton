import { useEffect, useState } from "react";
import { deleteMyData, demoSeed, errMsg, getEvents, getProfile, importIcs, seedCalendar, updateProfile } from "../api";
import { clearResult } from "../store";
import { useLang } from "../i18n.jsx";
import Toast from "../components/Toast";

export default function Profile() {
  const { t, setLang } = useLang();
  const [p, setP] = useState(null);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState(null);

  const load = () => {
    getProfile().then((x) => { setP(x); if (x.lang) setLang(x.lang); }).catch((e) => setToast({ message: errMsg(e) }));
    getEvents().then(setEvents).catch(() => {});
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const run = async (fn, ok) => {
    try { await fn(); setMsg(ok); load(); } catch (e) { setToast({ message: errMsg(e) }); }
  };

  const save = () => run(() => updateProfile({
    name: p.name, lang: p.lang, period_tracking: p.period_tracking,
    last_period: p.last_period || null, cycle_len: Number(p.cycle_len) || 28,
  }), t("pr_saved"));

  const wipe = () => {
    if (!confirm(t("pr_confirm"))) return;
    run(async () => { await deleteMyData(); clearResult(); }, t("pr_deleted"));
  };

  if (!p) return <div className="text-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  const set = (k) => (e) => setP({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="space-y-4">
      {msg && <div className="alert alert-success alert-soft">{msg}</div>}

      <div className="card bg-base-100 shadow-sm"><div className="card-body">
        <h2 className="card-title">{t("pr_title")}</h2>
        <label className="form-control">{t("pr_name")}
          <input className="input input-bordered w-full" value={p.name} onChange={set("name")} />
        </label>
        <label className="form-control">{t("pr_lang")}
          <select className="select select-bordered w-full" value={p.lang}
            onChange={(e) => { set("lang")(e); setLang(e.target.value); }}>
            <option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option>
          </select>
        </label>
        <label className="label cursor-pointer justify-start gap-3">
          <input type="checkbox" className="toggle toggle-primary" checked={p.period_tracking} onChange={set("period_tracking")} />
          <span>{t("pr_cycle")}</span>
        </label>
        {p.period_tracking && (
          <div className="grid grid-cols-2 gap-3">
            <label>{t("pr_last")}
              <input type="date" className="input input-bordered w-full" value={p.last_period || ""} onChange={set("last_period")} />
            </label>
            <label>{t("pr_len")}
              <input type="number" min="20" max="45" className="input input-bordered w-full" value={p.cycle_len} onChange={set("cycle_len")} />
            </label>
          </div>
        )}
        <button className="btn btn-primary self-end" onClick={save}>{t("pr_save")}</button>
      </div></div>

      <div className="card bg-base-100 shadow-sm"><div className="card-body">
        <h2 className="card-title">{t("pr_cal")}</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline" onClick={() => run(seedCalendar, t("pr_cal_ok"))}>{t("pr_seed")}</button>
          <label className="btn btn-outline">
            {t("pr_ics")}
            <input type="file" accept=".ics" hidden onChange={(e) => e.target.files[0] && run(() => importIcs(e.target.files[0]), t("pr_ics_ok"))} />
          </label>
          <button className="btn btn-outline" onClick={() => run(demoSeed, t("pr_demo_ok"))}>{t("pr_demo")}</button>
        </div>
        <ul className="text-sm space-y-1 mt-2">
          {events.slice(0, 8).map((e) => (
            <li key={e.id}><span className="badge badge-sm me-2">{e.kind}</span>{e.title} · {new Date(e.start).toLocaleString()}</li>
          ))}
        </ul>
      </div></div>

      <div className="card bg-base-100 shadow-sm border border-error/40"><div className="card-body">
        <h2 className="card-title text-error">{t("pr_priv")}</h2>
        <p className="text-sm">{t("pr_priv_txt")}</p>
        <button className="btn btn-error btn-outline self-start" onClick={wipe}>{t("pr_delete")}</button>
      </div></div>

      <Toast {...(toast || {})} onClose={() => setToast(null)} />
    </div>
  );
}
