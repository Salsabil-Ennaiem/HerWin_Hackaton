import { api, getDashboard } from "../api";
import { getGuestId } from "../store";

describe("anonymous API client", () => {
  it("sends the browser guest ID with API requests", async () => {
    let request;
    const guestId = getGuestId();
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

    expect(request.headers["X-Guest-ID"]).toBe(guestId);
  });
});
