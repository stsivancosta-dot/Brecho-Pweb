const pedidoService = require("../services/pedido-service");

async function create(request, response) {
  const mensagem = request.body?.mensagem || "";
  return response.status(201).json(
    await pedidoService.createPedido(request.params.id, request.aluno.id, mensagem)
  );
}

async function aceitar(request, response) {
  return response.status(200).json(
    await pedidoService.aceitarPedido(request.params.id, request.aluno.id)
  );
}

async function recusar(request, response) {
  return response.status(200).json(
    await pedidoService.recusarPedido(request.params.id, request.aluno.id)
  );
}

async function concluir(request, response) {
  return response.status(200).json(
    await pedidoService.concluirNegociacao(request.params.id, request.aluno.id)
  );
}

async function cancelar(request, response) {
  return response.status(200).json(
    await pedidoService.cancelarPedido(request.params.id, request.aluno.id)
  );
}

async function mine(request, response) {
  return response.status(200).json({
    dados: await pedidoService.listMyPedidos(request.aluno.id, request.query.status)
  });
}

async function received(request, response) {
  return response.status(200).json({
    dados: await pedidoService.listReceivedPedidos(request.aluno.id, request.query.status)
  });
}

module.exports = {
  create,
  aceitar,
  recusar,
  concluir,
  cancelar,
  mine,
  received
};
