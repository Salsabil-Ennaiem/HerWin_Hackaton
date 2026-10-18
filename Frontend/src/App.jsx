import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import Journal from './pages/Journal.jsx'
import Results from './pages/Results.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import { useLang } from './i18n.jsx'
import { logout } from './store'

const links = [
  ['/', 'nav_journal'],
  ['/dashboard', 'nav_dashboard'],
  ['/profile', 'nav_profile'],
]

export default function App() {
  const { t, lang, setLang } = useLang()
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm px-4 no-print flex-wrap gap-2">
        <span className="text-xl font-bold flex-1">🌸 HERwin</span>
        <ul className="menu menu-horizontal gap-1">
          {links.map(([to, key]) => (
            <li key={to}>
              <NavLink to={to} end className={({ isActive }) => (isActive ? 'menu-active' : '')}>
                {t(key)}
              </NavLink>
            </li>
          ))}
        </ul>
        <select className="select select-sm select-bordered w-auto" value={lang}
          onChange={(e) => setLang(e.target.value)} aria-label="Language">
          <option value="en">EN</option><option value="fr">FR</option><option value="ar">AR</option>
        </select>
        <button className="btn btn-sm btn-ghost" aria-label={t('nav_logout')} onClick={logout}>
          ⎋
        </button>
      </div>
      <div role="alert" className="alert alert-info alert-soft rounded-none text-sm justify-center no-print">
        {t('banner')}
      </div>
      <main className="max-w-3xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Journal />} />
          <Route path="/results" element={<Results />} />
          <Route path="/chat" element={<Navigate to="/?tab=chat" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}
