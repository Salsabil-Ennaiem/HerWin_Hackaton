const KEY = "herwin:lastResult";
const TOKEN_KEY = "herwin:token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function saveResult(result) {
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadResult() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearResult() {
  sessionStorage.removeItem(KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  clearResult();
  window.location.reload();
}