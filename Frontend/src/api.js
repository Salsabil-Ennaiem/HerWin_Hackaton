import axios from "axios";

export const api = axios.create({ baseURL: "/api", timeout: 60000 });

export const postJournal = (formData) => api.post("/journal", formData).then((r) => r.data);
export const getJournal = () => api.get("/journal").then((r) => r.data);
export const getDashboard = () => api.get("/dashboard").then((r) => r.data);

export const getProfile = () => api.get("/profile").then((r) => r.data);
export const updateProfile = (data) => api.put("/profile", data).then((r) => r.data);

export const seedCalendar = () => api.post("/calendar/seed").then((r) => r.data);
export const getEvents = () => api.get("/calendar/events").then((r) => r.data);
export const importIcs = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/calendar/import-ics", fd).then((r) => r.data);
};

export const demoSeed = () => api.post("/demo/seed").then((r) => r.data);
export const deleteMyData = () => api.delete("/me/data").then((r) => r.data);

export const patchBlock = (id, done) => api.patch(`/plan/blocks/${id}`, { done }).then((r) => r.data);
export const completeExercise = (id, entryId) =>
  api.post(`/exercises/${id}/complete`, null, { params: entryId ? { entry_id: entryId } : {} }).then((r) => r.data);

export const sendChat = (message, history, lang) =>
  api.post("/chat", { message, history, lang }).then((r) => r.data);

export const errMsg = (e) => e?.response?.data?.detail || e?.message || "Something went wrong";
