const { getIndicators } = require("../services/indicador-service");

async function get(request, response) {
  return response.status(200).json(await getIndicators());
}

module.exports = { get };
