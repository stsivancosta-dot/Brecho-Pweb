const avaliacaoService = require("../services/avaliacao-service");

async function create(request, response) {
  const { alunoId, anuncioId, estrelas, comentario } = request.body || {};
  return response.status(201).json(
    await avaliacaoService.createAvaliacao(request.aluno.id, {
      alunoId,
      anuncioId,
      estrelas,
      comentario
    })
  );
}

async function listByAluno(request, response) {
  return response.status(200).json({
    dados: await avaliacaoService.listAvaliacoes(request.params.alunoId)
  });
}

async function toggleFixar(request, response) {
  return response.status(200).json(
    await avaliacaoService.toggleFixar(request.params.id, request.aluno.id)
  );
}

async function summary(request, response) {
  return response.status(200).json(
    await avaliacaoService.getMediaAvaliacoes(request.params.alunoId)
  );
}

module.exports = {
  create,
  listByAluno,
  toggleFixar,
  summary
};
