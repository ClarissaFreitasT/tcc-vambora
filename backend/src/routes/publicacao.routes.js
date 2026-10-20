import { Router } from "express";

import * as publicacaoController from "../controllers/publicacao.controller.js";
import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = Router();

router.get("/categorias", publicacaoController.listarCategoriasPublicacao);
router.get(
  "/salvas",
  authMiddleware,
  publicacaoController.listarPublicacoesSalvas,
);
router.get("/feed", authMiddleware, publicacaoController.listarFeedUsuario);
router.get(
  "/timeline",
  optionalAuth,
  publicacaoController.listarTimelinePublica,
);
router.get(
  "/usuario/:usuarioId",
  optionalAuth,
  publicacaoController.listarPublicacoesUsuario,
);
router.get(
  "/admin/denuncias",
  authMiddleware,
  adminMiddleware,
  publicacaoController.listarDenunciasPublicacoes,
);
router.patch(
  "/admin/denuncias/:denunciaId",
  authMiddleware,
  adminMiddleware,
  publicacaoController.atualizarEstadoDenuncia,
);
router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  publicacaoController.excluirPublicacaoAdmin,
);
router.delete(
  "/:id",
  authMiddleware,
  publicacaoController.excluirPublicacaoPropria,
);
router.get(
  "/:id/curtidas",
  optionalAuth,
  publicacaoController.listarCurtidasPublicacao,
);
router.post(
  "/:id/salvar",
  authMiddleware,
  publicacaoController.salvarPublicacao,
);
router.delete(
  "/:id/salvar",
  authMiddleware,
  publicacaoController.removerPublicacaoSalva,
);
router.post(
  "/:id/denunciar",
  authMiddleware,
  publicacaoController.denunciarPublicacao,
);
router.delete(
  "/comentarios/:comentarioId/admin",
  authMiddleware,
  adminMiddleware,
  publicacaoController.excluirComentarioAdmin,
);
router.get("/:id", optionalAuth, publicacaoController.obterPublicacao);
router.get(
  "/:id/comentarios",
  optionalAuth,
  publicacaoController.listarComentariosPublicacao,
);
router.get(
  "/:id/preview-comentarios",
  optionalAuth,
  publicacaoController.obterPreviewComentarios,
);

router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (!req.is("application/json")) {
      return res.status(415).json({ erro: "Envie a publicação em JSON. Upload de fotos indisponível." });
    }
    return next();
  },
  publicacaoController.criarPublicacao,
);
router.post(
  "/:id/curtir",
  authMiddleware,
  publicacaoController.curtirPublicacao,
);
router.delete(
  "/:id/curtir",
  authMiddleware,
  publicacaoController.removerCurtidaPublicacao,
);
router.post(
  "/:id/comentarios",
  authMiddleware,
  publicacaoController.adicionarComentarioPublicacao,
);

export default router;
