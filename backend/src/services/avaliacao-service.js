const AppError = require("../errors/app-error");
const { getDatabase } = require("../models");
const { serializeAvaliacao } = require("./serialization");

const autorInclude = [{ association: "autor", attributes: ["id", "nome", "email", "foto_perfil"] }];
const anuncioInclude = [{ association: "anuncio", attributes: ["id", "item", "categoria", "foto_url"] }];

// Criar avaliação (1 a 5 estrelas + comentário opcional)
async function createAvaliacao(autorId, { alunoId, anuncioId, estrelas, comentario }) {
  if (autorId === alunoId) {
    throw new AppError(400, "AUTOAVALIACAO_NAO_PERMITIDA", "Você não pode avaliar a si mesmo.");
  }
  const stars = Number(estrelas);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new AppError(400, "ESTRELAS_INVALIDAS", "A nota deve ser entre 1 e 5 estrelas.");
  }

  const { Aluno, Avaliacao } = getDatabase();
  const alvo = await Aluno.findByPk(alunoId);
  if (!alvo) throw new AppError(404, "ALUNO_NAO_ENCONTRADO", "Estudante a ser avaliado não foi encontrado.");

  const nova = await Avaliacao.create({
    aluno_id: alunoId,
    autor_id: autorId,
    anuncio_id: anuncioId || null,
    estrelas: stars,
    comentario: comentario ? String(comentario).trim().slice(0, 500) : null,
    fixado: false
  });

  const full = await Avaliacao.findByPk(nova.id, {
    include: [...autorInclude, ...anuncioInclude]
  });

  return serializeAvaliacao(full);
}

// Listar avaliações de um estudante
// O comentário fixado vem primeiro; em seguida por data mais recente
async function listAvaliacoes(alunoId) {
  const { Avaliacao } = getDatabase();
  const list = await Avaliacao.findAll({
    where: { aluno_id: alunoId },
    include: [...autorInclude, ...anuncioInclude],
    order: [
      ["fixado", "DESC"],
      ["criado_em", "DESC"]
    ]
  });
  return list.map(serializeAvaliacao);
}

// Fixar/desfixar um comentário no perfil do anunciante
// Apenas um comentário pode ficar fixado em destaque (substituindo o anterior)
async function toggleFixar(avaliacaoId, alunoId) {
  const { sequelize, Avaliacao } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const item = await Avaliacao.findByPk(avaliacaoId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!item) throw new AppError(404, "AVALIACAO_NAO_ENCONTRADA", "Avaliação não encontrada.");
    if (item.aluno_id !== alunoId) {
      throw new AppError(403, "SEM_AUTORIA", "Você só pode fixar comentários do seu próprio perfil.");
    }

    const novoEstado = !item.fixado;

    // Se estiver fixando, desfixa qualquer outro anterior do mesmo aluno
    if (novoEstado) {
      await Avaliacao.update(
        { fixado: false },
        { where: { aluno_id: alunoId }, transaction }
      );
    }

    await item.update({ fixado: novoEstado }, { transaction });

    const full = await Avaliacao.findByPk(item.id, {
      include: [...autorInclude, ...anuncioInclude],
      transaction
    });

    return serializeAvaliacao(full);
  });
}

// Obter média de estrelas e total
async function getMediaAvaliacoes(alunoId) {
  const { Avaliacao, sequelize } = getDatabase();
  const result = await Avaliacao.findOne({
    where: { aluno_id: alunoId },
    attributes: [
      [sequelize.fn("AVG", sequelize.col("estrelas")), "media"],
      [sequelize.fn("COUNT", sequelize.col("id")), "total"]
    ],
    raw: true
  });

  const media = result?.media ? Number(Number(result.media).toFixed(1)) : 0;
  const total = result?.total ? Number(result.total) : 0;
  return { media, total };
}

module.exports = {
  createAvaliacao,
  listAvaliacoes,
  toggleFixar,
  getMediaAvaliacoes
};
