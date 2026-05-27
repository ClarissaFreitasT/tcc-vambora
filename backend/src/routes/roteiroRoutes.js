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
router.get("/roteiros", roteiroController.listarRoteiros);

/**
 * GET /roteiros/:id - Obtém um roteiro específico
 */
router.get("/roteiros/:id", roteiroController.obterRoteiro);

/**
 * POST /roteiros - Cria um novo roteiro
 */
router.post("/roteiros", roteiroController.criarRoteiro);

/**
 * PATCH /roteiros/:id - Atualiza um roteiro parcialmente
 */
router.patch("/roteiros/:id", roteiroController.atualizarRoteiro);

/**
 * DELETE /roteiros/:id - Remove um roteiro
 */
router.delete("/roteiros/:id", roteiroController.deletarRoteiro);

// Exporta o roteador para ser usado no app principal
export default router;
