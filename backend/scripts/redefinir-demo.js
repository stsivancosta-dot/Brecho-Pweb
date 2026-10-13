const bcrypt = require("bcryptjs");
const { getDatabase } = require("../src/models");

async function main() {
  const { sequelize, Aluno } = getDatabase();
  const senha = process.env.DEMO_PASSWORD;

  if (!senha || senha.length < 8 || senha === "sua_senha_de_demonstracao") {
    throw new Error("Defina uma DEMO_PASSWORD própria, com pelo menos 8 caracteres, no .env.");
  }

  try {
    await sequelize.authenticate();

    const hash = await bcrypt.hash(senha, 12);
    const [ana, bruno] = await Promise.all([
      Aluno.update({ senha_hash: hash }, { where: { email: "ana@escola.local" } }),
      Aluno.update({ senha_hash: hash }, { where: { email: "bruno@escola.local" } })
    ]);

    console.log("Ana atualizada:", ana[0] === 1);
    console.log("Bruno atualizado:", bruno[0] === 1);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error("Falha ao redefinir contas:", error.message);
  process.exitCode = 1;
});
