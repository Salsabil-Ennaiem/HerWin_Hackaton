import { render, screen } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import { getDashboard } from "../api";
import { mockResult } from "../test/fixtures";

vi.mock("../api", () => ({ getDashboard: vi.fn() }));

const data = {
  entries: [
    { date: "2026-10-16", stress: 30, dominant: "joy" },
    { date: "2026-10-17", stress: 55, dominant: "anxiety" },
    { date: "2026-10-18", stress: 85, dominant: "anxiety" },
  ],
  today_plan: mockResult.plan,
  upcoming: [{ title: "Midterm: Algorithms", kind: "exam", start: "2026-10-21T09:00:00" }],
};

describe("Dashboard", () => {
  it("affiche le spinner puis les données", async () => {
    getDashboard.mockResolvedValue(data);
    render(<Dashboard />);
    expect(await screen.findByText("Your dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Midterm: Algorithms/)).toBeInTheDocument();
    expect(screen.getByText("Focus block")).toBeInTheDocument();
  });

  it("la bande de stress a une case par entrée, colorée selon le score", async () => {
    getDashboard.mockResolvedValue(data);
    render(<Dashboard />);
    const strip = await screen.findByLabelText("Stress strip");
    expect(strip.children).toHaveLength(3);
    expect(strip.children[0]).toHaveClass("bg-success");
    expect(strip.children[1]).toHaveClass("bg-warning");
    expect(strip.children[2]).toHaveClass("bg-error");
  });

  it("erreur API : message d'erreur", async () => {
    getDashboard.mockRejectedValue(new Error("down"));
    render(<Dashboard />);
    expect(await screen.findByText(/Could not load the dashboard/i)).toBeInTheDocument();
  });
});