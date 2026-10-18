import { clearResult, getGuestId, loadResult, saveResult } from "../store";
import { mockResult } from "../test/fixtures";

describe("store", () => {
  it("save puis load renvoie le même objet", () => {
    saveResult(mockResult);
    expect(loadResult()).toEqual(mockResult);
  });

  it("load renvoie null quand rien n'est stocké", () => {
    expect(loadResult()).toBeNull();
  });

  it("load renvoie null si le JSON est corrompu", () => {
    sessionStorage.setItem("herwin:lastResult", "{bad json");
    expect(loadResult()).toBeNull();
  });

  it("clear efface le résultat", () => {
    saveResult(mockResult);
    clearResult();
    expect(loadResult()).toBeNull();
  });

  it("crée et conserve un identifiant invité par navigateur", () => {
    const guestId = getGuestId();
    expect(guestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(getGuestId()).toBe(guestId);
  });
});