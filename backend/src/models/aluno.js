const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Aluno",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      nome: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      senha_hash: { type: DataTypes.TEXT, allowNull: false }
    },
    {
  tableName: "alunos",
  underscored: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
    }
  );
