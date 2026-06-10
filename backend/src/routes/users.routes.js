import { Router } from "express";

import {
  listarUsuarios,
  obterUsuario,
  cadastrarUsuario
} from "../controllers/users.controller.js";

const router = Router();

router.get("/", listarUsuarios);

router.get("/:id", obterUsuario);

router.post("/", cadastrarUsuario);

export default router;