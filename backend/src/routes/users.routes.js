import { Router } from "express";

import {
  listarUsuarios,
  listarComunidade,
  obterMeuPerfil,
  listarCurtidasDoUsuario,
  atualizarMeuPerfil,
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

const router = Router();

router.get("/", optionalAuth, listarUsuarios);
router.get("/comunidade", authMiddleware, listarComunidade);
router.get("/me", authMiddleware, obterMeuPerfil);
router.get("/me/curtidas", authMiddleware, listarCurtidasDoUsuario);
router.patch("/me", authMiddleware, atualizarMeuPerfil);
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
