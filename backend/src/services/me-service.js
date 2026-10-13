const { getDatabase } = require("../models");
const { serializeAnuncio } = require("./serialization");

async function listNegotiations(alunoId) {
  const { Anuncio, Reserva } = getDatabase();
  const includeAuthor = [{ association: "autor", attributes: ["id", "nome", "email"] }];
  const ownAnnouncements = await Anuncio.findAll({
    where: { autor_id: alunoId, status: "CONCLUIDO" },
    include: includeAuthor,
    order: [["concluido_em", "DESC"]]
  });
  const reservations = await Reserva.findAll({
    where: { interessado_id: alunoId, status: "CONFIRMADA" },
    include: [{ association: "anuncio", required: true, where: { status: "CONCLUIDO" }, include: includeAuthor }],
    order: [["confirmado_em", "DESC"]]
  });
  return [
    ...ownAnnouncements.map((anuncio) => ({ ...serializeAnuncio(anuncio), papel: "ANUNCIANTE" })),
    ...reservations.map((reserva) => ({ ...serializeAnuncio(reserva.anuncio), papel: "INTERESSADO" }))
  ].sort((first, second) => new Date(second.concluidoEm) - new Date(first.concluidoEm));
}

module.exports = { listNegotiations };
