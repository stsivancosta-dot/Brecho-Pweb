"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface) {
    const password = process.env.DEMO_PASSWORD;
    if (!password || password.length < 6) {
      throw new Error("DEMO_PASSWORD deve possuir ao menos 6 caracteres para executar a seed.");
    }
    const hash = await bcrypt.hash(password, 12);
    const now = new Date();
    await queryInterface.bulkInsert("alunos", [
      {
        id: "33333333-3333-4333-8333-333333333333",
        nome: "João Mendes",
        email: "joao@escola.local",
        senha_hash: hash,
        criado_em: now,
        atualizado_em: now
      }
    ], { ignoreDuplicates: true });
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("alunos", {
      email: ["joao@escola.local"]
    });
  }
};
