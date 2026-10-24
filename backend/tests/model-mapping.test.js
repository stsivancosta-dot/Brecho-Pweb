const test = require("node:test");
const assert = require("node:assert/strict");
const { Sequelize } = require("sequelize");

const defineAnuncio = require("../src/models/anuncio");

test("modelo Anuncio usa os nomes de timestamp definidos na migration", async () => {
  const sequelize = new Sequelize("postgres://usuario:senha@127.0.0.1:5432/teste", {
    dialect: "postgres",
    logging: false
  });
  const Anuncio = defineAnuncio(sequelize);

  assert.ok(Anuncio.getAttributes().criado_em);
  assert.ok(Anuncio.getAttributes().atualizado_em);
  assert.equal(Anuncio.getAttributes().criado_em.field, "criado_em");
  assert.equal(Anuncio.getAttributes().atualizado_em.field, "atualizado_em");

  await sequelize.close();
});
