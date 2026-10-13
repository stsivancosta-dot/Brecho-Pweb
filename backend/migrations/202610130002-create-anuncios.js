"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("anuncios", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      autor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "alunos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      item: { type: Sequelize.STRING(120), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: false },
      categoria: {
        type: Sequelize.ENUM("UNIFORME", "MATERIAL_ESCOLAR", "LIVRO", "ELETRONICO", "OUTRO"),
        allowNull: false
      },
      estado_conservacao: { type: Sequelize.ENUM("NOVO", "BOM", "USADO"), allowNull: false },
      preco: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM("DISPONIVEL", "RESERVADO", "CONCLUIDO", "CANCELADO"),
        allowNull: false,
        defaultValue: "DISPONIVEL"
      },
      concluido_em: { type: Sequelize.DATE, allowNull: true },
      cancelado_em: { type: Sequelize.DATE, allowNull: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });
    await queryInterface.sequelize.query(
      "ALTER TABLE anuncios ADD CONSTRAINT anuncios_preco_nao_negativo CHECK (preco >= 0)"
    );
    await queryInterface.addIndex("anuncios", ["status", "categoria", "estado_conservacao"]);
    await queryInterface.addIndex("anuncios", ["autor_id", "status"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("anuncios");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_anuncios_categoria"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_anuncios_estado_conservacao"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_anuncios_status"');
  }
};
