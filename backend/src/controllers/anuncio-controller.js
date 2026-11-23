const anuncioService = require("../services/anuncio-service");

async function list(request, response) {
  return response.status(200).json(await anuncioService.listAnnouncements(request.query));
}
async function get(request, response) {
  return response.status(200).json(await anuncioService.getAnnouncement(request.params.id));
}
async function create(request, response) {
  const filename = request.file ? request.file.filename : null;
  return response.status(201).json(
    await anuncioService.createAnnouncement(request.aluno.id, request.body || {}, filename)
  );
}
async function update(request, response) {
  const filename = request.file ? request.file.filename : null;
  return response.status(200).json(
    await anuncioService.updateAnnouncement(request.params.id, request.aluno.id, request.body || {}, filename)
  );
}
async function remove(request, response) {
  await anuncioService.cancelAnnouncement(request.params.id, request.aluno.id);
  return response.status(204).send();
}
async function mine(request, response) {
  return response.status(200).json({ dados: await anuncioService.listMyAnnouncements(request.aluno.id, request.query.status) });
}

module.exports = { create, get, list, mine, remove, update };
