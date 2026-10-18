import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../pages/Profile";
import * as api from "../api";
import { saveResult, loadResult } from "../store";
import { mockResult } from "../test/fixtures";
import { LangProvider } from "../i18n";

vi.mock("../api", () => ({
  errMsg: (e) => e?.response?.data?.detail || e?.message || "Something went wrong",
  getProfile: vi.fn(),
  getEvents: vi.fn(),
  updateProfile: vi.fn(),
  seedCalendar: vi.fn(),
  deleteMyData: vi.fn(),
  importIcs: vi.fn(),
  demoSeed: vi.fn(),
}));

const profile = {
  id: 1, name: "", lang: "en", period_tracking: false, last_period: null, cycle_len: 28,
};

let savedProfile;

beforeEach(() => {
  vi.resetAllMocks();
  savedProfile = { ...profile };
  api.getProfile.mockImplementation(() => Promise.resolve({ ...savedProfile }));
  api.getEvents.mockResolvedValue([]);
  api.updateProfile.mockImplementation((data) => {
    savedProfile = { ...savedProfile, ...data };
    return Promise.resolve({ ...savedProfile });
  });
  api.seedCalendar.mockResolvedValue({ seeded: 3 });
  api.deleteMyData.mockResolvedValue({});
});

const ready = async () => {
  render(<LangProvider><Profile /></LangProvider>);
  await screen.findByRole("heading", { name: "Profile" });
};

describe("Profile", () => {
  it("charge et affiche le profil", async () => {
    await ready();
    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("en");
  });

  it("activer le suivi du cycle appelle updateProfile avec le bon corps", async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Last period start")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(api.updateProfile).toHaveBeenCalledWith({
        name: "", lang: "en", period_tracking: true, last_period: null, cycle_len: 28,
      })
    );
  });

  it("changer la langue appelle updateProfile", async () => {
    const user = userEvent.setup();
    await ready();
    await user.selectOptions(screen.getByRole("combobox"), "fr");
    await user.click(screen.getByRole("button", { name: /save|enregistrer/i }));
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
    expect(await screen.findByText(/All your data was deleted/i)).toBeInTheDocument();
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
    expect(await screen.findByText("404")).toBeInTheDocument();
  });
});