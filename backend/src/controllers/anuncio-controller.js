const anuncioService = require("../services/anuncio-service");

function extractUploadedFiles(request) {
  if (request.files) {
    const list = [];
    if (Array.isArray(request.files.foto) && request.files.foto.length > 0) {
      list.push(request.files.foto[0].filename);
    }
    if (Array.isArray(request.files.fotos)) {
      request.files.fotos.forEach(f => list.push(f.filename));
    }
    if (list.length > 0) return list;
  }
  if (request.file) {
    return [request.file.filename];
  }
  return null;
}

async function list(request, response) {
  return response.status(200).json(await anuncioService.listAnnouncements(request.query));
}
async function get(request, response) {
  return response.status(200).json(await anuncioService.getAnnouncement(request.params.id));
}
async function create(request, response) {
  const files = extractUploadedFiles(request);
  return response.status(201).json(
    await anuncioService.createAnnouncement(request.aluno.id, request.body || {}, files)
  );
}
async function update(request, response) {
  const files = extractUploadedFiles(request);
  return response.status(200).json(
    await anuncioService.updateAnnouncement(request.params.id, request.aluno.id, request.body || {}, files)
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
