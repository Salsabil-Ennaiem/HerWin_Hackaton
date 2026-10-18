const KEY = "herwin:lastResult";

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