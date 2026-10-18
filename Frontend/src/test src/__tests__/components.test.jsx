import { render, screen } from "@testing-library/react";
import ContactsCard from "../components/ContactsCard";
import ExerciseCard from "../components/ExerciseCard";
import PlanTimeline from "../components/PlanTimeline";
import StressGauge from "../components/StressGauge";
import { mockResult } from "../test/fixtures";

describe("StressGauge", () => {
  it.each([
    [20, "Stress: Low"],
    [55, "Stress: Moderate"],
    [85, "Stress: High"],
  ])("score %i affiche %s", (score, label) => {
    render(<StressGauge score={score} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(score));
  });
});

describe("ExerciseCard", () => {
  it("affiche titre, durée et étapes", () => {
    render(<ExerciseCard exercise={mockResult.exercises[0]} />);
    expect(screen.getByText(/Box breathing/)).toBeInTheDocument();
    expect(screen.getByText("3 min")).toBeInTheDocument();
    expect(screen.getByText("Inhale 4s")).toBeInTheDocument();
    expect(screen.getByText("Hold 4s")).toBeInTheDocument();
  });
});

describe("PlanTimeline", () => {
  it("sans plan : message de repli", () => {
    render(<PlanTimeline plan={null} />);
    expect(screen.getByText("No plan for today.")).toBeInTheDocument();
  });

  it("avec plan : explication, blocs et type", () => {
    render(<PlanTimeline plan={mockResult.plan} />);
    expect(screen.getByText(/High stress today/)).toBeInTheDocument();
    expect(screen.getByText("Focus block")).toBeInTheDocument();
    expect(screen.getByText("study")).toBeInTheDocument();
  });
});

describe("ContactsCard", () => {
  it("affiche un lien tel: cliquable", () => {
    render(<ContactsCard contacts={mockResult.contacts} />);
    expect(screen.getByText(/You are not alone/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "123" })).toHaveAttribute("href", "tel:123");
  });

  it("sans contacts : message de repli", () => {
    render(<ContactsCard contacts={[]} />);
    expect(screen.getByText(/trusted person/i)).toBeInTheDocument();
  });
});
