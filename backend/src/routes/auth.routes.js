import { Router } from "express";

import {
  register,
  login,
  verificarDisponibilidadeUsername,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/username/availability", verificarDisponibilidadeUsername);

export default router;
