import { lazy, Suspense } from "react";
import { Routes, Route, NavLink } from "react-router-dom";

const Journal = lazy(() => import("./pages/Journal"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Results = lazy(() => import("./pages/Results"));

const navItems = [
  { label: "Journal", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Profile", path: "/profile" },
];

export function AppRouter() {
  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100 px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-warning">Not a medical tool</p>
        </div>
      </header>

      <nav className="bg-base-100 shadow-sm">
        <div className="mx-auto flex max-w-4xl gap-2 p-3">
          {navItems.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `btn flex-1 ${isActive ? "btn-primary" : "btn-ghost"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-4xl p-4">
        <Suspense fallback={<p role="status">Loading page...</p>}>
          <Routes>
            <Route path="/" element={<Journal />} />
            <Route path="/results" element={<Results />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100 px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-warning">Not a medical tool</p>
        </div>
      </header>

      <nav className="bg-base-100 shadow-sm">
        <div className="mx-auto flex max-w-4xl gap-2 p-3">
          {navItems.map(({ label, path: href }) => (
            <a key={href} href={href} className={`btn flex-1 ${path === href ? "btn-primary" : "btn-ghost"}`}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-4xl p-4">
        {path === "/results" && <div>Results page</div>}
        {path === "/dashboard" && <div>Dashboard page</div>}
        {path === "/profile" && <div>Profile page</div>}
        {path !== "/results" && path !== "/dashboard" && path !== "/profile" && <div>Journal page</div>}
      </main>
    </div>
  );
}