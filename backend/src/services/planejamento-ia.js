import { createHash } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { gerarComGemini, verificarGemini } from "./gemini.js";
import { cidadeLabel, dataCivil, falha, validarChave, validarMensagem, validarProposta, validarViagem } from "./ia-validation.js";

const include = {
  mensagens: { orderBy: [{ criadoEm: "asc" }, { id: "asc" }] },
  propostas: { where: { estado: "pendente" }, orderBy: { criadoEm: "desc" }, take: 1 },
  roteiro: { include: { dias: { orderBy: { numeroDia: "asc" }, include: { itens: { orderBy: { ordem: "asc" } } } } } },
};

export function criarServicoIa(db = prisma, gerar = gerarComGemini, verificar = verificarGemini) {
  async function obter(usuarioId, id, tx = db) {
    const p = await tx.planejamentoIa.findFirst({ where: { id, usuarioId }, include });
    if (!p) throw falha(404, "Planejamento não encontrado.");
    return p;
  }

  async function bloquear(tx, usuarioId, id) {
    // Owner is part of the lock query; an inaccessible ID cannot lock another user's planning.
    await tx.$queryRaw`SELECT id FROM planejamentos_ia WHERE id = ${id} AND usuario_id = ${usuarioId} FOR UPDATE`;
    return obter(usuarioId, id, tx);
  }

  function livre(p) {
    if (p.gerandoAte && p.gerandoAte > new Date()) throw falha(409, "Aguarde a geração em andamento e atualize o planejamento.");
  }

  async function gerarProposta(usuarioId, id, body) {
    const chave = validarChave(body.operacaoId);
    const entrada = id ? { mensagem: validarMensagem(body.mensagem) } : validarViagem(body);
    const hash = createHash("sha256").update(JSON.stringify({ id, entrada })).digest("hex");
    const reserva = await db.$transaction(async (tx) => {
      // Serialize quota reservations across processes without holding a transaction during Gemini calls.
      await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${usuarioId} FOR UPDATE`;
      const anterior = await tx.operacaoIa.findUnique({ where: { usuarioId_chave: { usuarioId, chave } } });
      if (anterior) {
        if (anterior.hash !== hash) throw falha(409, "Este identificador já foi usado para outro pedido.");
        if (anterior.estado === "processando") {
          const expirada = Date.now() - new Date(anterior.criadoEm).getTime() > 90000;
          throw Object.assign(falha(409, expirada ? "A tentativa anterior expirou. Envie uma nova tentativa." : "Pedido em processamento. Aguarde e atualize o planejamento."), { planejamentoId: anterior.planejamentoId, novaTentativa: expirada });
        }
        if (anterior.estado === "falhou") throw Object.assign(falha(502, anterior.erro), { planejamentoId: anterior.planejamentoId, novaTentativa: true });
        if (!anterior.planejamentoId) throw falha(410, "Este planejamento foi excluído.");
        return { repetida: true, id: anterior.planejamentoId };
      }
      verificar();
      const limite = Math.max(1, Number.parseInt(process.env.GEMINI_LIMITE_HORA, 10) || 20);
      const usadas = await tx.operacaoIa.count({ where: { usuarioId, criadoEm: { gte: new Date(Date.now() - 3600000) } } });
      if (usadas >= limite) throw falha(429, "Limite de chamadas de IA atingido. Tente novamente em até uma hora.");
      const p = id ? await bloquear(tx, usuarioId, id) : await tx.planejamentoIa.create({ data: { usuarioId, dadosIniciais: entrada }, include });
      livre(p);
      const op = await tx.operacaoIa.create({ data: { usuarioId, planejamentoId: p.id, chave, hash } });
      await tx.planejamentoIa.update({ where: { id: p.id }, data: { gerandoAte: new Date(Date.now() + 90000), operacaoAtual: op.id } });
      if (id) await tx.mensagemIa.create({ data: { planejamentoId: p.id, papel: "usuario", texto: entrada.mensagem } });
      // A stale pending proposal must not silently revert manual edits.
      const pendente = p.propostas[0];
      const valida = pendente && (!p.roteiro || pendente.revisaoBase === p.roteiro.revisao);
      const roteiro = p.roteiro ? {
        titulo: p.roteiro.titulo, descricao: p.roteiro.descricao,
        cidades: p.roteiro.cidades, pessoas: p.roteiro.pessoas,
        dataIda: p.roteiro.dataIda?.toISOString().slice(0, 10), dataVolta: p.roteiro.dataVolta?.toISOString().slice(0, 10),
        dias: p.roteiro.dias.map((d) => ({ numeroDia: d.numeroDia, titulo: d.titulo, cidadePrincipal: d.cidadePrincipal, itens: d.itens.map((i) => ({ titulo: i.titulo, descricao: i.descricao, localNome: i.localNome, horarioInicio: i.horarioInicio?.toISOString().slice(11, 16) ?? null })) })),
      } : null;
      return {
        id: p.id, op: op.id, revisao: p.roteiro?.revisao ?? null,
        inicial: !p.roteiro && !p.propostas.length,
        contexto: { dadosIniciais: p.dadosIniciais, roteiroSalvo: roteiro, propostaPendente: valida ? pendente.conteudo : null,
          historico: p.mensagens.slice(-20).map(({ papel, texto }) => ({ papel, texto })),
          mensagem: id ? entrada.mensagem : "Crie a primeira versão do roteiro.",
        },
      };
    });
    if (reserva.repetida) return obter(usuarioId, reserva.id);
    try {
      const resposta = await gerar(reserva.contexto, reserva.inicial);
      await db.$transaction(async (tx) => {
        const p = await bloquear(tx, usuarioId, reserva.id);
        if (p.operacaoAtual !== reserva.op) throw falha(409, "Esta geração expirou; atualize o planejamento.");
        if (resposta.proposta) {
          const conteudo = validarProposta(resposta.proposta);
          // Initial generation cannot change the form's constraints.
          if (!id && JSON.stringify(validarViagem(conteudo)) !== JSON.stringify(validarViagem(reserva.contexto.dadosIniciais))) {
            throw falha(502, "A IA alterou os dados informados. Tente gerar novamente.");
          }
          await tx.propostaIa.updateMany({ where: { planejamentoId: p.id, estado: "pendente" }, data: { estado: "substituida" } });
          await tx.propostaIa.create({ data: { planejamentoId: p.id, conteudo, resumo: resposta.resposta, revisaoBase: reserva.revisao } });
        }
        await tx.mensagemIa.create({ data: { planejamentoId: p.id, papel: "assistente", texto: resposta.resposta } });
        await tx.planejamentoIa.update({ where: { id: p.id }, data: { gerandoAte: null, operacaoAtual: null } });
        await tx.operacaoIa.update({ where: { id: reserva.op }, data: { estado: "concluida" } });
      });
    } catch (error) {
      const mensagem = error.status ? error.message : "Não foi possível salvar a resposta da IA. Seu roteiro foi preservado.";
      await db.$transaction(async (tx) => {
        await tx.planejamentoIa.updateMany({ where: { id: reserva.id, operacaoAtual: reserva.op }, data: { gerandoAte: null, operacaoAtual: null } });
        await tx.operacaoIa.update({ where: { id: reserva.op }, data: { estado: "falhou", erro: mensagem.slice(0, 255) } });
      });
      throw Object.assign(falha(error.status || 503, mensagem), { planejamentoId: reserva.id, novaTentativa: true });
    }
    return obter(usuarioId, reserva.id);
  }

  async function aplicar(usuarioId, id, propostaId) {
    return db.$transaction(async (tx) => {
      const p = await bloquear(tx, usuarioId, id);
      livre(p);
      const proposta = await tx.propostaIa.findFirst({ where: { id: propostaId, planejamentoId: id } });
      if (!proposta) throw falha(404, "Proposta não encontrada.");
      if (proposta.estado === "aplicada") return p.roteiro;
      if (proposta.estado !== "pendente") throw falha(409, "Esta proposta não está mais pendente.");
      const conteudo = validarProposta(proposta.conteudo);
      const { titulo, descricao, cidades, pessoas, dataIda, dataVolta, dias } = conteudo;
      const dados = { titulo, descricao, cidades, pessoas, dataIda: dataCivil(dataIda), dataVolta: dataCivil(dataVolta), destino: cidades.map((c) => c.nome).join(" → ").slice(0, 255) };
      let roteiroId = p.roteiroId;
      if (roteiroId) {
        const resultado = await tx.roteiro.updateMany({ where: { id: roteiroId, usuarioId, revisao: proposta.revisaoBase }, data: { ...dados, revisao: { increment: 1 } } });
        if (!resultado.count) throw falha(409, "O roteiro foi editado depois desta proposta. Peça ao chat uma proposta atualizada.");
        await tx.diaDoRoteiro.deleteMany({ where: { roteiroId } });
      } else {
        const novo = await tx.roteiro.create({ data: { ...dados, usuarioId, publico: false, revisao: 1 } });
        roteiroId = novo.id;
        await tx.planejamentoIa.update({ where: { id }, data: { roteiroId } });
      }
      for (const dia of dias) {
        await tx.diaDoRoteiro.create({ data: {
          roteiroId, numeroDia: dia.numeroDia, titulo: dia.titulo, cidadePrincipal: cidadeLabel(cidades[dia.cidadeIndice]),
          itens: { create: dia.itens.map((i) => ({ ...i, horarioInicio: i.horarioInicio ? new Date(`1970-01-01T${i.horarioInicio}:00.000Z`) : null })) },
        } });
      }
      await tx.propostaIa.update({ where: { id: propostaId }, data: { estado: "aplicada" } });
      await tx.planejamentoIa.update({ where: { id }, data: { atualizadoEm: new Date() } });
      return tx.roteiro.findUnique({ where: { id: roteiroId }, include: include.roteiro.include });
    }, { timeout: 15000 });
  }

  async function descartar(usuarioId, id, propostaId) {
    await db.$transaction(async (tx) => {
      const p = await bloquear(tx, usuarioId, id);
      livre(p);
      const proposta = await tx.propostaIa.findFirst({ where: { id: propostaId, planejamentoId: id } });
      if (!proposta) throw falha(404, "Proposta não encontrada.");
      if (!["pendente", "descartada"].includes(proposta.estado)) throw falha(409, "Esta proposta não pode ser descartada.");
      await tx.propostaIa.update({ where: { id: propostaId }, data: { estado: "descartada" } });
    });
    return obter(usuarioId, id);
  }

  async function excluir(usuarioId, id) {
    await db.$transaction(async (tx) => {
      const p = await bloquear(tx, usuarioId, id);
      livre(p);
      await tx.planejamentoIa.delete({ where: { id: p.id } });
    });
  }

  const listar = (usuarioId) => db.planejamentoIa.findMany({ where: { usuarioId }, orderBy: { atualizadoEm: "desc" }, select: {
    id: true, roteiroId: true, dadosIniciais: true, atualizadoEm: true, gerandoAte: true,
    roteiro: { select: { titulo: true } }, propostas: { where: { estado: "pendente" }, select: { conteudo: true }, take: 1 },
  } });
  return { obter, listar, gerarProposta, aplicar, descartar, excluir };
}

export const planejamentoIa = criarServicoIa();
