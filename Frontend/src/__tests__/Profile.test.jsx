import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../pages/Profile";
import * as api from "../api";
import { saveResult, loadResult } from "../store";
import { mockResult } from "../test/fixtures";

vi.mock("../api", () => ({
  getProfile: vi.fn(),
  getEvents: vi.fn(),
  updateProfile: vi.fn(),
  seedCalendar: vi.fn(),
  deleteMyData: vi.fn(),
}));

const profile = {
  id: 1, lang: "en", period_tracking: false, last_period: null, cycle_len: 28,
};

beforeEach(() => {
  vi.resetAllMocks();
  api.getProfile.mockResolvedValue(profile);
  api.getEvents.mockResolvedValue([]);
  api.updateProfile.mockResolvedValue(profile);
  api.seedCalendar.mockResolvedValue({ seeded: 3 });
  api.deleteMyData.mockResolvedValue({});
});

const ready = async () => {
  render(<Profile />);
  await screen.findByRole("heading", { name: "Profile" });
};

describe("Profile", () => {
  it("charge et affiche le profil", async () => {
    await ready();
    expect(screen.getByText("No events yet.")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("en");
  });

  it("activer le suivi du cycle appelle updateProfile avec le bon corps", async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole("checkbox"));
    await waitFor(() =>
      expect(api.updateProfile).toHaveBeenCalledWith({
        lang: "en", period_tracking: true, last_period: null, cycle_len: 28,
      })
    );
    expect(screen.getByText("Last period start")).toBeInTheDocument();
  });

  it("changer la langue appelle updateProfile", async () => {
    const user = userEvent.setup();
    await ready();
    await user.selectOptions(screen.getByRole("combobox"), "fr");
    await waitFor(() =>
      expect(api.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ lang: "fr" }))
    );
  });

  it("'Load sample calendar' appelle seedCalendar", async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole("button", { name: /load sample calendar/i }));
    await waitFor(() => expect(api.seedCalendar).toHaveBeenCalledTimes(1));
  });

  it("Delete my data : confirmé → supprime l'API et le résultat local", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    saveResult(mockResult);
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole("button", { name: /delete my data/i }));

    await waitFor(() => expect(api.deleteMyData).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/All your data has been deleted/i)).toBeInTheDocument();
    expect(loadResult()).toBeNull();
  });

  it("Delete my data : annulé → rien n'est supprimé", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    saveResult(mockResult);
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole("button", { name: /delete my data/i }));

    expect(api.deleteMyData).not.toHaveBeenCalled();
    expect(loadResult()).toEqual(mockResult);
  });

  it("échec de suppression : message d'erreur", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.deleteMyData.mockRejectedValue(new Error("404"));
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole("button", { name: /delete my data/i }));
    expect(await screen.findByText(/Could not delete data/i)).toBeInTheDocument();
  });
});