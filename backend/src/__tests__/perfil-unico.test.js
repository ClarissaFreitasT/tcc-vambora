import { jest } from "@jest/globals";

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.unstable_mockModule("../config/prisma.js", () => ({
  prisma: {
    usuario: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

const UsuarioModel = await import("../models/users.model.js");

describe("Perfil único do usuário", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("não expõe o e-mail no perfil público", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      nome: "Ana",
      email: "ana@example.com",
      username: "ana",
      bio: "Amante de viagens",
    });

    await UsuarioModel.obterUsuarioPorId("user-1");

    const select = mockFindUnique.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("email");
  });

  it("retorna apenas roteiros públicos e campos públicos de publicações no perfil por username", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      nome: "Ana",
      username: "ana",
      roteiros: [],
      publicacoes: [],
    });

    await UsuarioModel.obterUsuarioPorUsername(" Ana ");

    const chamada = mockFindUnique.mock.calls[0][0];
    expect(chamada.where).toEqual({ username: "ana" });
    expect(chamada.select).not.toHaveProperty("email");
    expect(chamada.select.roteiros.where).toEqual({ publico: true });
    expect(chamada.select.publicacoes.select).toEqual({
      id: true,
      texto: true,
      criadoEm: true,
    });
  });

  it("bloqueia alteração de e-mail e role no perfil", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      nome: "Ana",
      email: "ana@example.com",
      username: "ana",
    });
    mockUpdate.mockResolvedValue({
      id: "user-1",
      nome: "Ana",
      username: "ana",
      bio: "Nova bio",
    });

    await UsuarioModel.atualizarUsuario("user-1", {
      email: "novo@example.com",
      role: "ADMIN",
      bio: "Nova bio",
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { bio: "Nova bio" },
      }),
    );
  });
});
