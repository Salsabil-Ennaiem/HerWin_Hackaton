import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Results from "../pages/Results";
import { saveResult } from "../store";
import { mockResult } from "../test/fixtures";

const renderResults = () =>
  render(
    <MemoryRouter>
      <Results />
    </MemoryRouter>
  );

describe("Results", () => {
  it("sans résultat : invite à écrire une entrée", () => {
    renderResults();
    expect(screen.getByText("No result yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /write a journal entry/i })).toBeInTheDocument();
  });

  it("affiche message, humeur, exercices, activités et plan", () => {
    saveResult(mockResult);
    renderResults();
    expect(screen.getByText("Take it one block at a time.")).toBeInTheDocument();
    expect(screen.getByText(/I am stressed about my exam/)).toBeInTheDocument();
    expect(screen.getByText("anxiety 62%")).toBeInTheDocument();
    expect(screen.getByText("#exam")).toBeInTheDocument();
    expect(screen.getByText(/Box breathing/)).toBeInTheDocument();
    expect(screen.getByText("Stretching, 10 min")).toBeInTheDocument();
    expect(screen.getByText("Focus block")).toBeInTheDocument();
  });

  it("sans distress_flag : pas de carte contacts", () => {
    saveResult(mockResult);
    renderResults();
    expect(screen.queryByText(/You are not alone/i)).not.toBeInTheDocument();
  });

  it("avec distress_flag : la carte contacts est AVANT le message", () => {
    saveResult({ ...mockResult, distress_flag: true });
    renderResults();
    const contacts = screen.getByText(/You are not alone/i);
    const message = screen.getByText("Your message");
    expect(
      contacts.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});