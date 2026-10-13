function errorHandler(error, request, response, next) {
  console.error("[ERRO REAL DA API]", error.name, error.message, error.stack);
  const isUniqueError = error.name === "SequelizeUniqueConstraintError";
  const status = error.status || (isUniqueError ? 409 : 500);
  const code = error.code || (isUniqueError ? "CONFLITO_DE_DADOS" : "ERRO_INTERNO");
  const message =
    status >= 500 ? "Ocorreu um erro inesperado." : error.message;

  if (response.headersSent) {
    return next(error);
  }

  return response.status(status).json({
    erro: {
      codigo: code,
      mensagem: message
    }
  });
}

module.exports = errorHandler;
