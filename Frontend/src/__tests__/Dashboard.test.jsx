import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import { getDashboard } from "../api";
import { mockResult } from "../test/fixtures";
import { LangProvider } from "../i18n";

vi.mock("../api", () => ({
  getDashboard: vi.fn(),
  errMsg: (e) => e?.response?.data?.detail || e?.message || "Something went wrong",
}));

const data = {
  mood_trend: [
    { date: "2026-10-16", stress: 30, dominant: "joy" },
    { date: "2026-10-17", stress: 55, dominant: "anxiety" },
    { date: "2026-10-18", stress: 85, dominant: "anxiety" },
  ],
  stress_strip: [30, 55, 85],
  today_plan: mockResult.plan,
  next_event: { title: "Midterm: Algorithms", days_left: 3 },
};

describe("Dashboard", () => {
  it("affiche le spinner puis les données", async () => {
    getDashboard.mockResolvedValue(data);
    render(<MemoryRouter><LangProvider><Dashboard /></LangProvider></MemoryRouter>);
    expect(await screen.findByText("Stress, last 14 days")).toBeInTheDocument();
    expect(screen.getByText("Midterm: Algorithms")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText(/30 up since previous check-in/)).toBeInTheDocument();
    expect(screen.getByText("Focus block")).toBeInTheDocument();
  });

  it("la bande de stress a une case par entrée, colorée selon le score", async () => {
    getDashboard.mockResolvedValue(data);
    render(<MemoryRouter><LangProvider><Dashboard /></LangProvider></MemoryRouter>);
    await screen.findByText("Focus block");
    const cases = document.querySelectorAll(".bg-success, .bg-warning, .bg-error");
    expect(cases).toHaveLength(3);
    expect(cases[0]).toHaveClass("bg-success");
    expect(cases[1]).toHaveClass("bg-warning");
    expect(cases[2]).toHaveClass("bg-error");
  });

  it("erreur API : message d'erreur", async () => {
    getDashboard.mockRejectedValue(new Error("down"));
    render(<MemoryRouter><LangProvider><Dashboard /></LangProvider></MemoryRouter>);
    expect(await screen.findByText("down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("invite à créer une entrée quand il n'y a aucun historique", async () => {
    getDashboard.mockResolvedValue({ ...data, mood_trend: [], stress_strip: [] });
    render(<MemoryRouter><LangProvider><Dashboard /></LangProvider></MemoryRouter>);
    expect(await screen.findByRole("link", { name: "Write your first check-in" })).toHaveAttribute("href", "/");
  });
});