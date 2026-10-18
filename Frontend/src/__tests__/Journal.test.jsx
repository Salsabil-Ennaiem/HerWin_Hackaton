import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Journal from "../pages/Journal";
import { postJournal } from "../api";
import { loadResult } from "../store";
import { mockResult } from "../test/fixtures";

vi.mock("../api", () => ({ postJournal: vi.fn() }));

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

const renderJournal = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Journal />} />
        <Route path="/results" element={<div>RESULTS PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );

const analyseBtn = () => screen.getByRole("button", { name: /analyse/i });

beforeEach(() => {
  postJournal.mockReset();
  postJournal.mockResolvedValue(mockResult);
});

describe("Journal : onglet texte", () => {
  it("Analyse est désactivé tant que le texte est trop court", async () => {
    const user = userEvent.setup();
    renderJournal();
    expect(analyseBtn()).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/write freely/i), "ab");
    expect(analyseBtn()).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/write freely/i), "c");
    expect(analyseBtn()).toBeEnabled();
  });

  it("envoie mode=text et le texte, sauvegarde et navigue vers Results", async () => {
    const user = userEvent.setup();
    renderJournal();
    await user.type(screen.getByPlaceholderText(/write freely/i), "I am stressed");
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
    await user.type(screen.getByPlaceholderText(/write freely/i), "I am stressed");
    await user.click(analyseBtn());

    expect(await screen.findByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByText("RESULTS PAGE")).not.toBeInTheDocument();
  });
});

describe("Journal : onglet voix", () => {
  it("envoie le fichier audio avec mode=voice", async () => {
    const user = userEvent.setup();
    renderJournal();
    await user.click(screen.getByRole("tab", { name: "Voice" }));
    expect(analyseBtn()).toBeDisabled();

    await user.click(screen.getByText("fake-record"));
    expect(analyseBtn()).toBeEnabled();
    await user.click(analyseBtn());

    expect(await screen.findByText("RESULTS PAGE")).toBeInTheDocument();
    const fd = postJournal.mock.calls[0][0];
    expect(fd.get("mode")).toBe("voice");
    expect(fd.get("audio").name).toBe("note.webm");
  });

  it("erreur voix : bouton 'Type instead' qui bascule sur l'onglet texte", async () => {
    postJournal.mockRejectedValueOnce(new Error("whisper down"));
    const user = userEvent.setup();
    renderJournal();
    await user.click(screen.getByRole("tab", { name: "Voice" }));
    await user.click(screen.getByText("fake-record"));
    await user.click(analyseBtn());

    expect(await screen.findByText(/couldn't process your voice note/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Type instead" }));
    expect(screen.getByPlaceholderText(/write freely/i)).toBeInTheDocument();
  });
});

describe("Journal : onglet Quick questions", () => {
  it("exige les 5 réponses puis envoie un JSON valide", async () => {
    const user = userEvent.setup();
    renderJournal();
    await user.click(screen.getByRole("tab", { name: "Quick questions" }));

    const fours = screen.getAllByRole("radio", { name: "4" });
    expect(fours).toHaveLength(5);

    for (let i = 0; i < 4; i++) await user.click(fours[i]);
    expect(analyseBtn()).toBeDisabled();

    await user.click(fours[4]);
    expect(analyseBtn()).toBeEnabled();
    await user.click(analyseBtn());

    await screen.findByText("RESULTS PAGE");
    const fd = postJournal.mock.calls[0][0];
    expect(fd.get("mode")).toBe("qa");
    const answers = JSON.parse(fd.get("answers"));
    expect(answers).toHaveLength(5);
    expect(answers[0]).toEqual({
      question: "How well did you sleep last night?",
      answer: 4,
    });
  });
});