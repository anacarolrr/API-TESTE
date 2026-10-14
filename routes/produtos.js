
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/produtos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM produtos');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({
            error: 'Erro ao buscar produtos',
            details: error.message
        });
    }
});

router.post('/produtos', async (req, res) => {
    const {
        nome,
        valor,
        quantidade,
        categoria,
        unidade_medida
    } = req.body;

    // Validação dos campos obrigatórios
    if (
        !nome ||
        valor == null ||
        quantidade == null ||
        !unidade_medida
    ) {
        return res.status(400).json({
            error: 'Campos obrigatórios: nome, valor, quantidade e unidade_medida'
        });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO produtos
            (nome, valor, quantidade, categoria, unidade_medida)
            VALUES (?, ?, ?, ?, ?)`,
            [
                nome,
                valor,
                quantidade,
                categoria || null,
                unidade_medida
            ]
        );

        res.status(201).json({
            id: result.insertId,
            nome,
            valor,
            quantidade,
            categoria: categoria || null,
            unidade_medida
        });

    } catch (error) {
        console.error('Erro ao criar produto:', error);

        res.status(500).json({
            error: 'Erro ao criar produto',
            details: error.message
        });
    }
});

module.exports = router;
