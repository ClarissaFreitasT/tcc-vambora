import { jest } from "@jest/globals";

const mockCriarPublicacao = jest.fn();
const mockEncontrarPublicacao = jest.fn();
const mockCurtirPublicacao = jest.fn();
const mockAdicionarComentario = jest.fn();
const mockObterComentarioDaPublicacao = jest.fn();
const mockObterCurtidaPublicacao = jest.fn();
const mockContarCurtidasPublicacao = jest.fn();
const mockSeguirUsuario = jest.fn();
const mockObterUsuarioPorId = jest.fn();
const mockListarTimelinePublica = jest.fn();
const mockListarCategoriasPublicacao = jest.fn();
const mockObterRoteiroVinculavel = jest.fn();
const mockObterDenuncia = jest.fn();
const mockCriarDenuncia = jest.fn();
const mockSalvarPublicacao = jest.fn();
const mockExcluirPublicacao = jest.fn();

jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  criarPublicacao: mockCriarPublicacao,
  obterPublicacaoPorId: mockEncontrarPublicacao,
  obterCurtidaPublicacao: mockObterCurtidaPublicacao,
  criarCurtidaPublicacao: mockCurtirPublicacao,
  contarCurtidasPublicacao: mockContarCurtidasPublicacao,
  criarComentarioPublicacao: mockAdicionarComentario,
  obterComentarioDaPublicacao: mockObterComentarioDaPublicacao,
  listarTimelinePublica: mockListarTimelinePublica,
  listarCategoriasPublicacao: mockListarCategoriasPublicacao,
  obterRoteiroVinculavel: mockObterRoteiroVinculavel,
  obterDenuncia: mockObterDenuncia,
  criarDenuncia: mockCriarDenuncia,
  salvarPublicacao: mockSalvarPublicacao,
  excluirPublicacao: mockExcluirPublicacao,
}));

jest.unstable_mockModule("../models/users.model.js", () => ({
  seguirUsuario: mockSeguirUsuario,
  obterUsuarioPorId: mockObterUsuarioPorId,
  obterTodosUsuarios: jest.fn(),
  atualizarUsuario: jest.fn(),
  deletarUsuario: jest.fn(),
  obterSeguidor: jest.fn(),
  deixarDeSeguirUsuario: jest.fn(),
  listarSeguidores: jest.fn(),
  listarSeguindo: jest.fn(),
}));

const {
  criarPublicacao,
  curtirPublicacao,
  adicionarComentarioPublicacao,
  listarTimelinePublica,
  salvarPublicacao,
  denunciarPublicacao,
  excluirPublicacaoPropria,
} = await import("../controllers/publicacao.controller.js");
const { seguirUsuario } = await import("../controllers/users.controller.js");

describe("Fase 3 - comunidade social", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockObterUsuarioPorId.mockResolvedValue({ id: "u2", nome: "Maria" });
    mockListarCategoriasPublicacao.mockResolvedValue([]);
    mockObterCurtidaPublicacao.mockResolvedValue(null);
    mockContarCurtidasPublicacao.mockResolvedValue(1);
    mockObterDenuncia.mockResolvedValue(null);
  });

  it("cria uma publicação de um usuário autenticado", async () => {
    mockCriarPublicacao.mockResolvedValue({
      id: "p1",
      texto: "Viagem incrível",
      usuarioId: "u1",
    });

    await criarPublicacao(
      {
        body: { texto: "Viagem incrível" },
        user: { id: "u1" },
        files: [],
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockCriarPublicacao).toHaveBeenCalledWith(
      "u1",
      "Viagem incrível",
      null,
      [],
      [],
    );
  });

  it("lista a timeline pública e informa se o usuário autenticado curtiu", async () => {
    mockListarTimelinePublica.mockResolvedValue([
      {
        id: "p1",
        texto: "Roteiro incrível",
        curtidas: [{ id: "like-1" }],
      },
      { id: "p2", texto: "Dica de viagem", curtidas: [] },
    ]);

    await listarTimelinePublica({ user: { id: "u1" } }, res);

    expect(mockListarTimelinePublica).toHaveBeenCalledWith("u1", null);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { id: "p1", texto: "Roteiro incrível", curtiu: true, salvo: false },
      { id: "p2", texto: "Dica de viagem", curtiu: false, salvo: false },
    ]);
  });

  it("curte uma publicação pública", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });
    mockCurtirPublicacao.mockResolvedValue({
      id: "cp1",
      usuarioId: "u1",
      publicacaoId: "p1",
    });

    await curtirPublicacao({ params: { id: "p1" }, user: { id: "u1" } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockCurtirPublicacao).toHaveBeenCalledWith("u1", "p1");
  });

  it("adiciona comentário em uma publicação", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });
    mockAdicionarComentario.mockResolvedValue({
      id: "c1",
      texto: "Parabéns!",
      usuarioId: "u1",
      publicacaoId: "p1",
    });

    await adicionarComentarioPublicacao(
      {
        params: { id: "p1" },
        body: { texto: "Parabéns!" },
        user: { id: "u1" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAdicionarComentario).toHaveBeenCalledWith(
      "u1",
      "p1",
      "Parabéns!",
      null,
    );
  });

  it("permite responder a um comentário da mesma publicação", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });
    mockObterComentarioDaPublicacao.mockResolvedValue({ id: "c-parent" });
    mockAdicionarComentario.mockResolvedValue({
      id: "c2",
      texto: "Resposta",
      usuarioId: "u1",
      publicacaoId: "p1",
      comentarioPaiId: "c-parent",
    });

    await adicionarComentarioPublicacao(
      {
        params: { id: "p1" },
        body: { texto: "Resposta", comentarioPaiId: "c-parent" },
        user: { id: "u1" },
      },
      res,
    );

    expect(mockObterComentarioDaPublicacao).toHaveBeenCalledWith(
      "c-parent",
      "p1",
    );
    expect(mockAdicionarComentario).toHaveBeenCalledWith(
      "u1",
      "p1",
      "Resposta",
      "c-parent",
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("rejeita resposta a comentário de outra publicação", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });
    mockObterComentarioDaPublicacao.mockResolvedValue(null);

    await adicionarComentarioPublicacao(
      {
        params: { id: "p1" },
        body: { texto: "Resposta", comentarioPaiId: "c-other-post" },
        user: { id: "u1" },
      },
      res,
    );

    expect(mockAdicionarComentario).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: "O comentário respondido não pertence a esta publicação",
    });
  });

  it("salva uma publicação existente para o perfil pessoal", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });

    await salvarPublicacao({ params: { id: "p1" }, user: { id: "u1" } }, res);

    expect(mockSalvarPublicacao).toHaveBeenCalledWith("u1", "p1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ salvo: true });
  });

  it("registra denúncia sem apagar o conteúdo", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });

    await denunciarPublicacao(
      {
        params: { id: "p1" },
        user: { id: "u1" },
        body: { motivo: "Spam", detalhe: "Link suspeito" },
      },
      res,
    );

    expect(mockCriarDenuncia).toHaveBeenCalledWith(
      "u1",
      "p1",
      "Spam",
      "Link suspeito",
    );
    expect(mockExcluirPublicacao).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("permite excluir somente a publicação própria", async () => {
    mockEncontrarPublicacao.mockResolvedValue({
      id: "p1",
      usuarioId: "u1",
      fotos: [],
    });

    await excluirPublicacaoPropria(
      { params: { id: "p1" }, user: { id: "u1" } },
      res,
    );

    expect(mockExcluirPublicacao).toHaveBeenCalledWith("p1");
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("segue um usuário sem repetir relacionamento", async () => {
    mockSeguirUsuario.mockResolvedValue({
      id: "s1",
      seguidorId: "u1",
      seguidoId: "u2",
    });

    await seguirUsuario({ params: { id: "u2" }, user: { id: "u1" } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockSeguirUsuario).toHaveBeenCalledWith("u1", "u2");
  });
});
