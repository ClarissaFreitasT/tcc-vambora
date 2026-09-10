import { Router } from "express";
import * as DiaController from "../controllers/dia.controller.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, DiaController.criarDia);

router.get("/:roteiroId", DiaController.listarDiasDoRoteiro);

router.patch("/:id", authMiddleware, DiaController.atualizarDia);

router.delete("/:id", authMiddleware, DiaController.deletarDia);


export default router;