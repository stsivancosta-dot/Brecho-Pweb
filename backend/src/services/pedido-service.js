const AppError = require("../errors/app-error");
const { getDatabase } = require("../models");
const { serializePedido } = require("./serialization");

const alunoInclude = [{ association: "interessado", attributes: ["id", "nome", "email", "foto_perfil"] }];
const autorInclude = [{ association: "autor", attributes: ["id", "nome", "email", "foto_perfil"] }];

// 1. Criar pedido de interesse
// Um anúncio pode receber múltiplos pedidos simultâneos sem bloquear o anúncio!
async function createPedido(anuncioId, interessadoId, mensagem = "") {
  const { sequelize, Anuncio, PedidoInteresse } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const announcement = await Anuncio.findByPk(anuncioId, { transaction });
    if (!announcement) throw new AppError(404, "ANUNCIO_NAO_ENCONTRADO", "Anúncio não encontrado.");
    if (announcement.autor_id === interessadoId) {
      throw new AppError(403, "AUTOPEDIDO_NAO_PERMITIDO", "Você não pode demonstrar interesse no seu próprio anúncio.");
    }
    if (announcement.status !== "DISPONIVEL") {
      throw new AppError(409, "ANUNCIO_INDISPONIVEL", "Este anúncio não está disponível para novos pedidos.");
    }

    // Verificar se este estudante já tem pedido pendente/aceito para o mesmo anúncio
    const existing = await PedidoInteresse.findOne({
      where: {
        anuncio_id: anuncioId,
        interessado_id: interessadoId,
        status: ["PENDENTE", "ACEITO"]
      },
      transaction
    });
    if (existing) {
      throw new AppError(409, "PEDIDO_DUPLICADO", "Você já tem um pedido em andamento para este anúncio.");
    }

    const pedido = await PedidoInteresse.create(
      {
        anuncio_id: anuncioId,
        interessado_id: interessadoId,
        mensagem: mensagem ? String(mensagem).trim().slice(0, 500) : null,
        status: "PENDENTE"
      },
      { transaction }
    );

    // O anúncio continua DISPONIVEL! Não bloqueia nem retira do brechó.
    return serializePedido(pedido);
  });
}

// 2. Anunciante aceita um pedido específico
// Organizado para o anunciante escolher usando seus próprios critérios
async function aceitarPedido(pedidoId, authorId) {
  const { sequelize, PedidoInteresse, Anuncio } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const pedido = await PedidoInteresse.findByPk(pedidoId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!pedido) throw new AppError(404, "PEDIDO_NAO_ENCONTRADO", "Pedido de interesse não encontrado.");

    const announcement = await Anuncio.findByPk(pedido.anuncio_id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!announcement || announcement.autor_id !== authorId) {
      throw new AppError(403, "SEM_AUTORIA", "Você não pode gerenciar este pedido.");
    }
    if (pedido.status !== "PENDENTE") {
      throw new AppError(400, "PEDIDO_STATUS_INVALIDO", "Apenas pedidos pendentes podem ser aceitos.");
    }

    await pedido.update({ status: "ACEITO" }, { transaction });
    return serializePedido(pedido);
  });
}

// 3. Anunciante recusa um pedido específico
async function recusarPedido(pedidoId, authorId) {
  const { sequelize, PedidoInteresse, Anuncio } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const pedido = await PedidoInteresse.findByPk(pedidoId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!pedido) throw new AppError(404, "PEDIDO_NAO_ENCONTRADO", "Pedido de interesse não encontrado.");

    const announcement = await Anuncio.findByPk(pedido.anuncio_id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!announcement || announcement.autor_id !== authorId) {
      throw new AppError(403, "SEM_AUTORIA", "Você não pode gerenciar este pedido.");
    }
    if (pedido.status !== "PENDENTE" && pedido.status !== "ACEITO") {
      throw new AppError(400, "PEDIDO_STATUS_INVALIDO", "Este pedido não pode ser recusado.");
    }

    await pedido.update({ status: "RECUSADO" }, { transaction });
    return serializePedido(pedido);
  });
}

// 4. Concluir negociação (quando entregue e finalizado com quem foi combinado)
async function concluirNegociacao(pedidoId, authorId) {
  const { sequelize, PedidoInteresse, Anuncio } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const pedido = await PedidoInteresse.findByPk(pedidoId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!pedido) throw new AppError(404, "PEDIDO_NAO_ENCONTRADO", "Pedido não encontrado.");

    const announcement = await Anuncio.findByPk(pedido.anuncio_id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!announcement || announcement.autor_id !== authorId) {
      throw new AppError(403, "SEM_AUTORIA", "Você não pode concluir este pedido.");
    }

    const now = new Date();
    await pedido.update({ status: "CONCLUIDO", concluido_em: now }, { transaction });
    await announcement.update({ status: "CONCLUIDO", concluido_em: now }, { transaction });

    // Recusar automaticamente outros pedidos que ainda estavam pendentes para este item
    await PedidoInteresse.update(
      { status: "RECUSADO" },
      {
        where: {
          anuncio_id: announcement.id,
          id: { [sequelize.Sequelize.Op.ne]: pedido.id },
          status: "PENDENTE"
        },
        transaction
      }
    );

    return serializePedido(pedido);
  });
}

// 5. Interessado desiste / cancela seu próprio pedido
async function cancelarPedido(pedidoId, interessadoId) {
  const { sequelize, PedidoInteresse } = getDatabase();
  return sequelize.transaction(async (transaction) => {
    const pedido = await PedidoInteresse.findByPk(pedidoId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!pedido) throw new AppError(404, "PEDIDO_NAO_ENCONTRADO", "Pedido não encontrado.");

    if (pedido.interessado_id !== interessadoId) {
      throw new AppError(403, "SEM_AUTORIA", "Você só pode cancelar seus próprios pedidos.");
    }
    if (pedido.status !== "PENDENTE" && pedido.status !== "ACEITO") {
      throw new AppError(400, "PEDIDO_STATUS_INVALIDO", "Este pedido não pode ser cancelado.");
    }

    await pedido.update({ status: "CANCELADO" }, { transaction });
    return serializePedido(pedido);
  });
}

// 6. Listar pedidos recebidos pelo anunciante
// Ordenados DO MAIS ANTIGO PARA O MAIS RECENTE ("ASC"), priorizando quem demonstrou interesse primeiro!
async function listReceivedPedidos(authorId, status) {
  const { PedidoInteresse } = getDatabase();
  const where = {};
  if (status && status !== "TODOS") where.status = status;

  const pedidos = await PedidoInteresse.findAll({
    where,
    include: [
      {
        association: "anuncio",
        required: true,
        where: { autor_id: authorId },
        include: autorInclude
      },
      ...alunoInclude
    ],
    // Prioriza quem pediu primeiro (mais antigo primeiro)
    order: [["criado_em", "ASC"]]
  });

  return pedidos.map(serializePedido);
}

// 7. Listar pedidos feitos pelo estudante
async function listMyPedidos(interessadoId, status) {
  const { PedidoInteresse } = getDatabase();
  const where = { interessado_id: interessadoId };
  if (status && status !== "TODOS") where.status = status;

  const pedidos = await PedidoInteresse.findAll({
    where,
    include: [
      {
        association: "anuncio",
        include: autorInclude
      },
      ...alunoInclude
    ],
    order: [["criado_em", "DESC"]]
  });

  return pedidos.map(serializePedido);
}

module.exports = {
  createPedido,
  aceitarPedido,
  recusarPedido,
  concluirNegociacao,
  cancelarPedido,
  listReceivedPedidos,
  listMyPedidos
};
