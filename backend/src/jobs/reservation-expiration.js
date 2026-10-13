const { expireDueReservationsNow } = require("../services/expiration-service");

function startReservationExpirationJob(intervalMs = 60 * 60 * 1000) {
  const run = async () => {
    try {
      await expireDueReservationsNow();
    } catch (error) {
      console.error("Não foi possível expirar reservas:", error.message);
    }
  };

  void run();
  return setInterval(run, intervalMs);
}

module.exports = { startReservationExpirationJob };
