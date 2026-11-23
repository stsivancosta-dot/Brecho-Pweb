const { listNegotiations, updateFotoPerfil, getProfile } = require("../services/me-service");

async function negotiations(request, response) {
  return response.status(200).json({ dados: await listNegotiations(request.aluno.id) });
}

async function profile(request, response) {
  return response.status(200).json(await getProfile(request.aluno.id));
}

async function uploadFotoPerfil(request, response) {
  if (!request.file) {
    return response.status(400).json({ erro: { codigo: "ARQUIVO_AUSENTE", mensagem: "Nenhuma imagem enviada." } });
  }
  const aluno = await updateFotoPerfil(request.aluno.id, request.file.filename);
  return response.status(200).json({ aluno });
}

module.exports = { negotiations, profile, uploadFotoPerfil };
