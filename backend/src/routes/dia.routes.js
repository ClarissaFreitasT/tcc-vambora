import { Router } from "express";
import * as DiaController from "../controllers/dia.controller.js";

const router = Router();

router.post("/", DiaController.criarDia);

export default router;