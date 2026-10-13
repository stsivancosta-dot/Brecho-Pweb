function notFound(request, response) {
  return response.status(404).json({
    erro: {
      codigo: "ROTA_NAO_ENCONTRADA",
      mensagem: "A rota solicitada não foi encontrada."
    }
  });
}

module.exports = notFound;
