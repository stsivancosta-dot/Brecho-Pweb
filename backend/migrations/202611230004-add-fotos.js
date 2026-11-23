"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("alunos", "foto_perfil", {
      type: Sequelize.STRING(260),
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn("anuncios", "foto_url", {
      type: Sequelize.STRING(260),
      allowNull: true,
      defaultValue: null
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("alunos", "foto_perfil");
    await queryInterface.removeColumn("anuncios", "foto_url");
  }
};
