const express = require('express');
const path = require('path');
const cors = require('cors');
const produtosRouter = require('./routes/produtos');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(produtosRouter);

module.exports = app;
