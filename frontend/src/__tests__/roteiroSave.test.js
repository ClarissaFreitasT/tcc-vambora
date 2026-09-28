import {
  buildRoteiroPayload,
  serializeDiaPayload,
  serializeItemPayload,
} from "../utils/roteiroSave.js";

describe("roteiroSave payloads", () => {
  it("serializes the roteiro base payload with the expected fields", () => {
    const payload = buildRoteiroPayload({
      titulo: "  Lisboa em 3 dias  ",
      destino: "  Lisboa, Portugal  ",
      descricao: "  Passeios e gastronomia  ",
      orcamento: "2500",
      publico: true,
    });

    expect(payload).toEqual({
      titulo: "Lisboa em 3 dias",
      destino: "Lisboa, Portugal",
      descricao: "Passeios e gastronomia",
      orcamento: 2500,
      publico: true,
    });
  });

  it("serializes dia and item payloads in the backend format", () => {
    const diaPayload = serializeDiaPayload({
      numeroDia: 2,
      titulo: "  Dia 2  ",
    });
    const itemPayload = serializeItemPayload(
      {
        titulo: "  Torre de Belém  ",
        descricao: "  Visita ao monumento  ",
        localNome: "  Belém  ",
        horarioInicio: "09:30",
        custoEstimado: "45",
      },
      0,
    );

    expect(diaPayload).toEqual({
      numeroDia: 2,
      titulo: "Dia 2",
    });

    expect(itemPayload).toEqual({
      titulo: "Torre de Belém",
      descricao: "Visita ao monumento",
      localNome: "Belém",
      horarioInicio: "09:30",
      custoEstimado: 45,
      ordem: 0,
    });
  });
});
