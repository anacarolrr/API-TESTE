const express = require('express');
const cors = require('cors');
const db=require('./db');

const app = express();
app.use(cors());
app.use(express.json());   


const produtosRouter = require('./routes/produtos');
app.use(produtosRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 
