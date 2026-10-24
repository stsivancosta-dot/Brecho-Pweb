"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface) {
    const password = process.env.DEMO_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error("DEMO_PASSWORD deve possuir ao menos 8 caracteres para executar a seed.");
    }
    const hash = await bcrypt.hash(password, 12);
    const now = new Date();
    await queryInterface.bulkInsert("alunos", [
      { id: "11111111-1111-4111-8111-111111111111", nome: "Ana Silva", email: "ana@escola.local", senha_hash: hash, criado_em: now, atualizado_em: now },
      { id: "22222222-2222-4222-8222-222222222222", nome: "Bruno Costa", email: "bruno@escola.local", senha_hash: hash, criado_em: now, atualizado_em: now }
    ], { ignoreDuplicates: true });
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("alunos", {
      email: ["ana@escola.local", "bruno@escola.local"]
    });
  }
};
