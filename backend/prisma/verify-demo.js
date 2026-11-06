import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { prisma } from "../src/config/prisma.js";
import { demoEmail, demoPassword, people, routes, demoId } from "./demo-data.js";

try {
  const usuarioIds = people.map((person) => person.id);
  const roteiroIds = routes.map((route) => demoId(`route:${route.key}`));
  const publicacaoIds = routes.filter((route) => route.publico).map((route) => demoId(`post:${route.key}`));
  const counts = {
    usuarios: await prisma.usuario.count({ where: { id: { in: usuarioIds } } }),
    roteiros: await prisma.roteiro.count({ where: { id: { in: roteiroIds } } }),
    dias: await prisma.diaDoRoteiro.count({ where: { roteiroId: { in: roteiroIds } } }),
    atividades: await prisma.itemDoRoteiro.count({ where: { dia: { roteiroId: { in: roteiroIds } } } }),
    publicacoes: await prisma.publicacao.count({ where: { id: { in: publicacaoIds } } }),
    comentarios: await prisma.comentario.count({ where: { publicacaoId: { in: publicacaoIds }, usuarioId: { in: usuarioIds } } }),
    avaliacoes: await prisma.review.count({ where: { roteiroId: { in: roteiroIds }, usuarioId: { in: usuarioIds } } }),
  };
  assert.deepEqual(counts, { usuarios: 6, roteiros: 7, dias: 15, atividades: 45, publicacoes: 6, comentarios: 12, avaliacoes: 18 });
  const user = await prisma.usuario.findUniqueOrThrow({ where: { email: demoEmail } });
  assert.equal(user.role, "USER");
  assert.ok(await bcrypt.compare(process.env.DEMO_PASSWORD || demoPassword, user.senhaHash), "Senha da demo diverge da senha inicial configurada.");
  console.log("Carga e senha da conta demo verificadas:", counts);
} catch (error) {
  console.error("Falha na verificação da demo:", error.code || error.name);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
