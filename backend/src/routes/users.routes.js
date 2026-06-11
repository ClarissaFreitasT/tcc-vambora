import { Router } from "express";

import {
  listarUsuarios,
  obterUsuario,
  criarUsuario
} from "../controllers/users.controller.js";

const router = Router();

router.get("/", listarUsuarios);

router.get("/:id", obterUsuario);

router.post("/", criarUsuario);

export default router;