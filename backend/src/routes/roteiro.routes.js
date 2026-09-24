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

/**
 * GET /roteiros/:id - Obtém um roteiro específico
 */
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
