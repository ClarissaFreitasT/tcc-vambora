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
      seguidores: [{ id: "follow-1" }],
      _count: { seguidores: 4, seguindo: 2, publicacoes: 3 },
    });

    const perfil = await UsuarioModel.obterUsuarioPorUsername(
      " Ana ",
      "viewer-1",
    );

    const chamada = mockFindUnique.mock.calls[0][0];
    expect(chamada.where).toEqual({ username: "ana" });
    expect(chamada.select).not.toHaveProperty("email");
    expect(chamada.select.roteiros.where).toEqual({ publico: true });
    expect(chamada.select.publicacoes.select).toEqual(
      expect.objectContaining({
        id: true,
        texto: true,
        criadoEm: true,
      }),
    );
    expect(chamada.select._count.select).toEqual({
      seguidores: true,
      seguindo: true,
      publicacoes: true,
    });
    expect(chamada.select.seguidores).toEqual({
      where: { seguidorId: "viewer-1" },
      select: { id: true },
    });
    expect(perfil).toEqual(
      expect.objectContaining({
        seguindo: true,
        totalSeguidores: 4,
        totalSeguindo: 2,
        totalPublicacoes: 3,
      }),
    );
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
