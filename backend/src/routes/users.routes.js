import { Router } from "express";

import {
  listarUsuarios,
  obterUsuario,
  atualizarUsuario,
  deletarUsuario
} from "../controllers/users.controller.js";

const router = Router();

router.get("/", listarUsuarios);

router.get("/:id", obterUsuario);

router.patch("/:id", atualizarUsuario);

router.delete("/:id", deletarUsuario);

export default router;