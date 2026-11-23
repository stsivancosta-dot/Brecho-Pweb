const { DataTypes } = require("sequelize");
const { STATUS_PEDIDO } = require("../constants/domain");

module.exports = (sequelize) =>
  sequelize.define(
    "PedidoInteresse",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      anuncio_id: { type: DataTypes.UUID, allowNull: false },
      interessado_id: { type: DataTypes.UUID, allowNull: false },
      mensagem: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...STATUS_PEDIDO),
        allowNull: false,
        defaultValue: "PENDENTE"
      },
      concluido_em: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: "pedidos_interesse",
      underscored: true,
      createdAt: "criado_em",
      updatedAt: "atualizado_em"
    }
  );
