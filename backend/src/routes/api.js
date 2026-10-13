const { Router } = require("express");

const auth = require("../middlewares/auth");
const asyncHandler = require("../middlewares/async-handler");
const authController = require("../controllers/auth-controller");
const anuncioController = require("../controllers/anuncio-controller");
const reservaController = require("../controllers/reserva-controller");
const meController = require("../controllers/me-controller");
const indicadorController = require("../controllers/indicador-controller");

const apiRouter = Router();

apiRouter.post("/auth/login", asyncHandler(authController.loginController));
apiRouter.use(auth);
apiRouter.get("/me", authController.meController);
apiRouter.get("/anuncios", asyncHandler(anuncioController.list));
apiRouter.get("/anuncios/:id", asyncHandler(anuncioController.get));
apiRouter.post("/anuncios", asyncHandler(anuncioController.create));
apiRouter.patch("/anuncios/:id", asyncHandler(anuncioController.update));
apiRouter.delete("/anuncios/:id", asyncHandler(anuncioController.remove));
apiRouter.get("/me/anuncios", asyncHandler(anuncioController.mine));
apiRouter.post("/anuncios/:id/reservas", asyncHandler(reservaController.create));
apiRouter.patch("/reservas/:id/confirmacao", asyncHandler(reservaController.confirm));
apiRouter.get("/me/reservas", asyncHandler(reservaController.mine));
apiRouter.get("/me/reservas-recebidas", asyncHandler(reservaController.received));
apiRouter.get("/me/negociacoes", asyncHandler(meController.negotiations));
apiRouter.get("/indicadores", asyncHandler(indicadorController.get));

module.exports = apiRouter;
