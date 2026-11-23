const { getDatabase } = require("../models");
const { serializeAnuncio, serializeAluno } = require("./serialization");

async function listNegotiations(alunoId) {
  const { Anuncio, Reserva } = getDatabase();
  const includeAuthor = [{ association: "autor", attributes: ["id", "nome", "email", "foto_perfil"] }];
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

async function updateFotoPerfil(alunoId, filename) {
  const { Aluno } = getDatabase();
  const aluno = await Aluno.findByPk(alunoId);
  if (!aluno) throw new Error("Aluno não encontrado.");
  await aluno.update({ foto_perfil: filename });
  return serializeAluno(aluno);
}

async function getProfile(alunoId) {
  const { Aluno, Anuncio } = getDatabase();
  const aluno = await Aluno.findByPk(alunoId);
  if (!aluno) throw new Error("Aluno não encontrado.");
  const totalAtivos = await Anuncio.count({
    where: { autor_id: alunoId, status: ["DISPONIVEL", "RESERVADO"] }
  });
  const totalConcluidos = await Anuncio.count({
    where: { autor_id: alunoId, status: "CONCLUIDO" }
  });
  return {
    ...serializeAluno(aluno),
    totalAtivos,
    totalConcluidos
  };
}

module.exports = { listNegotiations, updateFotoPerfil, getProfile };
