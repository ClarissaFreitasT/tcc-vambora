import { demoId, demoEmail, people, routes, postTexts } from "../../prisma/demo-data.js";

describe("dados da demonstração pública", () => {
  it("usa identidades fictícias únicas e IDs UUID estáveis", () => {
    expect(demoId("user:demo")).toBe(demoId("user:demo"));
    expect(new Set(people.map((person) => person.id)).size).toBe(6);
    expect(new Set(people.map((person) => person.username)).size).toBe(6);
    expect(people.find((person) => person.key === "demo").email).toBe(demoEmail);
    for (const person of people) {
      expect(person.email).toMatch(/@vambora\.example$/);
      expect(person.username).toMatch(/^[a-z0-9._]+$/);
      expect(person.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/);
    }
  });

  it("fornece roteiros completos, autores válidos e um rascunho privado para editar", () => {
    const owners = new Set(people.map((person) => person.key));
    expect(routes.filter((route) => route.publico)).toHaveLength(6);
    expect(postTexts).toHaveLength(6);
    expect(routes.filter((route) => !route.publico && route.owner === "demo")).toHaveLength(1);
    expect(new Set(routes.map((route) => route.key)).size).toBe(routes.length);
    expect(routes.flatMap((route) => route.days)).toHaveLength(15);
    for (const route of routes) {
      expect(owners.has(route.owner)).toBe(true);
      expect(route.orcamento).toBeGreaterThan(0);
      expect(route.imagemUrl.length).toBeLessThanOrEqual(500);
      for (const day of route.days) expect(day).toHaveLength(4);
    }
  });
});
