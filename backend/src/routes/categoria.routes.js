import { Router } from "express";

import * as categoriaController from "../controllers/categoria.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", categoriaController.listarCategorias);
router.post("/", authMiddleware, categoriaController.criarCategoria);
router.post(
  "/:id/categorias/:categoriaId",
  authMiddleware,
  categoriaController.associarCategoriaAoRoteiro,
);
router.delete(
  "/:id/categorias/:categoriaId",
  authMiddleware,
  categoriaController.removerCategoriaDoRoteiro,
);

export default router;
