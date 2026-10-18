import axios from "axios";

// Le proxy Vite redirige /api vers http://localhost:8000
export const api = axios.create({ baseURL: "/api", timeout: 60000 });

export const postJournal = (formData) =>
  api.post("/journal", formData).then((r) => r.data);

export const getDashboard = () => api.get("/dashboard").then((r) => r.data);

export const getProfile = () => api.get("/profile").then((r) => r.data);
export const updateProfile = (data) => api.put("/profile", data).then((r) => r.data);

export const seedCalendar = () => api.post("/calendar/seed").then((r) => r.data);
export const getEvents = () => api.get("/calendar/events").then((r) => r.data);

export const deleteMyData = () => api.delete("/me/data").then((r) => r.data);