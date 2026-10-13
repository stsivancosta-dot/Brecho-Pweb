const { Op, Transaction } = require("sequelize");
const AppError = require("../errors/app-error");
const { getDatabase } = require("../models");
const { expireDueReservationsNow } = require("./expiration-service");
const { serializeAnuncio } = require("./serialization");
const { announcementPayload, optionalAnnouncementStatus } = require("./validation");

const authorInclude = [{ association: "autor", attributes: ["id", "nome", "email"] }];

async function listAnnouncements(query) {
  await expireDueReservationsNow();
  const { Anuncio } = getDatabase();
  const page = Math.max(Number.parseInt(query.pagina, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limite, 10) || 12, 1), 50);
  const where = { status: "DISPONIVEL" };
  if (query.categoria) where.categoria = query.categoria;
  if (query.estado) where.estado_conservacao = query.estado;
  if (query.busca && query.busca.trim()) {
    where[Op.or] = [
      { item: { [Op.iLike]: "%" + query.busca.trim() + "%" } },
      { descricao: { [Op.iLike]: "%" + query.busca.trim() + "%" } }
    ];
  }
  const { rows, count } = await Anuncio.findAndCountAll({
    where, include: authorInclude, order: [["criado_em", "DESC"]],
    limit, offset: (page - 1) * limit
  });
  return { dados: rows.map((anuncio) => serializeAnuncio(anuncio)), paginacao: { pagina: page, limite: limit, total: count } };
}

async function getAnnouncement(id) {
  await expireDueReservationsNow();
  const { Anuncio } = getDatabase();
  const announcement = await Anuncio.findByPk(id, { include: authorInclude });
  if (!announcement) throw new AppError(404, "ANUNCIO_NAO_ENCONTRADO", "Anúncio não encontrado.");
  return serializeAnuncio(announcement);
}

async function createAnnouncement(authorId, body) {
  const attributes = announcementPayload(body);
  const { sequelize, Aluno, Anuncio } = getDatabase();
  return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (transaction) => {
    await Aluno.findByPk(authorId, { transaction, lock: transaction.LOCK.UPDATE });
    const activeCount = await Anuncio.count({
      where: { autor_id: authorId, status: ["DISPONIVEL", "RESERVADO"] }, transaction
    });
    if (activeCount >= 5) throw new AppError(409, "LIMITE_DE_ANUNCIOS", "Limite de cinco anúncios ativos atingido.");
    const announcement = await Anuncio.create({ ...attributes, autor_id: authorId, status: "DISPONIVEL" }, { transaction });
    return serializeAnuncio(announcement, false);
  });
}

async function updateAnnouncement(id, authorId, body) {
  const attributes = announcementPayload(body, true);
  const { sequelize, Anuncio } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const announcement = await Anuncio.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!announcement) throw new AppError(404, "ANUNCIO_NAO_ENCONTRADO", "Anúncio não encontrado.");
    if (announcement.autor_id !== authorId) throw new AppError(403, "SEM_AUTORIA", "Você não pode alterar este anúncio.");
    if (announcement.status !== "DISPONIVEL") throw new AppError(400, "ANUNCIO_IMUTAVEL", "Somente anúncios disponíveis podem ser editados.");
    await announcement.update(attributes, { transaction });
    return serializeAnuncio(announcement, false);
  });
}

async function cancelAnnouncement(id, authorId) {
  const { sequelize, Anuncio, Reserva } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const announcement = await Anuncio.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!announcement) throw new AppError(404, "ANUNCIO_NAO_ENCONTRADO", "Anúncio não encontrado.");
    if (announcement.autor_id !== authorId) throw new AppError(403, "SEM_AUTORIA", "Você não pode cancelar este anúncio.");
    if (announcement.status === "CONCLUIDO" || announcement.status === "CANCELADO") {
      throw new AppError(400, "ANUNCIO_IMUTAVEL", "Este anúncio não pode ser cancelado.");
    }
    const now = new Date();
    const activeReservation = await Reserva.findOne({
      where: { anuncio_id: id, status: "ATIVA" }, transaction, lock: transaction.LOCK.UPDATE
    });
    if (activeReservation) await activeReservation.update({ status: "CANCELADA", encerrado_em: now }, { transaction });
    await announcement.update({ status: "CANCELADO", cancelado_em: now }, { transaction });
  });
}

async function listMyAnnouncements(authorId, status) {
  const allowedStatus = optionalAnnouncementStatus(status);
  const { Anuncio } = getDatabase();
  const where = { autor_id: authorId };
  if (allowedStatus) where.status = allowedStatus;
  const records = await Anuncio.findAll({ where, order: [["criado_em", "DESC"]] });
  return records.map((record) => serializeAnuncio(record, false));
}

module.exports = { cancelAnnouncement, createAnnouncement, getAnnouncement, listAnnouncements, listMyAnnouncements, updateAnnouncement };
