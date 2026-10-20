import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { apiFetch } from "../data/api.js";

const originalLocalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;

function installStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  globalThis.window = { dispatchEvent: jest.fn() };
  return values;
}

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.localStorage = originalLocalStorage;
  globalThis.window = originalWindow;
});

describe("apiFetch session handling", () => {
  it("keeps the active session when the API returns a server error", async () => {
    const values = installStorage({ vambora_token: "valid-token" });
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ erro: "Serviço indisponível" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiFetch("/usuarios/me")).rejects.toMatchObject({
      status: 500,
    });
    expect(values.get("vambora_token")).toBe("valid-token");
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  it("clears only the token that received an unauthorized response", async () => {
    const values = installStorage({ vambora_token: "expired-token" });
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiFetch("/usuarios/me")).rejects.toMatchObject({
      status: 401,
    });
    expect(values.has("vambora_token")).toBe(false);
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(window.dispatchEvent.mock.calls[0][0].detail).toEqual({
      token: "expired-token",
    });
  });

  it("does not override the multipart content type for photo uploads", async () => {
    installStorage({ vambora_token: "valid-token" });
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "post-1" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = new FormData();
    body.append("texto", "Uma dica de viagem");

    await apiFetch("/publicacoes", { method: "POST", body });

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers.get("Content-Type")).toBeNull();
    expect(options.headers.get("Authorization")).toBe("Bearer valid-token");
    expect(options.body).toBe(body);
  });
});
