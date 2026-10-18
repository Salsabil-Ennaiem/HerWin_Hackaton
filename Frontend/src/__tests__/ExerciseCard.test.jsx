import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExerciseCard from "../components/ExerciseCard";
import { completeExercise } from "../api";
import { LangProvider } from "../i18n";

vi.mock("../api", () => ({
  completeExercise: vi.fn(),
  errMsg: (error) => error.message,
}));

beforeEach(() => {
  vi.resetAllMocks();
  completeExercise.mockResolvedValue({ id: 1 });
});

describe("ExerciseCard", () => {
  it("confirms completion after the API saves it", async () => {
    const user = userEvent.setup();
    render(<LangProvider><ExerciseCard exercise={{ id: 3, title: "Breathing", minutes: 2, steps: [] }} entryId={8} /></LangProvider>);

    await user.click(screen.getByRole("button", { name: "I did this" }));

    expect(await screen.findByRole("button", { name: "Logged ✓" })).toBeDisabled();
    expect(completeExercise).toHaveBeenCalledWith(3, 8);
  });

  it("shows an error and allows retry when the API fails", async () => {
    completeExercise.mockRejectedValueOnce(new Error("Could not save exercise"));
    const user = userEvent.setup();
    render(<LangProvider><ExerciseCard exercise={{ id: 3, title: "Breathing", minutes: 2, steps: [] }} entryId={8} /></LangProvider>);

    await user.click(screen.getByRole("button", { name: "I did this" }));

    expect(await screen.findByText("Could not save exercise")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I did this" })).toBeEnabled();
  });
});
