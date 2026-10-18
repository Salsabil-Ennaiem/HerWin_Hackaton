import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import AuthGate from './components/AuthGate.jsx'
import { LangProvider } from './i18n.jsx'
console.log("CLIENT_ID =", JSON.stringify(import.meta.env.VITE_GOOGLE_CLIENT_ID))
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <LangProvider>
        <AuthGate>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthGate>
      </LangProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
