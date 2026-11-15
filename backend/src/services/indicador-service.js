const { fn, col, literal } = require("sequelize");
const { getDatabase } = require("../models");
const { expireDueReservationsNow } = require("./expiration-service");

async function getIndicators() {
  await expireDueReservationsNow();
  const { Anuncio } = getDatabase();
  const [byStatus, byCategory] = await Promise.all([
    Anuncio.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "total"]],
      group: ["status"],
      order: [["status", "ASC"]],
      raw: true
    }),
    Anuncio.findAll({
      attributes: ["categoria", [fn("COUNT", col("id")), "total"]],
      group: ["categoria"],
      order: [["categoria", "ASC"]],
      raw: true
    })
  ]);
  return {
    totalPorStatus: byStatus.map(r => ({ status: r.status, total: Number(r.total) })),
    totalPorCategoria: byCategory.map(r => ({ categoria: r.categoria, total: Number(r.total) }))
  };
}

module.exports = { getIndicators };
