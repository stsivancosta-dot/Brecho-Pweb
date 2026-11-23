const { Router } = require("express");

const auth = require("../middlewares/auth");
const asyncHandler = require("../middlewares/async-handler");
const { uploadPerfil, uploadAnuncioMulti } = require("../middlewares/upload");
const authController = require("../controllers/auth-controller");
const anuncioController = require("../controllers/anuncio-controller");
const reservaController = require("../controllers/reserva-controller");
const pedidoController = require("../controllers/pedido-controller");
const avaliacaoController = require("../controllers/avaliacao-controller");
const meController = require("../controllers/me-controller");
const indicadorController = require("../controllers/indicador-controller");

const apiRouter = Router();

apiRouter.post("/auth/login", asyncHandler(authController.loginController));
apiRouter.use(auth);

// Perfil
apiRouter.get("/me", authController.meController);
apiRouter.get("/me/perfil", asyncHandler(meController.profile));
apiRouter.patch("/me/foto", uploadPerfil.single("foto"), asyncHandler(meController.uploadFotoPerfil));

// Anúncios (suporta fotos únicas ou múltiplas para carrossel)
apiRouter.get("/anuncios", asyncHandler(anuncioController.list));
apiRouter.get("/anuncios/:id", asyncHandler(anuncioController.get));
apiRouter.post("/anuncios", uploadAnuncioMulti, asyncHandler(anuncioController.create));
apiRouter.patch("/anuncios/:id", uploadAnuncioMulti, asyncHandler(anuncioController.update));
apiRouter.delete("/anuncios/:id", asyncHandler(anuncioController.remove));
apiRouter.get("/me/anuncios", asyncHandler(anuncioController.mine));

// Sistema de Pedidos de Interesse (novo fluxo simultâneo)
apiRouter.post("/anuncios/:id/pedidos", asyncHandler(pedidoController.create));
apiRouter.patch("/pedidos/:id/aceitar", asyncHandler(pedidoController.aceitar));
apiRouter.patch("/pedidos/:id/recusar", asyncHandler(pedidoController.recusar));
apiRouter.patch("/pedidos/:id/concluir", asyncHandler(pedidoController.concluir));
apiRouter.patch("/pedidos/:id/cancelar", asyncHandler(pedidoController.cancelar));
apiRouter.get("/me/pedidos", asyncHandler(pedidoController.mine));
apiRouter.get("/me/pedidos-recebidos", asyncHandler(pedidoController.received));

// Sistema de Avaliações e Comentários (1 a 5 estrelas)
apiRouter.post("/avaliacoes", asyncHandler(avaliacaoController.create));
apiRouter.get("/alunos/:alunoId/avaliacoes", asyncHandler(avaliacaoController.listByAluno));
apiRouter.get("/alunos/:alunoId/avaliacoes/resumo", asyncHandler(avaliacaoController.summary));
apiRouter.patch("/avaliacoes/:id/fixar", asyncHandler(avaliacaoController.toggleFixar));

// Reservas legadas mantidas para compatibilidade
apiRouter.post("/anuncios/:id/reservas", asyncHandler(reservaController.create));
apiRouter.patch("/reservas/:id/confirmacao", asyncHandler(reservaController.confirm));
apiRouter.patch("/reservas/:id/cancelamento", asyncHandler(reservaController.cancel));
apiRouter.get("/me/reservas", asyncHandler(reservaController.mine));
apiRouter.get("/me/reservas-recebidas", asyncHandler(reservaController.received));

// Histórico e indicadores
apiRouter.get("/me/negociacoes", asyncHandler(meController.negotiations));
apiRouter.get("/indicadores", asyncHandler(indicadorController.get));

module.exports = apiRouter;
