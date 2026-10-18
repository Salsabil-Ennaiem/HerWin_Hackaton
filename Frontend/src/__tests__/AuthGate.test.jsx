import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthGate from "../components/AuthGate";
import { getToken } from "../store";

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button onClick={() => onSuccess({ credential: "test-google-token" })}>
      Sign in with Google
    </button>
  ),
}));

describe("AuthGate", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires Google sign-in before rendering private app content", async () => {
    const user = userEvent.setup();
    render(<AuthGate><p>Private journal</p></AuthGate>);

    expect(screen.queryByText("Private journal")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(screen.getByText("Private journal")).toBeInTheDocument();
    expect(getToken()).toBe("test-google-token");
  });

  it("explains when the Google client ID is not configured", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    render(<AuthGate><p>Private journal</p></AuthGate>);

    expect(screen.getByRole("alert")).toHaveTextContent("VITE_GOOGLE_CLIENT_ID");
  });
});
