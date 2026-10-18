import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "../App";
import { LangProvider } from "../i18n";

const never = () => new Promise(() => {}); // requêtes qui ne se terminent pas

vi.mock("../api", () => ({
  postJournal: vi.fn(),
  getDashboard: vi.fn(() => new Promise(() => {})),
  getProfile: vi.fn(() => new Promise(() => {})),
  getEvents: vi.fn(() => new Promise(() => {})),
  updateProfile: vi.fn(),
  seedCalendar: vi.fn(),
  deleteMyData: vi.fn(),
}));

describe("App", () => {
  const renderApp = () => render(<LangProvider><BrowserRouter><App /></BrowserRouter></LangProvider>);

  it.each(["/", "/results", "/dashboard", "/profile"])(
    "la bannière 'not a medical tool' est visible sur %s",
    (path) => {
      window.history.pushState({}, "", path);
      renderApp();
      expect(screen.getByText(/not a medical tool/i)).toBeInTheDocument();
    }
  );

  it("affiche les 3 onglets de navigation", () => {
    window.history.pushState({}, "", "/");
    renderApp();
    for (const name of ["Journal", "Dashboard", "Profile"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("link", { name: "Chat" })).not.toBeInTheDocument();
  });

  it("redirige l'ancien lien de chat vers l'onglet Discussion du Journal", () => {
    window.history.pushState({}, "", "/chat");
    renderApp();
    expect(screen.getByRole("heading", { name: "Talk it through" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Journal" })).toHaveAttribute("href", "/");
  });
});