const test = require("node:test");
const assert = require("node:assert/strict");

const { serializePedido, serializeAvaliacao, serializeAnuncio } = require("../src/services/serialization");

test("serializePedido formata pedido e aninha interessado e anúncio", () => {
  const serialized = serializePedido({
    id: "p1",
    anuncio_id: "a1",
    interessado_id: "i1",
    mensagem: "Tenho interesse no livro!",
    status: "PENDENTE",
    criado_em: new Date("2026-11-23T10:00:00Z"),
    anuncio: {
      id: "a1",
      item: "Livro de Física",
      preco: "25.00",
      status: "DISPONIVEL",
      fotos: ["capa.jpg", "detalhe.jpg"]
    },
    interessado: {
      id: "i1",
      nome: "João Mendes",
      email: "joao@escola.local",
      foto_perfil: "joao.png"
    }
  });

  assert.equal(serialized.status, "PENDENTE");
  assert.equal(serialized.mensagem, "Tenho interesse no livro!");
  assert.equal(serialized.anuncio.item, "Livro de Física");
  assert.equal(serialized.anuncio.fotoUrl, "capa.jpg");
  assert.equal(serialized.anuncio.fotos.length, 2);
  assert.equal(serialized.interessado.nome, "João Mendes");
  assert.equal(serialized.interessado.fotoPerfil, "joao.png");
});

test("serializeAvaliacao preserva nota de estrelas e autor com foto", () => {
  const item = serializeAvaliacao({
    id: "av1",
    aluno_id: "ana-id",
    autor_id: "joao-id",
    estrelas: 5,
    comentario: "Excelente vendedora, muito prestativa!",
    fixado: true,
    criado_em: new Date(),
    autor: {
      id: "joao-id",
      nome: "João Mendes",
      email: "joao@escola.local",
      foto_perfil: "joao.png"
    }
  });

  assert.equal(item.estrelas, 5);
  assert.equal(item.fixado, true);
  assert.equal(item.autor.nome, "João Mendes");
  assert.equal(item.autor.fotoPerfil, "joao.png");
});

test("serializeAnuncio extrai primeira foto como capa e mantém lista de fotos", () => {
  const anuncio = serializeAnuncio({
    id: "a2",
    item: "Calculadora Científica",
    descricao: "Em perfeito estado",
    categoria: "ELETRONICO",
    estado_conservacao: "BOM",
    preco: "80.00",
    status: "DISPONIVEL",
    fotos: ["calc1.png", "calc2.png", "calc3.png"]
  }, false);

  assert.equal(anuncio.fotoUrl, "calc1.png");
  assert.equal(anuncio.fotos.length, 3);
  assert.equal(anuncio.precoExibicao, "R$ 80,00");
});
