import { Router } from "express";

import {
  listarUsuarios,
  obterUsuario,
  criarUsuario,
  atualizarUsuario,
  login,
  deletarUsuario
} from "../controllers/users.controller.js";

const router = Router();

router.get("/", listarUsuarios);

router.get("/:id", obterUsuario);

router.post("/", criarUsuario);

router.patch("/:id", atualizarUsuario);

router.post("/login", login);

router.delete("/:id", deletarUsuario);

export default router;