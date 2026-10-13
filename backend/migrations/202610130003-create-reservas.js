"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservas", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      anuncio_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "anuncios", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      interessado_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "alunos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      status: {
        type: Sequelize.ENUM("ATIVA", "CONFIRMADA", "EXPIRADA", "CANCELADA"),
        allowNull: false,
        defaultValue: "ATIVA"
      },
      reservado_em: { type: Sequelize.DATE, allowNull: false },
      expira_em: { type: Sequelize.DATE, allowNull: false },
      confirmado_em: { type: Sequelize.DATE, allowNull: true },
      encerrado_em: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex("reservas", ["interessado_id", "status"]);
    await queryInterface.addIndex("reservas", ["anuncio_id", "status"]);
    await queryInterface.addIndex("reservas", ["anuncio_id"], {
      unique: true,
      where: { status: "ATIVA" },
      name: "reservas_anuncio_ativa_unica"
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("reservas");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservas_status"');
  }
};
