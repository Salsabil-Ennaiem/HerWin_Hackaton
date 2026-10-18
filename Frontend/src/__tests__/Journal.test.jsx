import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Journal from "../pages/Journal";
import { postJournal, sendChat } from "../api";
import { clearResult, loadResult } from "../store";
import { mockResult } from "../test/fixtures";
import { LangProvider } from "../i18n";

vi.mock("../api", () => ({
  postJournal: vi.fn(),
  sendChat: vi.fn(),
  errMsg: (e) => e?.response?.data?.detail || e?.message || "Something went wrong",
}));

// Le vrai enregistreur a besoin d'un micro : on le remplace par un faux bouton
vi.mock("../components/VoiceRecorder", async () => {
  const React = await import("react");
  return {
    default: ({ onRecorded }) =>
      React.createElement(
        "button",
        { onClick: () => onRecorded(new Blob(["x"], { type: "audio/webm" })) },
        "fake-record"
      ),
  };
});

describe("Journal : onglet discussion", () => {
  it("ouvre le chat depuis l'URL et envoie les messages au service", async () => {
    const user = userEvent.setup();
    render(
      <LangProvider>
        <MemoryRouter initialEntries={["/?tab=chat"]}>
          <Routes>
            <Route path="/" element={<Journal />} />
          </Routes>
        </MemoryRouter>
      </LangProvider>
    );

    expect(screen.getByRole("heading", { name: "Talk it through" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /analyse/i })).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/type a message/i), "I feel sad");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("I hear you.")).toBeInTheDocument();
    expect(sendChat).toHaveBeenCalledWith("I feel sad", [], "en");
  });
});

const renderJournal = () =>
  render(
    <LangProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Journal />} />
          <Route path="/results" element={<div>RESULTS PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </LangProvider>
  );

const analyseBtn = () => screen.getByRole("button", { name: /analyse/i });

beforeEach(() => {
  clearResult();
  postJournal.mockReset();
  postJournal.mockResolvedValue(mockResult);
  sendChat.mockReset();
  sendChat.mockResolvedValue({ reply: "I hear you.", distress: false, contacts: [] });
});

describe("Journal : onglet texte", () => {
  it("Analyse est désactivé tant que le texte est vide", async () => {
    const user = userEvent.setup();
    renderJournal();
    expect(analyseBtn()).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/write anything/i), "I feel stressed");
    expect(analyseBtn()).toBeEnabled();
  });

  it("envoie mode=text et le texte, sauvegarde et navigue vers Results", async () => {
    const user = userEvent.setup();
    renderJournal();
    await user.type(screen.getByPlaceholderText(/write anything/i), "I am stressed");
    await user.click(analyseBtn());

    expect(await screen.findByText("RESULTS PAGE")).toBeInTheDocument();
    const fd = postJournal.mock.calls[0][0];
    expect(fd.get("mode")).toBe("text");
    expect(fd.get("text")).toBe("I am stressed");
    expect(loadResult()).toEqual(mockResult);
  });

  it("erreur API : toast d'erreur et pas de navigation", async () => {
    postJournal.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    renderJournal();
    await user.type(screen.getByPlaceholderText(/write anything/i), "I am stressed");
    await user.click(analyseBtn());

    expect(await screen.findByText("boom")).toBeInTheDocument();
    expect(screen.queryByText("RESULTS PAGE")).not.toBeInTheDocument();
  });
});

describe("Journal : onglet voix", () => {
  it("envoie le fichier audio avec mode=voice", async () => {
    const user = userEvent.setup();
    renderJournal();
    await user.click(screen.getByRole("tab", { name: /Speak/ }));
    expect(analyseBtn()).toBeDisabled();

    await user.click(screen.getByText("fake-record"));
    expect(analyseBtn()).toBeEnabled();
    await user.click(analyseBtn());

    expect(await screen.findByText("RESULTS PAGE")).toBeInTheDocument();
    const fd = postJournal.mock.calls[0][0];
    expect(fd.get("mode")).toBe("voice");
    expect(fd.get("audio").name).toBe("audio.webm");
  });

  it("affiche l'erreur serveur voix et permet de basculer sur le texte", async () => {
    postJournal.mockRejectedValueOnce({
      response: { data: { detail: "Speech service failed (500)" } },
    });
    const user = userEvent.setup();
    renderJournal();
    await user.click(screen.getByRole("tab", { name: /Speak/ }));
    await user.click(screen.getByText("fake-record"));
    await user.click(analyseBtn());

    expect(await screen.findByText("Speech service failed (500)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Type instead" }));
    expect(screen.getByPlaceholderText(/write anything/i)).toBeInTheDocument();
  });
});

describe("Journal : onglet questions", () => {
  it("exige une réponse à chaque question puis envoie le JSON attendu par l'API", async () => {
    const user = userEvent.setup();
    renderJournal();
    await user.click(screen.getByRole("tab", { name: /Help me answer/ }));

    await user.click(screen.getByRole("button", { name: "High" }));
    await user.click(screen.getByRole("button", { name: "Quite a bit" }));
    await user.click(screen.getByRole("button", { name: "Well" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(analyseBtn()).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: "No" })[1]);
    expect(analyseBtn()).toBeEnabled();
    await user.click(analyseBtn());

    await screen.findByText("RESULTS PAGE");
    const fd = postJournal.mock.calls[0][0];
    expect(fd.get("mode")).toBe("qa");
    const answers = JSON.parse(fd.get("answers"));
    expect(answers).toHaveLength(5);
    expect(answers[0]).toEqual({ q: "How is your energy right now?", a: "High" });
  });
});