"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Adicionar fotos (JSONB) no anúncio para carrossel de fotos (primeira é a capa)
    await queryInterface.addColumn("anuncios", "fotos", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    // 2. Criar tabela de pedidos de interesse (substituindo o antigo conceito restritivo de reserva)
    await queryInterface.createTable("pedidos_interesse", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      anuncio_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "anuncios", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      interessado_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "alunos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("PENDENTE", "ACEITO", "RECUSADO", "CONCLUIDO", "CANCELADO"),
        allowNull: false,
        defaultValue: "PENDENTE"
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      concluido_em: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex("pedidos_interesse", ["anuncio_id", "status"]);
    await queryInterface.addIndex("pedidos_interesse", ["interessado_id", "status"]);
    await queryInterface.addIndex("pedidos_interesse", ["criado_em"]);

    // 3. Criar tabela de avaliações e comentários
    await queryInterface.createTable("avaliacoes", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      aluno_id: {
        // Aluno que está sendo avaliado (o anunciante)
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "alunos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      autor_id: {
        // Aluno que escreveu a avaliação
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "alunos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      anuncio_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "anuncios", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      estrelas: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      comentario: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fixado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.sequelize.query(
      "ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_estrelas_check CHECK (estrelas >= 1 AND estrelas <= 5)"
    );

    await queryInterface.addIndex("avaliacoes", ["aluno_id"]);
    await queryInterface.addIndex("avaliacoes", ["autor_id"]);
    await queryInterface.addIndex("avaliacoes", ["aluno_id", "fixado"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("avaliacoes");
    await queryInterface.dropTable("pedidos_interesse");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pedidos_interesse_status"');
    await queryInterface.removeColumn("anuncios", "fotos");
  }
};
