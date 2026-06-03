import express from "express";
import * as roteiroController from "../controllers/roteiroController.js";

// Cria um roteador do Express
const router = express.Router();

// ========================================
// DEFINIÇÃO DAS ROTAS DE ROTEIROS
// ========================================

/**
 * GET /roteiros - Lista todos os roteiros
 */
router.get("/", roteiroController.listarRoteiros);

/**
 * GET /roteiros/:id - Obtém um roteiro específico
 */
router.get("/:id", roteiroController.obterRoteiro);

/**
 * POST /roteiros - Cria um novo roteiro
 */
router.post("/", roteiroController.criarRoteiro);

/**
 * PATCH /roteiros/:id - Atualiza um roteiro parcialmente
 */
router.patch("/:id", roteiroController.atualizarRoteiro);

/**
 * DELETE /roteiros/:id - Remove um roteiro
 */
router.delete("/:id", roteiroController.excluirRoteiro);

// Exporta o roteador para ser usado no app principal
export default router;
