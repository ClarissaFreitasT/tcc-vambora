import { Router } from "express";

import {
  listarUsuarios,
  obterUsuario,
  atualizarUsuario,
  deletarUsuario,
} from "../controllers/users.controller.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, listarUsuarios);

router.get("/:id", authMiddleware, obterUsuario);

router.patch("/:id", authMiddleware, atualizarUsuario);

router.delete("/:id", authMiddleware, deletarUsuario);

export default router;
