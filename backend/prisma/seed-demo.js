import "dotenv/config";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { prisma } from "../src/config/prisma.js";
import { demoEmail, demoPassword, demoId, notice, people, routes, postTexts } from "./demo-data.js";

async function seed() {
  const password = process.env.DEMO_PASSWORD || demoPassword;
  if (password.length < 8) throw new Error("DEMO_PASSWORD deve ter pelo menos 8 caracteres.");
  const senhaHash = await bcrypt.hash(password, 10);
  // Personagens secundários não compartilham a senha pública da apresentação.
  const secondaryHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const userId = (key) => demoId(`user:${key}`);
  const date = (offset) => new Date(Date.UTC(2026, 9, 20 + offset, 12));
  const ensure = (db, model, key, data) => db[model].upsert({
    where: { id: demoId(key) }, update: {}, create: { id: demoId(key), ...data },
  });

  await prisma.$transaction(async (db) => {
    for (const { key, ...person } of people) {
      // Não assumir uma conta existente só porque o e-mail/username coincidem.
      const collision = await db.usuario.findFirst({ where: {
        OR: [{ email: person.email }, { username: person.username }],
        NOT: { id: person.id },
      } });
      if (collision) throw new Error(`E-mail ou username reservado à demo já está em uso: ${person.username}`);
      await ensure(db, "usuario", `user:${key}`, {
        ...person, senhaHash: key === "demo" ? senhaHash : secondaryHash,
        dataNascimento: new Date("1998-05-15T00:00:00Z"), role: "USER", criadoEm: date(-10),
      });
    }

    const categories = {};
    for (const nome of ["Dicas", "Roteiros", "Destinos", "Cultura", "Aventura", "Gastronomia", "Praia", "Natureza"]) {
      categories[nome] = (await db.categoria.upsert({
        where: { nome }, update: {}, create: { id: demoId(`category:${nome}`), nome },
      })).id;
    }

    for (const [index, route] of routes.entries()) {
      const { key, owner, days, categoria, descricao, ...data } = route;
      const roteiroId = demoId(`route:${key}`);
      await ensure(db, "roteiro", `route:${key}`, {
        ...data, usuarioId: userId(owner), descricao: `${descricao}\n\n${notice}\nFotografia meramente ilustrativa.`, criadoEm: date(index),
      });
      const categoriaId = categories[categoria];
      await db.roteiroCategoria.upsert({ where: { roteiroId_categoriaId: { roteiroId, categoriaId } },
        update: {}, create: { roteiroId, categoriaId } });

      for (const [dayIndex, [titulo, ...activities]] of days.entries()) {
        const dayKey = `day:${key}:${dayIndex}`;
        const dia = await db.diaDoRoteiro.upsert({
          where: { roteiroId_numeroDia: { roteiroId, numeroDia: dayIndex + 1 } },
          update: {}, create: { id: demoId(dayKey), roteiroId, numeroDia: dayIndex + 1, titulo },
        });
        for (const [ordem, activity] of activities.entries()) {
          await ensure(db, "itemDoRoteiro", `item:${key}:${dayIndex}:${ordem}`, {
            diaId: dia.id, titulo: activity, localNome: data.destino,
            descricao: "Atividade ilustrativa. Confirme local, disponibilidade e valores antes de uma viagem real.",
            custoEstimado: [30, 65, 40][ordem], ordem,
            horarioInicio: new Date(`1970-01-01T${["09", "12", "15"][ordem]}:00:00Z`),
          });
        }
      }
      if (!data.publico) continue;
      const publicacaoId = demoId(`post:${key}`);
      await ensure(db, "publicacao", `post:${key}`, {
        usuarioId: userId(owner), roteiroId,
        texto: `[DEMONSTRAÇÃO — relato fictício]\n${postTexts[index]}\n\n${notice}`, criadoEm: date(index + 1),
      });
      for (const nome of ["Roteiros", categoria]) {
        const categoriaId = categories[nome];
        await db.publicacaoCategoria.upsert({ where: { publicacaoId_categoriaId: { publicacaoId, categoriaId } },
          update: {}, create: { publicacaoId, categoriaId } });
      }
      const reviewers = people.filter((person) => person.key !== owner).slice(0, 2 + index % 3);
      for (const [position, person] of reviewers.entries()) {
        const usuarioId = person.id;
        const roteiroPair = { usuarioId, roteiroId };
        const postPair = { usuarioId, publicacaoId };
        for (const model of ["favorito", "salvoRoteiro"]) {
          await db[model].upsert({ where: { usuarioId_roteiroId: roteiroPair }, update: {}, create: roteiroPair });
        }
        await db.review.upsert({ where: { usuarioId_roteiroId: roteiroPair }, update: {}, create: {
          ...roteiroPair, nota: position % 2 ? 4 : 5,
          comentario: "Avaliação fictícia para demonstrar o site: gostei da organização dos dias e das pausas!", criadoEm: date(index + 2),
        } });
        for (const model of ["curtidaPublicacao", "salvoPublicacao"]) {
          await db[model].upsert({ where: { usuarioId_publicacaoId: postPair }, update: {}, create: postPair });
        }
      }
      const commentKey = `comment:${key}`;
      await ensure(db, "comentario", commentKey, {
        usuarioId: reviewers[0].id, publicacaoId,
        texto: "[Comentário fictício] Gostei das pausas no planejamento! Dá para adaptar para uma viagem em grupo?", criadoEm: date(index + 2),
      });
      await ensure(db, "comentario", `reply:${key}`, {
        usuarioId: userId(owner), publicacaoId, comentarioPaiId: demoId(commentKey),
        texto: "[Resposta fictícia] Sim! A ideia é duplicar o roteiro e ajustar atividades e orçamento para o grupo.", criadoEm: date(index + 3),
      });
    }
    for (const person of people.slice(1)) {
      for (const pair of [
        { seguidorId: userId("demo"), seguidoId: person.id },
        { seguidorId: person.id, seguidoId: userId("demo") },
      ]) {
        await db.seguidor.upsert({ where: { seguidorId_seguidoId: pair }, update: {}, create: pair });
      }
    }
  }, { maxWait: 10000, timeout: 120000 });
  console.log("Seed concluída: 6 usuários, 7 roteiros (6 públicos), 15 dias, 45 atividades, 6 publicações e interações fictícias.");
  console.log(`Login de demonstração: ${demoEmail} (@vambora.demo).`);
  console.log("Senha inicial: DEMO_PASSWORD, se definida, ou a senha padrão documentada em prisma/DEMO.md. Contas existentes mantêm sua senha.");
}

try {
  await seed();
} catch (error) {
  // Evita imprimir strings de conexão presentes em erros do driver.
  console.error("Não foi possível concluir a seed. A transação foi revertida.");
  console.error(error.code || error.name);
  if (/reservado à demo|DEMO_PASSWORD/.test(error.message)) console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
