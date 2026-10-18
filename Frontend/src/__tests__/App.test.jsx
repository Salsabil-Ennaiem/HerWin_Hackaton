import { render, screen } from "@testing-library/react";
import App from "../App";

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
  it.each(["/", "/results", "/dashboard", "/profile"])(
    "la bannière 'not a medical tool' est visible sur %s",
    (path) => {
      window.history.pushState({}, "", path);
      render(<App />);
      expect(screen.getByText(/not a medical tool/i)).toBeInTheDocument();
    }
  );

  it("affiche les 3 onglets de navigation", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    for (const name of ["Journal", "Dashboard", "Profile"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });
});