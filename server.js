const express = require('express');
const { Pool } = require('pg'); 
const bcrypt = require('bcrypt'); 
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); 

// Configuração da conexão com o Banco de Dados (PostgreSQL)
const pool = new Pool({
    user: 'postgres',          
    host: 'localhost',
    database: 'fonoclinica_db', 
    password: '',               // Deixe vazio ou coloque sua senha se tiver criado uma
    port: 5432,
});

// ==================== ROTA 1: CADASTRO DE NOVO PACIENTE ====================
app.post('/api/cadastro-paciente', async (req, res) => {
    const { nome, email, senha, telefone, data_nascimento, cpf, nome_responsavel } = req.body;

    try {
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // 1. Insere na tabela USUARIOS (usando o ENUM 'paciente')
        const novoUsuario = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, telefone, tipo_usuario) 
             VALUES ($1, $2, $3, $4, 'paciente') RETURNING id_usuario`,
            [nome, email, senhaHash, telefone]
        );

        const idUsuarioCriado = novoUsuario.rows[0].id_usuario;

        // 2. Insere na tabela PACIENTES
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

// ==================== ROTA 2: SALVAR O DIÁRIO DO PACIENTE ====================
app.post('/api/diario', async (req, res) => {
    // Pegando o id_paciente real da tabela 'pacientes'
    const { id_paciente, exercicios_concluidos, nivel_dificuldade, observacoes_progresso } = req.body;

    try {
        // Convertendo o valor recebido para Boolean para bater com seu banco (DEFAULT FALSE)
        const concluiu = exercicios_concluidos === true || exercicios_concluidos === 'true';

        await pool.query(
            `INSERT INTO diario_paciente (id_paciente, exercicios_concluidos, nivel_dificuldade, observacoes_progresso) 
             VALUES ($1, $2, $3, $4)`,
            [id_paciente, concluiu, nivel_dificuldade, observacoes_progresso]
        );

        res.status(201).json({ mensagem: 'Diário atualizado! Seu fonoaudiólogo já pode visualizar.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar o diário.' });
    }
});

// ==================== ROTA 3: PACIENTE SOLICITAR AGENDAMENTO (POST) ====================
app.post('/api/agendamentos', async (req, res) => {
    const id_paciente = 1;      // ID padrão do Pedro na tabela 'pacientes'
    const id_profissional = 1;  // ID padrão do Dr. Alexandre na tabela 'profissionais'
    const { data_consulta, horario, observacoes } = req.body;

    const data_hora_agendamento = `${data_consulta} ${horario}:00`;
    const status_inicial = 'agendado'; // Ajustado para o seu ENUM status_consulta_enum

    // Ajustado nomes das colunas para bater com sua tabela: 'observacoes_agendamento'
    const query = `
        INSERT INTO consultas_agenda (id_paciente, id_profissional, data_hora, status, observacoes_agendamento) 
        VALUES ($1, $2, $3, $4, $5)
    `;

    try {
        await pool.query(query, [id_paciente, id_profissional, data_hora_agendamento, status_inicial, observacoes]);
        
        return res.status(201).json({ 
            message: "Solicitação de agendamento enviada com sucesso!"
        });
    } catch (erro) {
        console.error("Erro ao salvar agendamento no banco:", erro);
        return res.status(500).json({ error: "Erro interno ao processar o agendamento." });
    }
});

// ==================== ROTA 4: FONOAUDIÓLOGO VER OS COMPROMISSOS (GET) ====================
app.get('/api/profissional/agendamentos', async (req, res) => {
    const id_profissional = 1; // ID do Dr. Alexandre na tabela 'profissionais'

    // Query adaptada para fazer a ponte correta entre consultas -> pacientes -> usuarios (para pegar o nome)
    const query = `
        SELECT 
            c.id_consulta,
            u_paciente.nome AS nome_paciente,
            c.data_hora,
            c.status,
            c.observacoes_agendamento AS observacoes
        FROM consultas_agenda c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
        JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id_usuario
        WHERE c.id_profissional = $1
        ORDER BY c.data_hora ASC
    `;

    try {
        const resultado = await pool.query(query, [id_profissional]);
        return res.status(200).json(resultado.rows);
    } catch (erro) {
        console.error("Erro ao buscar agenda do profissional:", erro);
        return res.status(500).json({ error: "Erro interno ao buscar compromissos." });
    }
});

// Iniciando o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor da FonoClínica rodando na porta 3000 🚀');
});

// Iniciando o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor da FonoClínica rodando na porta 3000 🚀');
});
