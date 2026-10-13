const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getAuthConfig } = require("../config/environment");
const AppError = require("../errors/app-error");
const { getDatabase } = require("../models");
const { serializeAluno } = require("./serialization");

async function login({ email, senha }) {
  if (typeof email !== "string" || typeof senha !== "string") {
    throw new AppError(400, "ENTRADA_INVALIDA", "E-mail e senha são obrigatórios.");
  }
  const { Aluno } = getDatabase();
  const aluno = await Aluno.findOne({ where: { email: email.trim().toLowerCase() } });
  const valid = aluno && (await bcrypt.compare(senha, aluno.senha_hash));
  if (!valid) throw new AppError(401, "CREDENCIAIS_INVALIDAS", "E-mail ou senha inválidos.");
  const { jwtSecret } = getAuthConfig();
  const token = jwt.sign({ alunoId: aluno.id }, jwtSecret, { expiresIn: "8h" });
  return { token, aluno: serializeAluno(aluno) };
}

module.exports = { login };
