const { Op } = require("sequelize");
const { getDatabase } = require("../models");

async function expireDueReservations(transaction) {
  const { Reserva, Anuncio } = getDatabase();
  const now = new Date();
  const reservations = await Reserva.findAll({
    where: { status: "ATIVA", expira_em: { [Op.lte]: now } },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  for (const reservation of reservations) {
    await reservation.update({ status: "EXPIRADA", encerrado_em: now }, { transaction });
    await Anuncio.update(
      { status: "DISPONIVEL" },
      { where: { id: reservation.anuncio_id, status: "RESERVADO" }, transaction }
    );
  }
  return reservations.length;
}

async function expireDueReservationsNow() {
  const { sequelize } = getDatabase();
  return sequelize.transaction((transaction) => expireDueReservations(transaction));
}

module.exports = { expireDueReservations, expireDueReservationsNow };
