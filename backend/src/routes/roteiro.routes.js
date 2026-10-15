import express from "express";
import * as roteiroController from "../controllers/roteiro.controller.js";

// Cria um roteador do Express
const router = express.Router();

import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";
// ========================================
// DEFINIÇÃO DAS ROTAS DE ROTEIROS
// ========================================

/**
 * GET /roteiros - Lista todos os roteiros
 */
router.get("/", optionalAuth, roteiroController.listarRoteiros);
router.get("/publicos", optionalAuth, roteiroController.listarRoteirosPublicos);
router.get(
  "/populares",
  optionalAuth,
  roteiroController.listarRoteirosPopulares,
);
router.get("/salvos", authMiddleware, roteiroController.listarRoteirosSalvos);

router.post(
  "/:id/curtir",
  authMiddleware,
  roteiroController.adicionarCurtidaRoteiro,
);
router.delete(
  "/:id/curtir",
  authMiddleware,
  roteiroController.removerCurtidaRoteiro,
);
router.get(
  "/:id/curtidas",
  optionalAuth,
  roteiroController.obterCurtidasRoteiro,
);

router.post(
  "/:id/salvar",
  authMiddleware,
  roteiroController.salvarRoteiroUsuario,
);
router.delete(
  "/:id/salvar",
  authMiddleware,
  roteiroController.removerRoteiroSalvoUsuario,
);

router.get(
  "/:id/avaliacoes",
  optionalAuth,
  roteiroController.listarAvaliacoesRoteiro,
);
router.post(
  "/:id/avaliar",
  authMiddleware,
  roteiroController.criarAvaliacaoRoteiro,
);
router.delete(
  "/:id/avaliar",
  authMiddleware,
  roteiroController.removerAvaliacaoRoteiro,
);

/**
 * GET /roteiros/:id - Obtém um roteiro específico
 */
router.post("/:id/duplicar", authMiddleware, roteiroController.duplicarRoteiro);

router.get("/:id", optionalAuth, roteiroController.obterRoteiro);

/**
 * POST /roteiros - Cria um novo roteiro
 */
router.post("/", authMiddleware, roteiroController.criarRoteiro);

/**
 * PATCH /roteiros/:id - Atualiza um roteiro parcialmente
 */
router.patch("/:id", authMiddleware, roteiroController.atualizarRoteiro);

/**
 * DELETE /roteiros/:id - Remove um roteiro
 */
router.delete("/:id", authMiddleware, roteiroController.excluirRoteiro);

// Exporta o roteador para ser usado no app principal
export default router;
