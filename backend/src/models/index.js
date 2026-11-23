const { Sequelize } = require("sequelize");

const { getDatabaseConfig } = require("../config/environment");
const defineAluno = require("./aluno");
const defineAnuncio = require("./anuncio");
const defineReserva = require("./reserva");
const definePedidoInteresse = require("./pedido-interesse");
const defineAvaliacao = require("./avaliacao");

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
  const PedidoInteresse = definePedidoInteresse(sequelize);
  const Avaliacao = defineAvaliacao(sequelize);

  // Relacionamentos existentes mantidos
  Aluno.hasMany(Anuncio, { foreignKey: "autor_id", as: "anuncios" });
  Anuncio.belongsTo(Aluno, { foreignKey: "autor_id", as: "autor" });

  Aluno.hasMany(Reserva, { foreignKey: "interessado_id", as: "reservas" });
  Reserva.belongsTo(Aluno, { foreignKey: "interessado_id", as: "interessado" });

  Anuncio.hasMany(Reserva, { foreignKey: "anuncio_id", as: "reservas" });
  Reserva.belongsTo(Anuncio, { foreignKey: "anuncio_id", as: "anuncio" });

  // Novos relacionamentos: Pedidos de interesse
  Aluno.hasMany(PedidoInteresse, { foreignKey: "interessado_id", as: "pedidosInteresse" });
  PedidoInteresse.belongsTo(Aluno, { foreignKey: "interessado_id", as: "interessado" });

  Anuncio.hasMany(PedidoInteresse, { foreignKey: "anuncio_id", as: "pedidosInteresse" });
  PedidoInteresse.belongsTo(Anuncio, { foreignKey: "anuncio_id", as: "anuncio" });

  // Novos relacionamentos: Avaliações
  Aluno.hasMany(Avaliacao, { foreignKey: "aluno_id", as: "avaliacoesRecebidas" });
  Avaliacao.belongsTo(Aluno, { foreignKey: "aluno_id", as: "aluno" });

  Aluno.hasMany(Avaliacao, { foreignKey: "autor_id", as: "avaliacoesFeitas" });
  Avaliacao.belongsTo(Aluno, { foreignKey: "autor_id", as: "autor" });

  Anuncio.hasMany(Avaliacao, { foreignKey: "anuncio_id", as: "avaliacoes" });
  Avaliacao.belongsTo(Anuncio, { foreignKey: "anuncio_id", as: "anuncio" });

  models = { Aluno, Anuncio, Reserva, PedidoInteresse, Avaliacao };
  return { sequelize, ...models };
}

module.exports = { getDatabase };
