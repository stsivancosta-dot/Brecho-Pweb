const { listNegotiations } = require("../services/me-service");

async function negotiations(request, response) {
  return response.status(200).json({ dados: await listNegotiations(request.aluno.id) });
}

module.exports = { negotiations };
