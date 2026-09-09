import request from "supertest";
import { jest } from "@jest/globals";

// Mock do modelo de usuários antes de importar o app
const mockObterTodosUsuarios = jest.fn();
const mockObterUsuarioPorId = jest.fn();
const mockCriarUsuario = jest.fn();

jest.unstable_mockModule("../models/users.model.js", () => ({
  obterTodosUsuarios: mockObterTodosUsuarios,
  obterUsuarioPorId: mockObterUsuarioPorId,
  criarUsuario: mockCriarUsuario
}));

// Importa o app após configurar os mocks
const { default: app } = await import("../app.js");

describe("Testes das Rotas de Usuários", () => {
  // Limpa os mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /usuarios", () => {
    it("deve retornar lista de usuários com sucesso", async () => {
      // Arrange
      const usuariosMock = [
        {
          id: "1",
          nome: "João Silva",
          email: "joao@example.com",
          fotoUrl: null,
          bio: null,
          personalidade: null,
          orcamentoPerfil: null
        },
        {
          id: "2",
          nome: "Maria Santos",
          email: "maria@example.com",
          fotoUrl: null,
          bio: null,
          personalidade: null,
          orcamentoPerfil: null
        }
      ];

      mockObterTodosUsuarios.mockResolvedValue(usuariosMock);

      // Act
      const response = await request(app).get("/usuarios");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(usuariosMock);
      expect(mockObterTodosUsuarios).toHaveBeenCalledTimes(1);
    });

    it("deve retornar lista vazia quando não há usuários", async () => {
      // Arrange
      mockObterTodosUsuarios.mockResolvedValue([]);

      // Act
      const response = await request(app).get("/usuarios");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(mockObterTodosUsuarios).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /usuarios/:id", () => {
    it("deve retornar um usuário específico com sucesso", async () => {
      // Arrange
      const usuarioMock = {
        id: "1",
        nome: "João Silva",
        email: "joao@example.com",
        fotoUrl: "https://example.com/foto.jpg",
        bio: "Desenvolvedor apaixonado por viagens",
        personalidade: "Aventureiro",
        orcamentoPerfil: "Médio"
      };

      mockObterUsuarioPorId.mockResolvedValue(usuarioMock);

      // Act
      const response = await request(app).get("/usuarios/1");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(usuarioMock);
      expect(mockObterUsuarioPorId).toHaveBeenCalledWith("1");
      expect(mockObterUsuarioPorId).toHaveBeenCalledTimes(1);
    });

    it("deve retornar 404 quando usuário não for encontrado", async () => {
      // Arrange
      mockObterUsuarioPorId.mockResolvedValue(null);

      // Act
      const response = await request(app).get("/usuarios/999");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        erro: "Usuário não encontrado"
      });
      expect(mockObterUsuarioPorId).toHaveBeenCalledWith("999");
    });
  });

});
