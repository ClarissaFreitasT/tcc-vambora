import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
const generateContent = jest.fn();
const construtor = jest.fn();
jest.unstable_mockModule("@google/genai", () => ({ GoogleGenAI: class {
  constructor(config) { construtor(config); this.models = { generateContent }; }
} }));
const { gerarComGemini, verificarGemini } = await import("../services/gemini.js");

describe("adaptador Gemini", () => {
  let env;
  beforeEach(() => { env = { ...process.env }; process.env.GEMINI_API_KEY = "chave-teste"; process.env.GEMINI_MODEL = "modelo-teste"; jest.spyOn(console, "info").mockImplementation(() => {}); generateContent.mockReset(); });
  afterEach(() => { process.env = env; jest.restoreAllMocks(); });
  it("desabilita IA sem configuração", () => { delete process.env.GEMINI_API_KEY; expect(verificarGemini).toThrow("indisponível"); expect(generateContent).not.toHaveBeenCalled(); });
  it("solicita JSON, timeout e nenhuma repetição automática", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify({ resposta: "Qual cidade?", proposta: null }), usageMetadata: { totalTokenCount: 10 } });
    expect((await gerarComGemini({ mensagem: "Pergunta" })).proposta).toBeNull();
    expect(construtor).toHaveBeenLastCalledWith(expect.objectContaining({ httpOptions: { timeout: 60000, retryOptions: { attempts: 1 } } }));
    expect(generateContent.mock.calls[0][0].config.responseMimeType).toBe("application/json");
    expect(console.info.mock.calls[0][0]).not.toContain("Pergunta");
    expect(console.info.mock.calls[0][0]).not.toContain("chave-teste");
  });
  it.each(["invalid", JSON.stringify({ resposta: "Sem roteiro", proposta: null })])("rejeita saída inicial inválida", async (text) => {
    generateContent.mockResolvedValue({ text });
    await expect(gerarComGemini({}, true)).rejects.toMatchObject({ status: 502 });
  });
  it("trata timeout e erros sem expor dados do SDK", async () => {
    generateContent.mockRejectedValueOnce(Object.assign(new Error("segredo"), { name: "TimeoutError" }));
    await expect(gerarComGemini({})).rejects.toMatchObject({ status: 504 });
    generateContent.mockRejectedValueOnce(new Error("chave-teste"));
    await expect(gerarComGemini({})).rejects.toMatchObject({ status: 503, message: expect.not.stringContaining("chave-teste") });
  });
});
