const { Sequelize } = require("sequelize");

const { getDatabaseConfig } = require("../config/environment");
const defineAluno = require("./aluno");
const defineAnuncio = require("./anuncio");
const defineReserva = require("./reserva");

let sequelize;
let models;

function getDatabase() {
  if (sequelize) {
    return { sequelize, ...models };
  }

  const config = getDatabaseConfig();
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: "postgres",
    logging: false
  });

  const Aluno = defineAluno(sequelize);
  const Anuncio = defineAnuncio(sequelize);
  const Reserva = defineReserva(sequelize);

  Aluno.hasMany(Anuncio, { foreignKey: "autor_id", as: "anuncios" });
  Anuncio.belongsTo(Aluno, { foreignKey: "autor_id", as: "autor" });
  Aluno.hasMany(Reserva, { foreignKey: "interessado_id", as: "reservas" });
  Reserva.belongsTo(Aluno, { foreignKey: "interessado_id", as: "interessado" });
  Anuncio.hasMany(Reserva, { foreignKey: "anuncio_id", as: "reservas" });
  Reserva.belongsTo(Anuncio, { foreignKey: "anuncio_id", as: "anuncio" });

  models = { Aluno, Anuncio, Reserva };
  return { sequelize, ...models };
}

module.exports = { getDatabase };
