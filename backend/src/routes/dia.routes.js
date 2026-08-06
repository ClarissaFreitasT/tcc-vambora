import { Router } from "express";
import * as DiaController from "../controllers/dia.controller.js";

const router = Router();

router.post("/", DiaController.criarDia);

router.get("/:roteiroId", DiaController.listarDiasDoRoteiro);

router.patch("/:id", DiaController.atualizarDia);

router.delete("/:id", DiaController.deletarDia);


export default router;