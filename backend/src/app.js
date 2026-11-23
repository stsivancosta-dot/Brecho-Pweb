const path = require("path");
const express = require("express");

const errorHandler = require("./middlewares/error-handler");
const notFound = require("./middlewares/not-found");
const healthRouter = require("./routes/health");
const apiRouter = require("./routes/api");

const app = express();

app.use(express.json());

// Serve uploaded images as static files under /uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "..", "uploads")));

app.use(healthRouter);
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
