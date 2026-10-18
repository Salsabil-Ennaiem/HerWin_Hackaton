import { clearResult, getToken, loadResult, saveResult, setToken } from "../store";
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

  it("enregistre et relit le jeton d'authentification", () => {
    setToken("google-id-token");
    expect(getToken()).toBe("google-id-token");
  });

  it("retourne null quand aucun jeton n'est enregistré", () => {
    expect(getToken()).toBeNull();
  });
});