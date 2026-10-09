import { Router } from "express";

import * as publicacaoController from "../controllers/publicacao.controller.js";
import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = Router();

router.get("/feed", authMiddleware, publicacaoController.listarFeedUsuario);
router.get(
  "/usuario/:usuarioId",
  optionalAuth,
  publicacaoController.listarPublicacoesUsuario,
);
router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  publicacaoController.excluirPublicacaoAdmin,
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

router.post("/", authMiddleware, publicacaoController.criarPublicacao);
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
