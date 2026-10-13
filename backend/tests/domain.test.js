const test = require("node:test");
const assert = require("node:assert/strict");

const AppError = require("../src/errors/app-error");
const { serializeAnuncio } = require("../src/services/serialization");
const { announcementPayload } = require("../src/services/validation");
const { expiresInThreeDays } = require("../src/services/reserva-service");

test("preço zero é serializado como Troca", () => {
  assert.equal(
    serializeAnuncio({
      id: "id", item: "Livro", descricao: "Livro em bom estado", categoria: "LIVRO",
      estado_conservacao: "BOM", preco: "0", status: "DISPONIVEL"
    }, false).precoExibicao,
    "Troca"
  );
});

test("valida campos de anúncio e normaliza preço ausente", () => {
  const payload = announcementPayload({
    item: "Livro", descricao: "Livro em bom estado", categoria: "LIVRO", estadoConservacao: "BOM"
  });
  assert.equal(payload.preco, 0);
  assert.throws(
    () => announcementPayload({ item: "x", descricao: "curta", categoria: "INVALIDA", estadoConservacao: "BOM" }),
    (error) => error instanceof AppError && error.status === 400
  );
});

test("prazo de reserva é de três dias", () => {
  const start = new Date("2026-10-13T12:00:00.000Z");
  assert.equal(expiresInThreeDays(start).toISOString(), "2026-10-16T12:00:00.000Z");
});
