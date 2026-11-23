const { getDatabase } = require("../models");
const { serializeAnuncio, serializeAluno } = require("./serialization");
const { getMediaAvaliacoes } = require("./avaliacao-service");

async function listNegotiations(alunoId) {
  const { Anuncio, PedidoInteresse, Reserva } = getDatabase();
  const includeAuthor = [{ association: "autor", attributes: ["id", "nome", "email", "foto_perfil"] }];

  // 1. Anúncios próprios concluídos
  const ownAnnouncements = await Anuncio.findAll({
    where: { autor_id: alunoId, status: "CONCLUIDO" },
    include: includeAuthor,
    order: [["concluido_em", "DESC"]]
  });

  // 2. Pedidos de interesse concluídos onde o estudante foi o interessado
  const pedidosConcluidos = await PedidoInteresse.findAll({
    where: { interessado_id: alunoId, status: "CONCLUIDO" },
    include: [{ association: "anuncio", required: true, where: { status: "CONCLUIDO" }, include: includeAuthor }],
    order: [["concluido_em", "DESC"]]
  });

  // 3. Reservas legadas concluídas (compatibilidade retrospectiva)
  const legacyReservas = await Reserva.findAll({
    where: { interessado_id: alunoId, status: "CONFIRMADA" },
    include: [{ association: "anuncio", required: true, where: { status: "CONCLUIDO" }, include: includeAuthor }],
    order: [["confirmado_em", "DESC"]]
  });

  const allItems = [
    ...ownAnnouncements.map((anuncio) => ({ ...serializeAnuncio(anuncio), papel: "ANUNCIANTE" })),
    ...pedidosConcluidos.map((pedido) => ({ ...serializeAnuncio(pedido.anuncio), papel: "INTERESSADO" })),
    ...legacyReservas.map((reserva) => ({ ...serializeAnuncio(reserva.anuncio), papel: "INTERESSADO" }))
  ];

  // Remover duplicados se houver por ID
  const map = new Map();
  for (const item of allItems) {
    if (!map.has(item.id)) map.set(item.id, item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.concluidoEm || 0) - new Date(a.concluidoEm || 0)
  );
}

async function updateFotoPerfil(alunoId, filename) {
  const { Aluno } = getDatabase();
  const aluno = await Aluno.findByPk(alunoId);
  if (!aluno) throw new Error("Aluno não encontrado.");
  await aluno.update({ foto_perfil: filename });
  return serializeAluno(aluno);
}

async function getProfile(alunoId) {
  const { Aluno, Anuncio, PedidoInteresse, Reserva } = getDatabase();
  const aluno = await Aluno.findByPk(alunoId);
  if (!aluno) throw new Error("Aluno não encontrado.");

  // Quantidade de anúncios ativos (Disponível + Reservado)
  const totalAtivos = await Anuncio.count({
    where: { autor_id: alunoId, status: ["DISPONIVEL", "RESERVADO"] }
  });

  // Quantidade de produtos efetivamente negociados pelo estudante (como anunciante ou interessado)
  const [anunciosConcluidos, pedidosConcluidosComoComprador, reservasLegadas] = await Promise.all([
    Anuncio.count({ where: { autor_id: alunoId, status: "CONCLUIDO" } }),
    PedidoInteresse.count({ where: { interessado_id: alunoId, status: "CONCLUIDO" } }),
    Reserva.count({ where: { interessado_id: alunoId, status: "CONFIRMADA" } })
  ]);
  const totalProdutosNegociados = anunciosConcluidos + pedidosConcluidosComoComprador + reservasLegadas;

  // Quantidade de pedidos de interesse realizados pelo estudante
  const totalPedidosRealizados = await PedidoInteresse.count({
    where: { interessado_id: alunoId }
  });

  // Média e total de avaliações recebidas
  const avaliacoesSummary = await getMediaAvaliacoes(alunoId);

  return {
    ...serializeAluno(aluno),
    totalAtivos,
    totalConcluidos: totalProdutosNegociados,
    totalProdutosNegociados,
    totalPedidosRealizados,
    mediaAvaliacoes: avaliacoesSummary.media,
    totalAvaliacoes: avaliacoesSummary.total
  };
}

module.exports = { listNegotiations, updateFotoPerfil, getProfile };
