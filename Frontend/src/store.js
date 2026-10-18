const KEY = "herwin:lastResult";
const GUEST_ID_KEY = "herwin:guestId";

export function getGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
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