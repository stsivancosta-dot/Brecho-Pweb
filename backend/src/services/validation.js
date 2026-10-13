const { CATEGORIAS, ESTADOS_CONSERVACAO, STATUS_ANUNCIO, STATUS_RESERVA } = require("../constants/domain");
const AppError = require("../errors/app-error");

function invalid(message) {
  throw new AppError(400, "ENTRADA_INVALIDA", message);
}

function requiredText(value, label, min, max) {
  if (typeof value !== "string") invalid(label + " é obrigatório.");
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    invalid(label + " deve ter entre " + min + " e " + max + " caracteres.");
  }
  return normalized;
}

function allowed(value, values, label) {
  if (!values.includes(value)) invalid(label + " possui valor inválido.");
  return value;
}

function price(value) {
  if (value === undefined || value === null || value === "") return 0;
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) invalid("Preço deve ser um número não negativo.");
  return normalized;
}

function announcementPayload(body, partial = false) {
  const fields = {};
  const has = (name) => Object.prototype.hasOwnProperty.call(body, name);
  if (!partial || has("item")) fields.item = requiredText(body.item, "Item", 2, 120);
  if (!partial || has("descricao")) fields.descricao = requiredText(body.descricao, "Descrição", 10, 1000);
  if (!partial || has("categoria")) fields.categoria = allowed(body.categoria, CATEGORIAS, "Categoria");
  if (!partial || has("estadoConservacao")) {
    fields.estado_conservacao = allowed(body.estadoConservacao, ESTADOS_CONSERVACAO, "Estado de conservação");
  }
  if (!partial || has("preco")) fields.preco = price(body.preco);
  if (partial && Object.keys(fields).length === 0) invalid("Informe pelo menos um campo editável.");
  return fields;
}

function optionalStatus(value, values, label) {
  if (value === undefined) return undefined;
  return allowed(value, values, label);
}

module.exports = {
  announcementPayload,
  optionalAnnouncementStatus: (value) => optionalStatus(value, STATUS_ANUNCIO, "Status"),
  optionalReservationStatus: (value) => optionalStatus(value, STATUS_RESERVA, "Status")
};
