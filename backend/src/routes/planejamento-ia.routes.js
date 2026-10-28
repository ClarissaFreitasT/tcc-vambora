import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { planejamentoIa as service } from "../services/planejamento-ia.js";

const router = Router();
router.use(authMiddleware);
router.get("/", async (req, res) => res.json(await service.listar(req.user.id)));
router.get("/:id", async (req, res) => res.json(await service.obter(req.user.id, req.params.id)));
router.post("/", async (req, res) => res.status(201).json(await service.gerarProposta(req.user.id, null, req.body || {})));
router.post("/:id/mensagens", async (req, res) => res.json(await service.gerarProposta(req.user.id, req.params.id, req.body || {})));
router.post("/:id/propostas/:propostaId/aplicar", async (req, res) => res.json(await service.aplicar(req.user.id, req.params.id, req.params.propostaId)));
router.post("/:id/propostas/:propostaId/descartar", async (req, res) => res.json(await service.descartar(req.user.id, req.params.id, req.params.propostaId)));
router.delete("/:id", async (req, res) => { await service.excluir(req.user.id, req.params.id); res.sendStatus(204); });
router.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({ erro: error.status ? error.message : "Não foi possível concluir o planejamento.", planejamentoId: error.planejamentoId, novaTentativa: error.novaTentativa });
});
export default router;
