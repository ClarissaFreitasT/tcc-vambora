import { Router } from "express";
import * as ItemController from "../controllers/item.controller.js";

const router = Router();

router.post("/", ItemController.criarItem);

export default router;