const express = require("express");

const errorHandler = require("./middlewares/error-handler");
const notFound = require("./middlewares/not-found");
const healthRouter = require("./routes/health");
const apiRouter = require("./routes/api");

const app = express();

app.use(express.json());
app.use(healthRouter);
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
