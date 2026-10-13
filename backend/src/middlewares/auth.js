const jwt = require("jsonwebtoken");
const { getAuthConfig } = require("../config/environment");
const AppError = require("../errors/app-error");
const { getDatabase } = require("../models");

async function auth(request, response, next) {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "NAO_AUTENTICADO", "Autenticação obrigatória."));
  }
  try {
    const { jwtSecret } = getAuthConfig();
    const payload = jwt.verify(token, jwtSecret);
    const { Aluno } = getDatabase();
    const aluno = await Aluno.findByPk(payload.alunoId);
    if (!aluno) return next(new AppError(401, "SESSAO_INVALIDA", "Sessão inválida."));
    request.aluno = aluno;
    return next();
  } catch (error) {
    return next(new AppError(401, "SESSAO_INVALIDA", "Sessão inválida ou expirada."));
  }
}

module.exports = auth;
