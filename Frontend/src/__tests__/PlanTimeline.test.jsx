import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlanTimeline from "../components/PlanTimeline";
import { patchBlock } from "../api";
import { LangProvider } from "../i18n";

vi.mock("../api", () => ({
  patchBlock: vi.fn(),
  errMsg: (error) => error.message,
}));

beforeEach(() => {
  vi.resetAllMocks();
  patchBlock.mockResolvedValue({});
});

const plan = {
  explanation: "",
  blocks: [{
    id: 4,
    start: "2026-10-18T10:00:00",
    end: "2026-10-18T10:30:00",
    type: "study",
    title: "Study",
    done: false,
  }],
};

describe("PlanTimeline", () => {
  it("saves completed blocks to the API", async () => {
    const user = userEvent.setup();
    render(<LangProvider><PlanTimeline plan={plan} /></LangProvider>);
    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(patchBlock).toHaveBeenCalledWith(4, true);
  });

  it("reverts and reports a failed block update", async () => {
    patchBlock.mockRejectedValueOnce(new Error("Could not update plan"));
    const user = userEvent.setup();
    render(<LangProvider><PlanTimeline plan={plan} /></LangProvider>);
    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);

    expect(await screen.findByText("Could not update plan")).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });
});
