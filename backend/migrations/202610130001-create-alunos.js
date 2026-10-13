"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("alunos", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nome: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      senha_hash: { type: Sequelize.TEXT, allowNull: false },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("alunos");
  }
};
