const express = require('express');
const { Pool } = require('pg'); // Conector do PostgreSQL
const bcrypt = require('bcrypt'); // Biblioteca para criptografar as senhas
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Permite que o seu HTML acesse esta API

// Configuração da conexão com o Banco de Dados (PostgreSQL)
const pool = new Pool({
    user: 'seu_usuario_bd',
    host: 'localhost',
    database: 'fonoclinica_db',
    password: 'sua_senha_bd',
    port: 5432,
});

// --- ROTA 1: CADASTRO DE NOVO PACIENTE (Área Pública) ---
app.post('/api/cadastro-paciente', async (req, res) => {
    const { nome, email, senha, telefone, data_nascimento, cpf, nome_responsavel } = req.body;

    try {
        // 1. Criptografa a senha antes de salvar (Segurança e LGPD)
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // 2. Insere na tabela genérica de USUARIOS primeiro
        const novoUsuario = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, telefone, tipo_usuario) 
             VALUES ($1, $2, $3, $4, 'paciente') RETURNING id_usuario`,
            [nome, email, senhaHash, telefone]
        );

        const idUsuarioCriado = novoUsuario.rows[0].id_usuario;

        // 3. Insere os dados específicos na tabela de PACIENTES usando o ID gerado acima
        await pool.query(
            `INSERT INTO pacientes (id_usuario, data_nascimento, cpf, nome_responsavel) 
             VALUES ($1, $2, $3, $4)`,
            [idUsuarioCriado, data_nascimento, cpf, nome_responsavel]
        );

        res.status(201).json({ mensagem: 'Paciente cadastrado com sucesso!' });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar o paciente. Verifique os dados ou se o e-mail/CPF já existem.' });
    }
});

// --- ROTA 2: SALVAR O DIÁRIO DO PACIENTE (Área do Paciente) ---
app.post('/api/diario', async (req, res) => {
    // No mundo real, o id_paciente viria do Token de Login (JWT), aqui pegamos do corpo para simplificar
    const { id_paciente, exercicios_concluidos, nivel_dificuldade, observacoes_progresso } = req.body;

    try {
        await pool.query(
            `INSERT INTO diario_paciente (id_paciente, exercicios_concluidos, nivel_dificuldade, observacoes_progresso) 
             VALUES ($1, $2, $3, $4)`,
            [id_paciente, exercicios_concluidos, nivel_dificuldade, observacoes_progresso]
        );

        res.status(201).json({ mensagem: 'Diário atualizado! Seu fonoaudiólogo já pode visualizar.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar o diário.' });
    }
});

// Iniciando o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor da FonoClínica rodando na porta 3000 🚀');
});
