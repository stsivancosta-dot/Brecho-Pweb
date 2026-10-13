const { DataTypes } = require("sequelize");
const {
  CATEGORIAS,
  ESTADOS_CONSERVACAO,
  STATUS_ANUNCIO
} = require("../constants/domain");

module.exports = (sequelize) =>
  sequelize.define(
    "Anuncio",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      autor_id: { type: DataTypes.UUID, allowNull: false },
      item: { type: DataTypes.STRING(120), allowNull: false },
      descricao: { type: DataTypes.TEXT, allowNull: false },
      categoria: { type: DataTypes.ENUM(...CATEGORIAS), allowNull: false },
      estado_conservacao: {
        type: DataTypes.ENUM(...ESTADOS_CONSERVACAO),
        allowNull: false
      },
      preco: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM(...STATUS_ANUNCIO),
        allowNull: false,
        defaultValue: "DISPONIVEL"
      },
      concluido_em: { type: DataTypes.DATE, allowNull: true },
      cancelado_em: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: "anuncios",
      underscored: true
    }
  );
