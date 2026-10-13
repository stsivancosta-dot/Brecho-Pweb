const { login } = require("../services/auth-service");
const { serializeAluno } = require("../services/serialization");

async function loginController(request, response) {
  return response.status(200).json(await login(request.body || {}));
}

function meController(request, response) {
  return response.status(200).json({ aluno: serializeAluno(request.aluno) });
}

module.exports = { loginController, meController };
