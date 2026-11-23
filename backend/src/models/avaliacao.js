const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Avaliacao",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      aluno_id: { type: DataTypes.UUID, allowNull: false },
      autor_id: { type: DataTypes.UUID, allowNull: false },
      anuncio_id: { type: DataTypes.UUID, allowNull: true },
      estrelas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
      },
      comentario: { type: DataTypes.TEXT, allowNull: true },
      fixado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    {
      tableName: "avaliacoes",
      underscored: true,
      createdAt: "criado_em",
      updatedAt: "atualizado_em"
    }
  );
