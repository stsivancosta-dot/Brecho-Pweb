const { Router } = require("express");

const auth = require("../middlewares/auth");
const asyncHandler = require("../middlewares/async-handler");
const { uploadPerfil, uploadAnuncio } = require("../middlewares/upload");
const authController = require("../controllers/auth-controller");
const anuncioController = require("../controllers/anuncio-controller");
const reservaController = require("../controllers/reserva-controller");
const meController = require("../controllers/me-controller");
const indicadorController = require("../controllers/indicador-controller");

const apiRouter = Router();

apiRouter.post("/auth/login", asyncHandler(authController.loginController));
apiRouter.use(auth);

// Perfil
apiRouter.get("/me", authController.meController);
apiRouter.get("/me/perfil", asyncHandler(meController.profile));
apiRouter.patch("/me/foto", uploadPerfil.single("foto"), asyncHandler(meController.uploadFotoPerfil));

// Anúncios (create e update aceitam multipart/form-data com campo "foto")
apiRouter.get("/anuncios", asyncHandler(anuncioController.list));
apiRouter.get("/anuncios/:id", asyncHandler(anuncioController.get));
apiRouter.post("/anuncios", uploadAnuncio.single("foto"), asyncHandler(anuncioController.create));
apiRouter.patch("/anuncios/:id", uploadAnuncio.single("foto"), asyncHandler(anuncioController.update));
apiRouter.delete("/anuncios/:id", asyncHandler(anuncioController.remove));
apiRouter.get("/me/anuncios", asyncHandler(anuncioController.mine));

// Reservas
apiRouter.post("/anuncios/:id/reservas", asyncHandler(reservaController.create));
apiRouter.patch("/reservas/:id/confirmacao", asyncHandler(reservaController.confirm));
apiRouter.patch("/reservas/:id/cancelamento", asyncHandler(reservaController.cancel));
apiRouter.get("/me/reservas", asyncHandler(reservaController.mine));
apiRouter.get("/me/reservas-recebidas", asyncHandler(reservaController.received));

// Histórico e indicadores
apiRouter.get("/me/negociacoes", asyncHandler(meController.negotiations));
apiRouter.get("/indicadores", asyncHandler(indicadorController.get));

module.exports = apiRouter;
