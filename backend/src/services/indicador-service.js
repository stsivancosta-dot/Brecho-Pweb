const { getDatabase } = require("../models");
const { expireDueReservationsNow } = require("./expiration-service");

async function getIndicators() {
  await expireDueReservationsNow();
  const { sequelize } = getDatabase();
  const [byStatus, byCategory] = await Promise.all([
    sequelize.query('SELECT status, COUNT(*)::int AS total FROM anuncios GROUP BY status ORDER BY status'),
    sequelize.query('SELECT categoria, COUNT(*)::int AS total FROM anuncios GROUP BY categoria ORDER BY categoria')
  ]);
  return { totalPorStatus: byStatus[0], totalPorCategoria: byCategory[0] };
}

module.exports = { getIndicators };
