import { api, getDashboard } from "../api";
import { setToken } from "../store";

describe("authenticated API client", () => {
  it("sends the Google ID token as a bearer credential", async () => {
    let request;
    setToken("google-id-token");
    api.defaults.adapter = async (config) => {
      request = config;
      return {
        data: { mood_trend: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await getDashboard();

    expect(request.headers.Authorization).toBe("Bearer google-id-token");
  });
});
