const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const { getDatabaseConfig, getServerConfig } = require("../src/config/environment");
const errorHandler = require("../src/middlewares/error-handler");
const { withServer } = require("./http-server");

test("rota inexistente retorna erro JSON padronizado", async () => {
  await withServer(app, async (baseUrl) => {
    const response = await fetch(baseUrl + "/rota-inexistente");

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      erro: {
        codigo: "ROTA_NAO_ENCONTRADA",
        mensagem: "A rota solicitada não foi encontrada."
      }
    });
  });
});

test("configuração valida porta e variáveis de banco", () => {
  assert.deepEqual(getServerConfig({ PORT: "3001" }), { port: 3001 });
  assert.throws(() => getServerConfig({ PORT: "porta" }), /PORT/);
  assert.throws(() => getDatabaseConfig({}), /DB_HOST/);

  assert.deepEqual(
    getDatabaseConfig({
      DB_HOST: "localhost",
      DB_PORT: "5432",
      DB_NAME: "brecho_test",
      DB_USER: "postgres",
      DB_PASSWORD: "segredo"
    }),
    {
      host: "localhost",
      port: 5432,
      database: "brecho_test",
      username: "postgres",
      password: "segredo"
    }
  );
});

test("middleware converte erro conhecido em resposta JSON", () => {
  const response = {
    headersSent: false,
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  const error = Object.assign(new Error("Entrada inválida."), {
    status: 400,
    code: "ENTRADA_INVALIDA"
  });

  errorHandler(error, {}, response, () => {});

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    erro: {
      codigo: "ENTRADA_INVALIDA",
      mensagem: "Entrada inválida."
    }
  });
});
