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

  describe("POST /usuarios", () => {
    it("deve criar um usuário com sucesso (dados completos)", async () => {
      // Arrange
      const novoUsuario = {
        nome: "Pedro Oliveira",
        email: "pedro@example.com",
        senhaHash: "hash123456",
        fotoUrl: "https://example.com/pedro.jpg",
        bio: "Amante de aventuras",
        personalidade: "Explorador",
        orcamentoPerfil: "Alto"
      };

      const usuarioCriado = {
        id: "3",
        ...novoUsuario
      };

      mockCriarUsuario.mockResolvedValue(usuarioCriado);

      // Act
      const response = await request(app).post("/usuarios").send(novoUsuario);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        mensagem: "Usuário criado com sucesso",
        usuario: usuarioCriado
      });
      expect(mockCriarUsuario).toHaveBeenCalledWith(
        novoUsuario.nome,
        novoUsuario.email,
        novoUsuario.senhaHash,
        novoUsuario.fotoUrl,
        novoUsuario.bio,
        novoUsuario.personalidade,
        novoUsuario.orcamentoPerfil
      );
    });

    it("deve criar um usuário com sucesso (apenas dados obrigatórios)", async () => {
      // Arrange
      const novoUsuario = {
        nome: "Ana Costa",
        email: "ana@example.com",
        senhaHash: "hash789"
      };

      const usuarioCriado = {
        id: "4",
        ...novoUsuario,
        fotoUrl: null,
        bio: null,
        personalidade: null,
        orcamentoPerfil: null
      };

      mockCriarUsuario.mockResolvedValue(usuarioCriado);

      // Act
      const response = await request(app).post("/usuarios").send(novoUsuario);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        mensagem: "Usuário criado com sucesso",
        usuario: usuarioCriado
      });
    });

    it("deve retornar erro 400 quando nome não for fornecido", async () => {
      // Arrange
      const dadosIncompletos = {
        email: "teste@example.com",
        senhaHash: "hash123"
      };

      // Act
      const response = await request(app)
        .post("/usuarios")
        .send(dadosIncompletos);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        erro: "Nome, email e senha são obrigatórios"
      });
      expect(mockCriarUsuario).not.toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando email não for fornecido", async () => {
      // Arrange
      const dadosIncompletos = {
        nome: "Teste",
        senhaHash: "hash123"
      };

      // Act
      const response = await request(app)
        .post("/usuarios")
        .send(dadosIncompletos);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        erro: "Nome, email e senha são obrigatórios"
      });
      expect(mockCriarUsuario).not.toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando senha não for fornecida", async () => {
      // Arrange
      const dadosIncompletos = {
        nome: "Teste",
        email: "teste@example.com"
      };

      // Act
      const response = await request(app)
        .post("/usuarios")
        .send(dadosIncompletos);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        erro: "Nome, email e senha são obrigatórios"
      });
      expect(mockCriarUsuario).not.toHaveBeenCalled();
    });

    it("deve retornar erro 409 quando email já estiver cadastrado", async () => {
      // Arrange
      const usuarioDuplicado = {
        nome: "Usuário Duplicado",
        email: "duplicado@example.com",
        senhaHash: "hash123"
      };

      mockCriarUsuario.mockResolvedValue(null); // Simula email já cadastrado

      // Act
      const response = await request(app)
        .post("/usuarios")
        .send(usuarioDuplicado);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        erro: "Email já cadastrado"
      });
      expect(mockCriarUsuario).toHaveBeenCalled();
    });
  });
});
