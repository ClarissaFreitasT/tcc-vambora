import { Router } from "express";

import {
  listarUsuarios,
  obterUsuario,
  obterUsuarioPorUsername,
  atualizarUsuario,
  deletarUsuario,
  seguirUsuario,
  deixarDeSeguirUsuario,
  listarSeguidores,
  listarSeguindo,
} from "../controllers/users.controller.js";

import authMiddleware, { optionalAuth } from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, listarUsuarios);
router.get("/perfil/:username", optionalAuth, obterUsuarioPorUsername);
router.get("/username/:username", optionalAuth, obterUsuarioPorUsername);
router.get("/:id/seguidores", authMiddleware, listarSeguidores);
router.get("/:id/seguindo", authMiddleware, listarSeguindo);
router.post("/:id/seguir", authMiddleware, seguirUsuario);
router.delete("/:id/seguir", authMiddleware, deixarDeSeguirUsuario);
router.get("/:id", authMiddleware, obterUsuario);

router.patch("/:id", authMiddleware, atualizarUsuario);
router.delete("/:id", authMiddleware, deletarUsuario);

export default router;
