const express = require ("express");

const app = express();

app.use(express.json());

const produtosRouter = require("./routes/produtos")
app.use(produtosRouter);

module.exports = app
