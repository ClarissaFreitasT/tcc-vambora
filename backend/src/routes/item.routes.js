import { Router } from "express";
import * as ItemController from "../controllers/item.controller.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, ItemController.criarItem);

router.get("/:diaId", ItemController.listarItensDoDia);

router.patch("/:id", authMiddleware, ItemController.atualizarItem);

router.delete("/:id", authMiddleware, ItemController.deletarItem);

export default router;
