const AppError = require("../errors/app-error");
const { getDatabase } = require("../models");
const { expireDueReservations } = require("./expiration-service");
const { serializeReserva } = require("./serialization");
const { optionalReservationStatus } = require("./validation");

function expiresInThreeDays(now) {
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 3);
  return expires;
}

async function createReservation(anuncioId, interessadoId) {
  const { sequelize, Anuncio, Reserva } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    await expireDueReservations(transaction);
    const announcement = await Anuncio.findByPk(anuncioId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!announcement) throw new AppError(404, "ANUNCIO_NAO_ENCONTRADO", "Anúncio não encontrado.");
    if (announcement.autor_id === interessadoId) {
      throw new AppError(403, "AUTORRESERVA_NAO_PERMITIDA", "Você não pode reservar o próprio anúncio.");
    }
    if (announcement.status !== "DISPONIVEL") {
      throw new AppError(409, "RESERVA_NAO_DISPONIVEL", "Este anúncio não está disponível para reserva.");
    }
    const now = new Date();
    const reservation = await Reserva.create(
      {
        anuncio_id: anuncioId,
        interessado_id: interessadoId,
        status: "ATIVA",
        reservado_em: now,
        expira_em: expiresInThreeDays(now)
      },
      { transaction }
    );
    await announcement.update({ status: "RESERVADO" }, { transaction });
    return serializeReserva(reservation);
  });
}

async function confirmReservation(reservaId, authorId) {
  const { sequelize, Reserva, Anuncio } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    await expireDueReservations(transaction);
    const reservation = await Reserva.findByPk(reservaId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!reservation) throw new AppError(404, "RESERVA_NAO_ENCONTRADA", "Reserva não encontrada.");
    const announcement = await Anuncio.findByPk(reservation.anuncio_id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!announcement || announcement.autor_id !== authorId) {
      throw new AppError(403, "SEM_AUTORIA", "Você não pode confirmar esta reserva.");
    }
    if (reservation.status !== "ATIVA" || announcement.status !== "RESERVADO") {
      throw new AppError(400, "RESERVA_NAO_CONFIRMAVEL", "Esta reserva não pode ser confirmada.");
    }
    const now = new Date();
    await reservation.update({ status: "CONFIRMADA", confirmado_em: now, encerrado_em: now }, { transaction });
    await announcement.update({ status: "CONCLUIDO", concluido_em: now }, { transaction });
    return serializeReserva(reservation);
  });
}

async function listMyReservations(interessadoId, status) {
  const allowedStatus = optionalReservationStatus(status);
  const { Reserva } = getDatabase();
  const where = { interessado_id: interessadoId };
  if (allowedStatus) where.status = allowedStatus;
  const reservations = await Reserva.findAll({
    where,
    include: [{ association: "anuncio", include: [{ association: "autor", attributes: ["id", "nome", "email"] }] }],
    order: [["reservado_em", "DESC"]]
  });
  return reservations.map((reservation) => ({
    ...serializeReserva(reservation),
    anuncio: reservation.anuncio ? require("./serialization").serializeAnuncio(reservation.anuncio) : null
  }));
}

async function listReceivedReservations(authorId, status) {
  const allowedStatus = optionalReservationStatus(status);
  const { Reserva } = getDatabase();
  const where = {};
  if (allowedStatus) where.status = allowedStatus;
  const reservations = await Reserva.findAll({
    where,
    include: [{
      association: "anuncio",
      required: true,
      where: { autor_id: authorId },
      include: [{ association: "autor", attributes: ["id", "nome", "email"] }]
    }, { association: "interessado", attributes: ["id", "nome", "email"] }],
    order: [["reservado_em", "DESC"]]
  });
  return reservations.map((reservation) => ({
    ...serializeReserva(reservation),
    anuncio: reservation.anuncio ? require("./serialization").serializeAnuncio(reservation.anuncio) : null,
    interessado: reservation.interessado ? require("./serialization").serializeAluno(reservation.interessado) : null
  }));
}

module.exports = {
  confirmReservation,
  createReservation,
  expiresInThreeDays,
  listMyReservations,
  listReceivedReservations
};
