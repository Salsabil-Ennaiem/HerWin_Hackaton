import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { getToken, setToken } from "../store";

export default function AuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (authenticated) return children;

  return (
    <main className="min-h-screen grid place-items-center bg-base-200 p-4">
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body items-center">
          <h1 className="card-title">🌸 HERwin</h1>
          {clientId ? (
            <GoogleLogin
              onSuccess={(response) => {
                if (!response.credential) {
                  setError("Google did not return a sign-in credential.");
                  return;
                }
                try {
                  setToken(response.credential);
                  setAuthenticated(true);
                } catch {
                  setError("Could not save your sign-in. Check your browser storage settings.");
                }
              }}
              onError={() => setError("Google sign-in failed. Please try again.")}
            />
          ) : (
            <p role="alert">Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID.</p>
          )}
          {error && <p role="alert" className="text-error">{error}</p>}
        </div>
      </section>
    </main>
  );
}
