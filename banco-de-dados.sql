-- Criando um tipo enumerado para os papéis dos usuários no sistema
CREATE TYPE tipo_usuario_enum AS ENUM ('administrador', 'fonoaudiologo', 'paciente');

-- Criando um tipo enumerado para o status das consultas
CREATE TYPE status_consulta_enum AS ENUM ('agendado', 'concluido', 'cancelado', 'falta');

-- 1. TABELA CENTRAL DE USUÁRIOS (Autenticação e Segurança)
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, -- Guardar SEMPRE a senha criptografada
    telefone VARCHAR(20),
    tipo_usuario tipo_usuario_enum NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

-- 2. TABELA DE PROFISSIONAIS (Fonoaudiólogos)
CREATE TABLE profissionais (
    id_profissional SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    crfa VARCHAR(20) UNIQUE NOT NULL, -- Registro do Conselho Regional de Fonoaudiologia
    especialidade VARCHAR(100),
    link_agenda_whatsapp VARCHAR(255) -- Para facilitar o contato direto se necessário
);

-- 3. TABELA DE PACIENTES
CREATE TABLE pacientes (
    id_paciente SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    data_nascimento DATE NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    nome_responsavel VARCHAR(100), -- Caso o paciente seja menor de idade
    id_profissional_responsavel INT REFERENCES profissionais(id_profissional) -- Vincula o paciente ao seu fonoaudiólogo
);

-- 4. TABELA DE CONSULTAS / AGENDA
CREATE TABLE consultas_agenda (
    id_consulta SERIAL PRIMARY KEY,
    id_paciente INT REFERENCES pacientes(id_paciente) ON DELETE SET NULL,
    id_profissional INT REFERENCES profissionais(id_profissional) ON DELETE CASCADE,
    data_hora TIMESTAMP NOT NULL,
    status status_consulta_enum DEFAULT 'agendado',
    observacoes_agendamento TEXT
);

-- 5. TABELA DE FICHAS DE ANAMNESE E PROTOCOLOS (Área Restrita do Fonoaudiólogo)
CREATE TABLE fichas_clinicas (
    id_ficha SERIAL PRIMARY KEY,
    id_paciente INT REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional INT REFERENCES profissionais(id_profissional),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    queixa_principal TEXT NOT NULL,
    historico_medico TEXT,
    protocolo_tratamento TEXT, -- Passos que o profissional desenhou para as terapias
    evolucao_clinica TEXT -- Notas que o fono adiciona a cada sessão
);

-- 6. TABELA DO DIÁRIO DE EVOLUÇÃO DO PACIENTE (Preenchido pelo Cliente, Lido pelo Fono)
CREATE TABLE diario_paciente (
    id_diario SERIAL PRIMARY KEY,
    id_paciente INT REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    data_registro DATE DEFAULT CURRENT_DATE,
    exercicios_concluidos BOOLEAN DEFAULT FALSE, -- Praticou os exercícios em casa?
    nivel_dificuldade INT CHECK (nivel_dificuldade BETWEEN 1 AND 5), -- Escala de 1 (Fácil) a 5 (Muito Difícil)
    observacoes_progresso TEXT, -- Relato livre do paciente
    lido_pelo_profissional BOOLEAN DEFAULT FALSE
);

-- 7. TABELA DE HISTÓRICO DE LOGS DA IA (Para auditoria e segurança)
CREATE TABLE historico_ia (
    id_interacao SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pergunta_paciente TEXT NOT NULL,
    resposta_ia TEXT NOT NULL
);

-- Índices para melhorar a velocidade de busca no sistema
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_agenda_data ON consultas_agenda(data_hora);
CREATE INDEX idx_diario_paciente_data ON diario_paciente(data_registro);
