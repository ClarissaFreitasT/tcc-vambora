import { Router } from "express";
import * as ItemController from "../controllers/item.controller.js";

const router = Router();

router.post("/", ItemController.criarItem);

router.get("/:diaId", ItemController.listarItensDoDia);

router.patch("/:id", ItemController.atualizarItem);

router.delete("/:id", ItemController.deletarItem);

export default router;