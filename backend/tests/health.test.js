const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const { withServer } = require("./http-server");

test("GET /health retorna o estado da API", async () => {
  await withServer(app, async (baseUrl) => {
    const response = await fetch(baseUrl + "/health");

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});
