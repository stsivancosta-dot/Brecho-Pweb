const app = require("./app");
const { getServerConfig } = require("./config/environment");
const { startReservationExpirationJob } = require("./jobs/reservation-expiration");

const { port } = getServerConfig();

app.listen(port, () => {
  console.log("API disponível em http://localhost:" + port);
  startReservationExpirationJob();
});
