import { NavLink, Route, Routes } from 'react-router-dom'
import Journal from './pages/Journal.jsx'
import Results from './pages/Results.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'

const links = [
  ['/', 'Journal'],
  ['/dashboard', 'Dashboard'],
  ['/profile', 'Profile'],
]

export default function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm px-4">
        <span className="text-xl font-bold flex-1">🌸 HERwin</span>
        <ul className="menu menu-horizontal gap-1">
          {links.map(([to, label]) => (
            <li key={to}>
              <NavLink to={to} end className={({ isActive }) => (isActive ? 'menu-active' : '')}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div role="alert" className="alert alert-info alert-soft rounded-none text-sm justify-center">
        Supportive, not a medical tool. If you are in danger, contact emergency services.
      </div>
      <main className="max-w-3xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Journal />} />
          <Route path="/results" element={<Results />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}
