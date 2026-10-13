const { Router } = require("express");

const healthRouter = Router();

healthRouter.get("/health", (request, response) => {
  return response.status(200).json({ status: "ok" });
});

module.exports = healthRouter;
