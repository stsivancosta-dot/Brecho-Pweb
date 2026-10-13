const { DataTypes } = require("sequelize");
const { STATUS_RESERVA } = require("../constants/domain");

module.exports = (sequelize) =>
  sequelize.define(
    "Reserva",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      anuncio_id: { type: DataTypes.UUID, allowNull: false },
      interessado_id: { type: DataTypes.UUID, allowNull: false },
      status: {
        type: DataTypes.ENUM(...STATUS_RESERVA),
        allowNull: false,
        defaultValue: "ATIVA"
      },
      reservado_em: { type: DataTypes.DATE, allowNull: false },
      expira_em: { type: DataTypes.DATE, allowNull: false },
      confirmado_em: { type: DataTypes.DATE, allowNull: true },
      encerrado_em: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: "reservas",
      underscored: true,
      timestamps: false
    }
  );
