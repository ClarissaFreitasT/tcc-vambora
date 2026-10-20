import app from "./src/app.js";
import { prisma } from "./src/config/prisma.js";
import jwt from "jsonwebtoken";

const users = [];
let server;
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};

  if (response.status !== 201) {
    throw new Error(`create failed: ${response.status} ${await response.text()}`);
  }
  const suffix = Date.now();
  for (let index = 0; index < 3; index += 1) {
    users.push(
      await prisma.usuario.create({
        data: {
          nome: `Community Test ${index}`,
          email: `community-test-${suffix}-${index}@example.invalid`,
          senhaHash: "integration-test-only",
          ...(index === 2 ? { role: "ADMIN" } : {}),
        },
      }),
    );
  }

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET);
  const request = (url, method, id, body, headers = {}) =>
    fetch(base + url, {
      method,
      headers: { Authorization: `Bearer ${token(id)}`, ...headers },
      body,
    });

  const categories = await fetch(`${base}/publicacoes/categorias`).then((r) =>
    r.json(),
  );
  check(categories.length >= 3, "categories missing");

  const form = new FormData();
  form.append("texto", "Teste de integração da comunidade");
  form.append("categoriaIds", JSON.stringify([categories[0].id]));
  form.append(
    "fotos",
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS8cAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    ),
    "test.png",
  );
  let response = await request("/publicacoes", "POST", users[0].id, form);
  if (response.status !== 201) {
    throw new Error(`create failed: ${response.status} ${await response.text()}`);
  }
  const post = await response.json();
  check(
    post.fotos.length === 1 && post.categorias.length === 1,
    "media/category missing",
  );

  response = await request(
    `/publicacoes/timeline?limit=12&categorias=${categories[0].id}`,
    "GET",
    users[0].id,
  );
  check(response.status === 200, "feed failed");
  check(
    (await response.json()).items.some((item) => item.id === post.id),
    "post absent from filtered feed",
  );

  response = await request(
    `/publicacoes/${post.id}/salvar`,
    "POST",
    users[1].id,
  );
  check(response.status === 200, "save failed");
  response = await request(
    `/publicacoes/${post.id}/curtir`,
    "POST",
    users[1].id,
  );
  check(response.status === 201, "like failed");
  response = await request(
    `/publicacoes/${post.id}/comentarios`,
    "POST",
    users[1].id,
    JSON.stringify({ texto: "Comentário de teste" }),
    { "Content-Type": "application/json" },
  );
  check(response.status === 201, "comment failed");
  response = await request(
    `/publicacoes/${post.id}/preview-comentarios`,
    "GET",
    users[0].id,
  );
  check(
    response.status === 200 && (await response.json()).length === 1,
    "comment preview failed",
  );
  response = await request(
    `/publicacoes/${post.id}/denunciar`,
    "POST",
    users[1].id,
    JSON.stringify({ motivo: "Spam" }),
    { "Content-Type": "application/json" },
  );
  check(response.status === 201, "report failed");

  response = await request("/publicacoes/admin/denuncias", "GET", users[2].id);
  check(response.status === 200, "admin reports failed");
  const report = (await response.json()).find(
    (item) => item.publicacao?.id === post.id,
  );
  check(Boolean(report), "report not found");
  response = await request(
    `/publicacoes/admin/denuncias/${report.id}`,
    "PATCH",
    users[2].id,
    JSON.stringify({ estado: "TRATADA" }),
    { "Content-Type": "application/json" },
  );
  check(response.status === 200, "report status update failed");

  response = await request(`/publicacoes/${post.id}`, "DELETE", users[0].id);
  check(response.status === 204, "own delete failed");
  response = await request("/publicacoes/salvas", "GET", users[1].id);
  check(
    response.status === 200 && (await response.json()).length === 0,
    "saved post not cascaded",
  );
  response = await request("/publicacoes/admin/denuncias", "GET", users[2].id);
  const preservedReport = (await response.json()).find(
    (item) => item.id === report.id,
  );
  check(
    preservedReport && preservedReport.publicacao === null,
    "report content not safely detached",
  );

  console.log(
    "Community integration passed: photos, categories/filter, save, like, comments, report moderation and author deletion.",
  );
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  for (const user of users) {
    await prisma.usuario.delete({ where: { id: user.id } }).catch(() => {});
  }
  await prisma.$disconnect();
}
