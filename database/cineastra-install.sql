-- CineAstra: instalacao unica em schema VAZIO (MySQL 8.0.16+).
-- Gerado por backend/scripts/generateInstallSql.js a partir de migrationPlan.js: 176 statements.
-- Uso no Bash: mysql --default-character-set=utf8mb4 -u root -p cineastra < cineastra-install.sql
-- O banco precisa existir. Usa exclusivamente o banco selecionado pelo cliente.
-- Nao use --force, nao reaplique em banco existente e nao apague o ledger.
-- Para atualizar banco existente, use o runner incremental e o ledger original.
-- Requer permissoes DDL, CREATE ROUTINE e EXECUTE. Nao apaga dados nem cria usuarios.
-- Exclui CREATE DATABASE/USE, seeds historicos e eventos administrados pelo DBA.
-- Checksums das fontes permanecem compativeis com o runner. Retencao: LOG_RETENTION_MODE=worker.

SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
SET SESSION autocommit = 1;

DELIMITER $$
CREATE PROCEDURE _cineastra_install()
SQL SECURITY INVOKER
BEGIN
    DECLARE install_lock_acquired INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        IF install_lock_acquired = 1 THEN
            DO RELEASE_LOCK(CONCAT(DATABASE(), ':cineastra:migrate'));
        END IF;
        RESIGNAL;
    END;
    IF DATABASE() IS NULL OR DATABASE() IN ('mysql', 'sys', 'information_schema', 'performance_schema') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Selecione um schema vazio da aplicacao.';
    END IF;
    SELECT GET_LOCK(CONCAT(DATABASE(), ':cineastra:migrate'), 0) INTO install_lock_acquired;
    IF install_lock_acquired IS NULL OR install_lock_acquired <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Outra migration esta em execucao.';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Instalacao recusada: o schema precisa estar vazio. Nenhuma tabela foi alterada.';
    END IF;
    CREATE TABLE schema_migrations (
        name VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
        checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        status ENUM('RUNNING','APPLIED') NOT NULL,
        applied_at DATETIME(3) NULL
    ) ENGINE=InnoDB;

    -- 1/176: 20261001_02_create_tables.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:1', '9940a28da82c0567f9a8caabd36e4ab6046e1a277cbaa9e0fb30d3a63cbaca11', 'RUNNING');
CREATE TABLE usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL COMMENT 'armazenar sempre com hash (bcrypt/argon2)',
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    data_nascimento DATE,
    tipo_usuario ENUM('ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR','CLIENTE') NOT NULL,
    status ENUM('ATIVO','INATIVO','BLOQUEADO','PENDENTE_VERIFICACAO') NOT NULL DEFAULT 'PENDENTE_VERIFICACAO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:1';

    -- 2/176: 20261001_02_create_tables.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:2', '4372f051cbdc2c684aaa0f1a6b6b31fb1e9e8ccaf9bc70a6cc5de0e51a92d1a7', 'RUNNING');
CREATE TABLE enderecos (
    id_endereco INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    cep VARCHAR(10),
    logradouro VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_enderecos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:2';

    -- 3/176: 20261001_02_create_tables.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:3', '704cdfc256274616756e7847fdd8016e89a6b288d9fba095e996473138ab3259', 'RUNNING');
CREATE TABLE contatos (
    id_contato INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('TELEFONE','WHATSAPP','EMAIL_SECUNDARIO') NOT NULL,
    valor VARCHAR(150) NOT NULL,
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_contatos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:3';

    -- 4/176: 20261001_02_create_tables.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:4', 'f9a90b5f2130d330bb6916e17264a0f794aae689d9763452567927f0fefe5f37', 'RUNNING');
CREATE TABLE recuperacao_senha (
    id_recuperacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiracao DATETIME NOT NULL,
    utilizado BOOLEAN DEFAULT FALSE,
    UNIQUE KEY uk_recuperacao_token (token),
    CONSTRAINT fk_recuperacao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:4';

    -- 5/176: 20261001_02_create_tables.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:5', 'f1aff461f79cd509e303921244a65a1e2a9ba3ce014874e9229c9d89bf44ba5f', 'RUNNING');
CREATE TABLE autenticacao_2fa (
    id_2fa INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    metodo ENUM('APP','SMS','EMAIL') NOT NULL DEFAULT 'APP',
    chave VARCHAR(255),
    ativo BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_2fa_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:5';

    -- 6/176: 20261001_02_create_tables.sql:6
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:6', '38b2783a654401b8ccd3e9553bda8b57e673638b8d6374e76d92fd2782a7a7be', 'RUNNING');
CREATE TABLE preferencias_usuario (
    id_preferencia INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tema ENUM('CLARO','ESCURO','SISTEMA') DEFAULT 'SISTEMA',
    tamanho_fonte ENUM('PEQUENO','MEDIO','GRANDE','MUITO_GRANDE') DEFAULT 'MEDIO',
    alto_contraste BOOLEAN DEFAULT FALSE,
    modo_acessibilidade BOOLEAN DEFAULT FALSE,
    idioma VARCHAR(10) DEFAULT 'pt-BR',
    UNIQUE KEY uk_preferencias_usuario (id_usuario),
    CONSTRAINT fk_preferencias_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:6';

    -- 7/176: 20261001_02_create_tables.sql:7
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:7', 'd5ce955f784924212fa9bbf4ee7de01482d5192abf8412db4af78ca91701e0a7', 'RUNNING');
CREATE TABLE generos (
    id_genero INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:7';

    -- 8/176: 20261001_02_create_tables.sql:8
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:8', 'bf8468f5fafbeafb75ee236f3319a6012ab3fadcde72f4c71ee48f3ad9de3fd4', 'RUNNING');
CREATE TABLE filmes (
    id_filme INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao INT COMMENT 'duração em minutos',
    classificacao ENUM('L','10','12','14','16','18') NOT NULL DEFAULT 'L',
    data_lancamento DATE,
    diretor VARCHAR(150),
    imagem VARCHAR(255),
    trailer VARCHAR(255),
    disponivel_cinema BOOLEAN DEFAULT TRUE,
    disponivel_streaming BOOLEAN DEFAULT FALSE,
    preco_aluguel DECIMAL(10,2),
    preco_compra DECIMAL(10,2),
    dias_acesso_aluguel INT DEFAULT 3 COMMENT 'validade do aluguel, em dias, a partir da compra',
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_filmes_duracao CHECK (duracao IS NULL OR duracao > 0),
    CONSTRAINT chk_filmes_precos CHECK (
        (preco_aluguel IS NULL OR preco_aluguel >= 0) AND
        (preco_compra IS NULL OR preco_compra >= 0)
    ),
    CONSTRAINT chk_filmes_dias_aluguel CHECK (dias_acesso_aluguel IS NULL OR dias_acesso_aluguel > 0)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:8';

    -- 9/176: 20261001_02_create_tables.sql:9
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:9', '4fc1dcbb909c0bc665cdc8122b3c974a205b087745c811d72487492f38f418f1', 'RUNNING');
CREATE TABLE filme_generos (
    id_filme INT UNSIGNED NOT NULL,
    id_genero INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_filme, id_genero),
    CONSTRAINT fk_filmegen_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme) ON DELETE CASCADE,
    CONSTRAINT fk_filmegen_genero FOREIGN KEY (id_genero) REFERENCES generos(id_genero) ON DELETE CASCADE
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:9';

    -- 10/176: 20261001_02_create_tables.sql:10
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:10', '99cbf40b198ed674480c4c5ef3a71c2c130369fb9fd93e333e1b174c1c13977f', 'RUNNING');
CREATE TABLE locais (
    id_local INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cep VARCHAR(10),
    logradouro VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    telefone VARCHAR(20),
    status ENUM('ATIVO','INATIVO','MANUTENCAO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:10';

    -- 11/176: 20261001_02_create_tables.sql:11
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:11', '9513e5d3fed22458959fd6f6d48e916fdbed535bbff8052568067933541166f0', 'RUNNING');
CREATE TABLE salas (
    id_sala INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_local INT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    capacidade INT NOT NULL,
    tipo ENUM('2D','3D','4DX','VIP','IMAX') DEFAULT '2D',
    status ENUM('ATIVA','MANUTENCAO','INATIVA') DEFAULT 'ATIVA',
    UNIQUE KEY uk_sala_local_nome (id_local, nome),
    CONSTRAINT chk_salas_capacidade CHECK (capacidade > 0),
    CONSTRAINT fk_salas_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:11';

    -- 12/176: 20261001_02_create_tables.sql:12
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:12', '7e699012c7d8cf1444c7850a3877d86cc319016b74ab55f77cca2c082941ab33', 'RUNNING');
CREATE TABLE assentos (
    id_assento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_sala INT UNSIGNED NOT NULL,
    fileira VARCHAR(5) NOT NULL,
    numero INT NOT NULL,
    tipo ENUM('COMUM','PCD','OBESO','IDOSO','CASAL') DEFAULT 'COMUM' COMMENT 'PCD/OBESO/IDOSO cobrem a NFR de acessibilidade',
    status ENUM('ATIVA','INATIVA') DEFAULT 'ATIVA',
    UNIQUE KEY uk_assento_sala (id_sala, fileira, numero),
    CONSTRAINT chk_assentos_numero CHECK (numero > 0),
    CONSTRAINT fk_assentos_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:12';

    -- 13/176: 20261001_02_create_tables.sql:13
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:13', '84d3b2bf8e81d3b0b127c64f6cdeaa86db004e04615b4a6f8ddcf6809d824c8b', 'RUNNING');
CREATE TABLE sessoes (
    id_sessao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_filme INT UNSIGNED NOT NULL,
    id_sala INT UNSIGNED NOT NULL,
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    idioma ENUM('DUBLADO','LEGENDADO','ORIGINAL') DEFAULT 'DUBLADO',
    preco_inteira DECIMAL(10,2) NOT NULL COMMENT 'valor da meia-entrada = preco_inteira / 2',
    status ENUM('AGENDADA','EM_CARTAZ','ENCERRADA','CANCELADA') DEFAULT 'AGENDADA',
    CONSTRAINT chk_sessoes_preco CHECK (preco_inteira >= 0),
    CONSTRAINT fk_sessoes_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme),
    CONSTRAINT fk_sessoes_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:13';

    -- 14/176: 20261001_02_create_tables.sql:14
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:14', '1a4915df4b189441e0cdc1152301562ff7a25cd621ba31536628a9ae511ade98', 'RUNNING');
CREATE TABLE equipes (
    id_equipe INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_supervisor INT UNSIGNED NOT NULL,
    id_sessao INT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    status ENUM('ATIVA','FINALIZADA','CANCELADA') DEFAULT 'ATIVA',
    CONSTRAINT fk_equipes_supervisor FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_equipes_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:14';

    -- 15/176: 20261001_02_create_tables.sql:15
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:15', '60dcc1097f8eeea95a83c830ce723d859a3986d989042a7411399bacd5a85b40', 'RUNNING');
CREATE TABLE equipe_membros (
    id_equipe_membro INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_equipe INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    funcao VARCHAR(100),
    data_entrada DATE DEFAULT (CURRENT_DATE),
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    UNIQUE KEY uk_equipe_usuario (id_equipe, id_usuario),
    CONSTRAINT fk_equipemembros_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id_equipe),
    CONSTRAINT fk_equipemembros_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:15';

    -- 16/176: 20261001_02_create_tables.sql:16
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:16', '4af0a19832e26bee452e049ab86b804a474a183e2414aae9dd001d0292f60ce2', 'RUNNING');
CREATE TABLE chamados (
    id_chamado INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_criador INT UNSIGNED NOT NULL,
    id_responsavel INT UNSIGNED,
    id_sessao INT UNSIGNED,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    prioridade ENUM('BAIXA','MEDIA','ALTA','URGENTE') DEFAULT 'MEDIA',
    status ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO') DEFAULT 'ABERTO',
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_fechamento DATETIME,
    CONSTRAINT fk_chamados_criador FOREIGN KEY (id_criador) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamados_responsavel FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamados_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:16';

    -- 17/176: 20261001_02_create_tables.sql:17
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:17', '71eefe3280fbf3760c14057ba68a96f658d491635207ff92c801331b4b7d5028', 'RUNNING');
CREATE TABLE notificacoes (
    id_notificacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,
    tipo VARCHAR(50),
    lida BOOLEAN DEFAULT FALSE,
    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:17';

    -- 18/176: 20261001_02_create_tables.sql:18
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:18', '922d38e1105201fe54e5d9707376a5f3e0a833dadfdf25eafad82ef223292e30', 'RUNNING');
CREATE TABLE fornecedores (
    id_fornecedor INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL UNIQUE COMMENT 'conta de acesso do fornecedor ao sistema',
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fornecedores_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:18';

    -- 19/176: 20261001_02_create_tables.sql:19
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:19', '5192ded5a3b45a0c4f459d993b9ceb4cdc008613c71f8aecfc93d671249924d9', 'RUNNING');
CREATE TABLE insumos (
    id_insumo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL COMMENT 'local físico onde o insumo está estocado',
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    quantidade INT NOT NULL DEFAULT 0,
    quantidade_minima INT NOT NULL DEFAULT 0,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('DISPONIVEL','INDISPONIVEL') DEFAULT 'DISPONIVEL',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_insumos_quantidades CHECK (quantidade >= 0 AND quantidade_minima >= 0),
    CONSTRAINT chk_insumos_preco CHECK (preco >= 0),
    CONSTRAINT fk_insumos_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_insumos_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:19';

    -- 20/176: 20261001_02_create_tables.sql:20
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:20', '67bfa95b76d1cdfcd942709aec9ae0d31239983a8e7579aca73d5b7ea72cf682', 'RUNNING');
CREATE TABLE equipamentos (
    id_equipamento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    numero_patrimonio VARCHAR(100) UNIQUE,
    quantidade INT NOT NULL DEFAULT 0,
    status ENUM('DISPONIVEL','MANUTENCAO','INDISPONIVEL') DEFAULT 'DISPONIVEL',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_equipamentos_quantidade CHECK (quantidade >= 0),
    CONSTRAINT fk_equipamentos_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_equipamentos_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:20';

    -- 21/176: 20261001_02_create_tables.sql:21
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:21', 'f093dc2db4c318b60621205ddaa5e43c8b02291d874af1c69c949ed0c9ef0d2a', 'RUNNING');
CREATE TABLE combos (
    id_combo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_combos_preco CHECK (preco >= 0)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:21';

    -- 22/176: 20261001_02_create_tables.sql:22
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:22', '7a6731793579f6cbd09ad9113b8f56e614f30b04845a7bbbd2ad399f0d14dae4', 'RUNNING');
CREATE TABLE combo_itens (
    id_combo INT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_combo, id_insumo),
    CONSTRAINT chk_comboitens_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_comboitens_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo) ON DELETE CASCADE,
    CONSTRAINT fk_comboitens_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:22';

    -- 23/176: 20261001_02_create_tables.sql:23
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:23', 'a9265eb4ed4e697a9541a3399123b9e3b6364d88b2bc4d48d99c918036d55b8b', 'RUNNING');
CREATE TABLE movimentacoes_estoque (
    id_movimentacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT UNSIGNED,
    id_equipamento INT UNSIGNED,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA','SAIDA','AJUSTE','PERDA','DEVOLUCAO') NOT NULL,
    quantidade INT NOT NULL,
    motivo VARCHAR(255),
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movestoque_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_movestoque_equipamento FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id_equipamento),
    CONSTRAINT fk_movestoque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_movestoque_quantidade CHECK (quantidade <> 0),
    CONSTRAINT chk_movestoque_item CHECK (
        (id_insumo IS NOT NULL AND id_equipamento IS NULL) OR
        (id_insumo IS NULL AND id_equipamento IS NOT NULL)
    )
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:23';

    -- 24/176: 20261001_02_create_tables.sql:24
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:24', '348cfb98c76d8b650eeeb89b3eb664d2c56812887276b1362124ec7fed830dc8', 'RUNNING');
CREATE TABLE solicitacoes_estoque (
    id_solicitacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    id_sessao INT UNSIGNED,
    id_insumo INT UNSIGNED,
    id_equipamento INT UNSIGNED,
    quantidade INT NOT NULL,
    status ENUM('PENDENTE','APROVADA','RECUSADA','FINALIZADA') DEFAULT 'PENDENTE',
    observacao TEXT,
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicestoque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_solicestoque_local FOREIGN KEY (id_local) REFERENCES locais(id_local),
    CONSTRAINT fk_solicestoque_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_solicestoque_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_solicestoque_equipamento FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id_equipamento),
    CONSTRAINT chk_solicestoque_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_solicestoque_item CHECK (
        (id_insumo IS NOT NULL AND id_equipamento IS NULL) OR
        (id_insumo IS NULL AND id_equipamento IS NOT NULL)
    )
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:24';

    -- 25/176: 20261001_02_create_tables.sql:25
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:25', 'ee10923e13fbe0f123f5909c75cfbb68c8cbb34bf1778606bc01430923179a91', 'RUNNING');
CREATE TABLE logistica (
    id_logistica INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local_origem INT UNSIGNED COMMENT 'estoque físico do fornecedor',
    id_local_destino INT UNSIGNED NOT NULL COMMENT 'local/sessão que solicitou os recursos',
    id_solicitacao INT UNSIGNED,
    data_envio DATETIME,
    data_prevista DATETIME,
    data_recebimento DATETIME,
    status ENUM('PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO') DEFAULT 'PENDENTE',
    observacao TEXT,
    CONSTRAINT fk_logistica_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_logistica_origem FOREIGN KEY (id_local_origem) REFERENCES locais(id_local),
    CONSTRAINT fk_logistica_destino FOREIGN KEY (id_local_destino) REFERENCES locais(id_local),
    CONSTRAINT fk_logistica_solicitacao FOREIGN KEY (id_solicitacao) REFERENCES solicitacoes_estoque(id_solicitacao)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:25';

    -- 26/176: 20261001_02_create_tables.sql:26
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:26', '8e711ce9ff2c1fa1c56f596f26e9912be5e86211de052a1fc4a4c98f7233343d', 'RUNNING');
CREATE TABLE cupons (
    id_cupom INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    desconto DECIMAL(5,2) NOT NULL,
    validade DATE NOT NULL,
    limite_uso INT DEFAULT 0 COMMENT '0 = ilimitado',
    ativo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_cupons_desconto CHECK (desconto >= 0 AND desconto <= 100),
    CONSTRAINT chk_cupons_limite_uso CHECK (limite_uso >= 0)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:26';

    -- 27/176: 20261001_02_create_tables.sql:27
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:27', '0a6a2f45b08af5d78e9a10f14bdfd4bd672b9b269a4820facbdd070a326d1335', 'RUNNING');
CREATE TABLE pedidos (
    id_pedido BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_cupom INT UNSIGNED,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('EM_ANDAMENTO','AGUARDANDO_PAGAMENTO','PAGO','CANCELADO','FINALIZADO') DEFAULT 'EM_ANDAMENTO',
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_pedidos_valor_total CHECK (valor_total >= 0),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_pedidos_cupom FOREIGN KEY (id_cupom) REFERENCES cupons(id_cupom)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:27';

    -- 28/176: 20261001_02_create_tables.sql:28
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:28', '70c61d02f37cdd10287a47d2b59ef3dcfa6e85bf8c32d0c5215d8341e2060b20', 'RUNNING');
CREATE TABLE itens_pedido (
    id_item BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED,
    id_combo INT UNSIGNED,
    id_sessao INT UNSIGNED,
    id_assento INT UNSIGNED,
    id_filme INT UNSIGNED,
    tipo_streaming ENUM('ALUGUEL','COMPRA'),
    tipo_ingresso ENUM('INTEIRA','MEIA','ISENTA') DEFAULT 'INTEIRA',
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_itenspedido_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_itenspedido_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_itenspedido_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo),
    CONSTRAINT fk_itenspedido_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_itenspedido_assento FOREIGN KEY (id_assento) REFERENCES assentos(id_assento),
    CONSTRAINT fk_itenspedido_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme),
    UNIQUE KEY uk_sessao_assento (id_sessao, id_assento) COMMENT 'impede vender o mesmo assento duas vezes na mesma sessão',
    CONSTRAINT chk_itenspedido_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_itenspedido_sessao_qtd CHECK (id_sessao IS NULL OR quantidade = 1),
    CONSTRAINT chk_itenspedido_valores CHECK (valor_unitario >= 0 AND subtotal >= 0),
    CONSTRAINT chk_itenspedido_tipo CHECK (
        (id_insumo IS NOT NULL AND id_combo IS NULL AND id_sessao IS NULL AND id_filme IS NULL AND id_assento IS NULL) OR
        (id_insumo IS NULL AND id_combo IS NOT NULL AND id_sessao IS NULL AND id_filme IS NULL AND id_assento IS NULL) OR
        (id_insumo IS NULL AND id_combo IS NULL AND id_sessao IS NOT NULL AND id_filme IS NULL AND id_assento IS NOT NULL) OR
        (id_insumo IS NULL AND id_combo IS NULL AND id_sessao IS NULL AND id_filme IS NOT NULL AND id_assento IS NULL)
    ),
    CONSTRAINT chk_itenspedido_streaming CHECK (
        (id_filme IS NOT NULL AND tipo_streaming IS NOT NULL) OR
        (id_filme IS NULL AND tipo_streaming IS NULL)
    )
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:28';

    -- 29/176: 20261001_02_create_tables.sql:29
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:29', '8438079a24d020e425d1ea4973d3a176a2aa7773ba52626aba4f270204440a54', 'RUNNING');
CREATE TABLE tickets (
    id_ticket BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    tipo ENUM('INGRESSO_SESSAO','RETIRADA_INSUMO','ACESSO_STREAMING') NOT NULL,
    status ENUM('GERADO','UTILIZADO','CANCELADO','EXPIRADO') DEFAULT 'GERADO',
    data_geracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_utilizacao DATETIME,
    CONSTRAINT fk_tickets_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:29';

    -- 30/176: 20261001_02_create_tables.sql:30
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:30', 'ab423211d013564ff10c7f1d37686a1dd737346663e753d5c47a982a60d37126', 'RUNNING');
CREATE TABLE acessos_streaming (
    id_acesso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item BIGINT UNSIGNED NOT NULL UNIQUE,
    id_usuario INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    data_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATETIME COMMENT 'NULL para compra definitiva',
    status ENUM('ATIVO','EXPIRADO','REVOGADO') DEFAULT 'ATIVO',
    CONSTRAINT fk_acessostream_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item),
    CONSTRAINT fk_acessostream_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_acessostream_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:30';

    -- 31/176: 20261001_02_create_tables.sql:31
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:31', '157db7fe25bf013f4196bc96ea18ca4a408675f1eb485c21149c00d9c0937b9e', 'RUNNING');
CREATE TABLE metodos_pagamento (
    id_metodo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('CREDITO','DEBITO','PIX','BOLETO') NOT NULL,
    identificacao VARCHAR(100) COMMENT 'ex.: últimos 4 dígitos do cartão',
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_metodospagto_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:31';

    -- 32/176: 20261001_02_create_tables.sql:32
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:32', 'fecfa8102920b0b2dd8d6da253fcc1a6151d6273bdd8d97175f760b131cede3b', 'RUNNING');
CREATE TABLE planos (
    id_plano INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_mensal DECIMAL(10,2),
    valor_anual DECIMAL(10,2),
    desconto DECIMAL(5,2) DEFAULT 0.00,
    limite_membros INT NOT NULL DEFAULT 1 COMMENT 'qtde máxima de perfis compartilhados no plano',
    valor_multa_atraso DECIMAL(10,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:32';

    -- 33/176: 20261001_02_create_tables.sql:33
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:33', 'f9066da8ed2522368ca6c20758934cbf4a6bde95dfd51c3a688ee4bb1bee32c7', 'RUNNING');
CREATE TABLE assinaturas (
    id_assinatura INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL COMMENT 'titular da assinatura',
    id_plano INT UNSIGNED NOT NULL,
    inicio DATE NOT NULL,
    fim DATE,
    periodicidade ENUM('MENSAL','ANUAL') NOT NULL,
    tipo_divisao ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NOT NULL DEFAULT 'TITULAR_PAGA',
    status ENUM('ATIVA','CANCELADA','EXPIRADA','PENDENTE') DEFAULT 'ATIVA',
    renovacao_automatica BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_assinaturas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_assinaturas_plano FOREIGN KEY (id_plano) REFERENCES planos(id_plano)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:33';

    -- 34/176: 20261001_02_create_tables.sql:34
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:34', '0336cec2482145a8006afd77045f7b6410a6d286596c126159290461fc698bff', 'RUNNING');
CREATE TABLE convites_plano (
    id_convite INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario_convidado INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','ACEITO','RECUSADO','EXPIRADO') DEFAULT 'PENDENTE',
    data_convite DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_resposta DATETIME,
    UNIQUE KEY uk_assinatura_convidado (id_assinatura, id_usuario_convidado),
    CONSTRAINT fk_convitesplano_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_convitesplano_usuario FOREIGN KEY (id_usuario_convidado) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:34';

    -- 35/176: 20261001_02_create_tables.sql:35
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:35', '5ef5682f24d9bbca22c76594b7f71bde23593bed7493dd1c0d17454e46ecea12', 'RUNNING');
CREATE TABLE assinatura_cobrancas (
    id_cobranca BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL COMMENT 'responsável por esta fração da cobrança',
    competencia DATE NOT NULL COMMENT 'mês/ano de referência (usar sempre dia 01)',
    valor_devido DECIMAL(10,2) NOT NULL,
    valor_multa_aplicada DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('PENDENTE','PAGO','ATRASADO','ISENTO') DEFAULT 'PENDENTE',
    data_vencimento DATE NOT NULL,
    data_pagamento DATETIME,
    UNIQUE KEY uk_cobranca_competencia (id_assinatura, id_usuario, competencia),
    CONSTRAINT chk_cobrancas_valores CHECK (valor_devido >= 0 AND valor_multa_aplicada >= 0),
    CONSTRAINT fk_cobrancas_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_cobrancas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:35';

    -- 36/176: 20261001_02_create_tables.sql:36
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:36', '93d0594b7216b66a1e861cb1e687ebd8b281ec9ed7299b4f03edce127c6c72ec', 'RUNNING');
CREATE TABLE pagamentos (
    id_pagamento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED,
    id_cobranca BIGINT UNSIGNED,
    id_metodo INT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('PENDENTE','APROVADO','RECUSADO','ESTORNADO') DEFAULT 'PENDENTE',
    data_pagamento DATETIME,
    transacao_id VARCHAR(150),
    CONSTRAINT chk_pagamentos_valor CHECK (valor >= 0),
    CONSTRAINT fk_pagamentos_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_pagamentos_cobranca FOREIGN KEY (id_cobranca) REFERENCES assinatura_cobrancas(id_cobranca),
    CONSTRAINT fk_pagamentos_metodo FOREIGN KEY (id_metodo) REFERENCES metodos_pagamento(id_metodo),
    CONSTRAINT chk_pagamentos_referencia CHECK (
        (id_pedido IS NOT NULL AND id_cobranca IS NULL) OR
        (id_pedido IS NULL AND id_cobranca IS NOT NULL)
    )
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:36';

    -- 37/176: 20261001_02_create_tables.sql:37
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:37', '697847c435412aeaa9a3731a628bb840c797e163523464cd8c29b0857103d695', 'RUNNING');
CREATE TABLE suporte (
    id_suporte INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT UNSIGNED NOT NULL,
    id_atendente INT UNSIGNED,
    assunto VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    resposta TEXT,
    status ENUM('ABERTO','EM_ATENDIMENTO','RESOLVIDO','FECHADO') DEFAULT 'ABERTO',
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_fechamento DATETIME,
    CONSTRAINT fk_suporte_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_suporte_atendente FOREIGN KEY (id_atendente) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:37';

    -- 38/176: 20261001_02_create_tables.sql:38
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:38', '83c66c13eb057dcf0407a23f581392733b09ed0effcc1e8c677961c33c728ec6', 'RUNNING');
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:38';

    -- 39/176: 20261001_02_create_tables.sql:39
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:39', 'a1a43c5525d0cce95157c54b0120fda776ea1d7c07fbf1adc4861addde22c2e6', 'RUNNING');
CREATE INDEX idx_sessoes_data_sala ON sessoes(data, id_sala);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:39';

    -- 40/176: 20261001_02_create_tables.sql:40
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:40', '77999fa1a39d42a7e8383fd098b111a17eec29e4254df9f110687474119398f0', 'RUNNING');
CREATE INDEX idx_pedidos_usuario_data ON pedidos(id_usuario, data_pedido DESC);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:40';

    -- 41/176: 20261001_02_create_tables.sql:41
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:41', '6d1f743044d1786342ddb03633de56e05a310f1e2b95a15026171d29c40eeedd', 'RUNNING');
CREATE INDEX idx_pedidos_status ON pedidos(status);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:41';

    -- 42/176: 20261001_02_create_tables.sql:42
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:42', 'f2b0961355b249562ea2eeb0c7bb3a676e74f48a17eba1023eb465f951c1ba9c', 'RUNNING');
CREATE INDEX idx_tickets_status ON tickets(status);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:42';

    -- 43/176: 20261001_02_create_tables.sql:43
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:43', '2f7c1481ddf02f201ac74f870e93ebc8d4c937f3b347bf8527950b102741a1b7', 'RUNNING');
CREATE INDEX idx_acessos_streaming_usuario_status ON acessos_streaming(id_usuario, status);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:43';

    -- 44/176: 20261001_02_create_tables.sql:44
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:44', '7cb445c331624c02b47f96e14a63511a8bdbcc372e16e3e2b3e933372a86e405', 'RUNNING');
CREATE INDEX idx_insumos_estoque_baixo ON insumos(status, quantidade, quantidade_minima);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:44';

    -- 45/176: 20261001_02_create_tables.sql:45
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:45', '171620ec88434bf9c79a307d3e9dd97c3ab643ca049b796afc7ef5797428b923', 'RUNNING');
CREATE INDEX idx_movestoque_data ON movimentacoes_estoque(data_movimentacao);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:45';

    -- 46/176: 20261001_02_create_tables.sql:46
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:46', 'db1216505fb1a1f7f3ca3ea1ec23137cdc12b312fe2409f50c7f931ac3c17299', 'RUNNING');
CREATE INDEX idx_assinaturas_status ON assinaturas(status);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:46';

    -- 47/176: 20261001_02_create_tables.sql:47
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:47', 'e8b1e8e7b60cbbb0dfe00c94aa4010345ad1d869b56b6c2a85ec9b01406deeb1', 'RUNNING');
CREATE INDEX idx_assinaturas_usuario_status ON assinaturas(id_usuario, status);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:47';

    -- 48/176: 20261001_02_create_tables.sql:48
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:48', '92a749bee7c1e20d9d30d378411bdfcbb2d1e5f2ad460babec7721d8228b55f4', 'RUNNING');
CREATE INDEX idx_cobrancas_vencimento_status ON assinatura_cobrancas(data_vencimento, status);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:48';

    -- 49/176: 20261001_02_create_tables.sql:49
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:49', '5ad1ffa51963714c64df5706eef5897b90264115f0b8e7c7b0328ec079d26057', 'RUNNING');
CREATE INDEX idx_chamados_status_data ON chamados(status, data_abertura);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:49';

    -- 50/176: 20261001_02_create_tables.sql:50
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:50', '1cc0bf80c2f548ad935cfddc2e16a04c13142f0ee8c2704bac631ef2fc200cea', 'RUNNING');
CREATE INDEX idx_suporte_status ON suporte(status, data_abertura);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:50';

    -- 51/176: 20261001_02_create_tables.sql:51
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:51', '026c22aed05567e3e24c446ac9be5c23ed38073d047dd776d32008b1241d921c', 'RUNNING');
CREATE INDEX idx_notificacoes_usuario_lida_data ON notificacoes(id_usuario, lida, data_envio DESC);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:51';

    -- 52/176: 20261001_02_create_tables.sql:52
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:52', 'bf857672c8879f0a76118df20b3b8a821ac9219784114934278a22f2f8dabcdd', 'RUNNING');
CREATE INDEX idx_logistica_status ON logistica(status);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:52';

    -- 53/176: 20261001_02_create_tables.sql:53
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:53', 'bfec18b110177ca7a18fb9c3d179ca405262a288c80a3be909cb82f308eba1e8', 'RUNNING');
CREATE INDEX idx_solicitacoes_status_data ON solicitacoes_estoque(status, data_solicitacao);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:53';

    -- 54/176: 20261001_02_create_tables.sql:54
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_02_create_tables.sql:54', '140dab4d0e5851aebc74a19fbcb56975254f6ff1abf152c80a9550fbe177a3da', 'RUNNING');
CREATE INDEX idx_filme_generos_genero ON filme_generos(id_genero, id_filme);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_02_create_tables.sql:54';

    -- 55/176: 20261001_03_create_table_logs.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_03_create_table_logs.sql:1', 'dba6e74115bfc4336341f3fd7c7474fe255a114ec494b14ef4e1aa326fd36687', 'RUNNING');
CREATE TABLE IF NOT EXISTS logs (
    id_log BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    id_usuario INT UNSIGNED NULL,

    rota VARCHAR(255) NOT NULL,
    metodo VARCHAR(16) NOT NULL,

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,

    status_code SMALLINT UNSIGNED NOT NULL,
    tempo_resposta_ms INT UNSIGNED NOT NULL,
    tamanho_resposta_bytes INT UNSIGNED NULL,

    data_hora DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    dados_requisicao JSON NULL,
    dados_resposta JSON NULL,

    PRIMARY KEY (id_log),

    CONSTRAINT fk_logs_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL,

    CONSTRAINT chk_logs_status_code
        CHECK (status_code BETWEEN 100 AND 599)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_03_create_table_logs.sql:1';

    -- 56/176: 20261001_03_create_table_logs.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_03_create_table_logs.sql:2', 'c4a93711944e4e3bf574fdd851ab9336cda2cea18543a174adf8e33d4dad1a40', 'RUNNING');
CREATE INDEX idx_logs_data_hora
    ON logs(data_hora);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_03_create_table_logs.sql:2';

    -- 57/176: 20261001_03_create_table_logs.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_03_create_table_logs.sql:3', '1b94e7c18d82ccfc5e5c676f2fd6a91f607f07359ae9a219dd820ba5e9592ab4', 'RUNNING');
CREATE INDEX idx_logs_usuario_data
    ON logs(id_usuario, data_hora);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_03_create_table_logs.sql:3';

    -- 58/176: 20261001_03_create_table_logs.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_03_create_table_logs.sql:4', 'dbfac87b5b1c4b6f1d17894f434b0f385457aa165a8981a6ded2c1a4de1a45be', 'RUNNING');
CREATE INDEX idx_logs_status_data
    ON logs(status_code, data_hora);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_03_create_table_logs.sql:4';

    -- 59/176: 20261001_04_update_alter_table_fornecedores.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261001_04_update_alter_table_fornecedores.sql:1', 'd2e004676caba166c9e2cf1967ee125aa1b5599f61d336cd2e44e36d7d2f2911', 'RUNNING');
ALTER TABLE fornecedores
CHANGE COLUMN nome_fantasia nome_cine VARCHAR(150);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261001_04_update_alter_table_fornecedores.sql:1';

    -- 60/176: 20261006_alter_table_filmes.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:1', '85fe1e6e5ecc875221b887237ada747fc835b4ea98f91fc55c779cdb9f32fd64', 'RUNNING');
ALTER TABLE filmes
    ADD COLUMN url_reproducao VARCHAR(2048) NULL
        COMMENT 'URL estavel do video completo ou manifesto HLS/DASH'
        AFTER trailer,
    ADD CONSTRAINT chk_filmes_url_reproducao CHECK (
        url_reproducao IS NULL OR CHAR_LENGTH(TRIM(url_reproducao)) > 0
    );
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:1';

    -- 61/176: 20261006_alter_table_filmes.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:2', 'f9839c285b06df96e0a18273f1bdbf23fba7f313e0a0f8f5ea292b98e5ffb5d1', 'RUNNING');
CREATE TABLE filmes_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_filme INT UNSIGNED NOT NULL,
    tipo ENUM('CAPA','BANNER','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_principal VARCHAR(20) GENERATED ALWAYS AS (
        CASE WHEN principal = 1 THEN tipo ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_filmes_imagens_principal (id_filme, tipo_principal),
    KEY idx_filmes_imagens_galeria (id_filme, tipo, ordem, id_imagem),
    CONSTRAINT chk_filmes_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT chk_filmes_imagens_principal CHECK (principal IN (0, 1)),
    CONSTRAINT fk_filmes_imagens_filme FOREIGN KEY (id_filme)
        REFERENCES filmes(id_filme) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:2';

    -- 62/176: 20261006_alter_table_filmes.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:3', '4ce9a804af1e4da1d61ea95674e0a8320bf5d1d05fcbddacea36aeb80311bf4b', 'RUNNING');
INSERT INTO filmes_imagens (id_filme, tipo, url, texto_alternativo, principal)
SELECT id_filme, 'CAPA', TRIM(imagem), CONCAT('Capa de ', titulo), TRUE
FROM filmes
WHERE imagem IS NOT NULL AND CHAR_LENGTH(TRIM(imagem)) > 0;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:3';

    -- 63/176: 20261006_alter_table_filmes.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:4', 'fdace76c4a88e462832707fc3f60bcab03c771a13c15f5c88c202622a3080d5d', 'RUNNING');
CREATE TABLE insumos_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT UNSIGNED NOT NULL,
    tipo ENUM('PRINCIPAL','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    slot_principal TINYINT GENERATED ALWAYS AS (
        CASE WHEN tipo = 'PRINCIPAL' THEN 1 ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_insumos_imagens_principal (id_insumo, slot_principal),
    KEY idx_insumos_imagens_galeria (id_insumo, tipo, ordem, id_imagem),
    CONSTRAINT chk_insumos_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT fk_insumos_imagens_insumo FOREIGN KEY (id_insumo)
        REFERENCES insumos(id_insumo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:4';

    -- 64/176: 20261006_alter_table_filmes.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:5', 'a01f840ce6c63b51ab1566a4f18d73802521e9cc3c75d94d823a15632b01b099', 'RUNNING');
CREATE TABLE combos_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_combo INT UNSIGNED NOT NULL,
    tipo ENUM('PRINCIPAL','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    slot_principal TINYINT GENERATED ALWAYS AS (
        CASE WHEN tipo = 'PRINCIPAL' THEN 1 ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_combos_imagens_principal (id_combo, slot_principal),
    KEY idx_combos_imagens_galeria (id_combo, tipo, ordem, id_imagem),
    CONSTRAINT chk_combos_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT fk_combos_imagens_combo FOREIGN KEY (id_combo)
        REFERENCES combos(id_combo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:5';

    -- 65/176: 20261006_alter_table_filmes.sql:6
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:6', 'b3d343fa723ee05f533e818a076a783694ec5a3dcd75b5052e7e1cddf24366ab', 'RUNNING');
CREATE TABLE newsletter_inscritos (
    id_inscrito INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NULL,
    email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_ci NOT NULL,
    nome VARCHAR(100) NULL,
    status ENUM('PENDENTE','ATIVO','DESCADASTRADO','BLOQUEADO')
        NOT NULL DEFAULT 'PENDENTE',
    origem VARCHAR(100) NOT NULL DEFAULT 'SITE',
    versao_termo VARCHAR(50) NOT NULL COMMENT 'Versao do texto de consentimento aceito',
    consentimento_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmado_em DATETIME NULL,
    descadastrado_em DATETIME NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_newsletter_inscritos_email (email),
    UNIQUE KEY uk_newsletter_inscritos_usuario (id_usuario),
    KEY idx_newsletter_inscritos_status (status, id_inscrito),
    CONSTRAINT chk_newsletter_inscritos_email CHECK (
        CHAR_LENGTH(TRIM(email)) > 0
    ),
    CONSTRAINT chk_newsletter_inscritos_termo CHECK (
        CHAR_LENGTH(TRIM(versao_termo)) > 0
    ),
    CONSTRAINT chk_newsletter_inscritos_confirmacao CHECK (
        status <> 'ATIVO' OR confirmado_em IS NOT NULL
    ),
    CONSTRAINT chk_newsletter_inscritos_descadastro CHECK (
        (status = 'DESCADASTRADO' AND descadastrado_em IS NOT NULL)
        OR (status <> 'DESCADASTRADO' AND descadastrado_em IS NULL)
    ),
    CONSTRAINT chk_newsletter_inscritos_datas CHECK (
        (confirmado_em IS NULL OR confirmado_em >= consentimento_em)
        AND (descadastrado_em IS NULL OR descadastrado_em >= consentimento_em)
    ),
    CONSTRAINT fk_newsletter_inscritos_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:6';

    -- 66/176: 20261006_alter_table_filmes.sql:7
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:7', '9f41c095741df5bd98746b7bdbd747fedf628d342ca509d7a412302c531fc3a1', 'RUNNING');
CREATE TABLE newsletter_categorias (
    id_categoria INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_newsletter_categorias_ativo CHECK (ativo IN (0, 1)),
    CONSTRAINT chk_newsletter_categorias_codigo CHECK (
        CHAR_LENGTH(TRIM(codigo)) > 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:7';

    -- 67/176: 20261006_alter_table_filmes.sql:8
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:8', 'f2c7c29668ab09034ab152fd0c8e19c3aed6ca78da4aa5e2bb0d63c7f06f8f5f', 'RUNNING');
INSERT INTO newsletter_categorias (codigo, nome, descricao) VALUES
    ('PROMOCOES', 'Promocoes', 'Descontos, cupons e ofertas de produtos e combos'),
    ('LANCAMENTOS', 'Lancamentos', 'Estreias de filmes e novos titulos no streaming'),
    ('NOVIDADES', 'Novidades', 'Noticias, eventos e novidades gerais do Cineastra');
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:8';

    -- 68/176: 20261006_alter_table_filmes.sql:9
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:9', 'd0ce8d2a9c4f2da596531f81cd86aa760f631d2bc20a4f0ae5ae19861b255576', 'RUNNING');
CREATE TABLE newsletter_preferencias (
    id_inscrito INT UNSIGNED NOT NULL,
    id_categoria INT UNSIGNED NOT NULL,
    aceita BOOLEAN NOT NULL DEFAULT FALSE,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_inscrito, id_categoria),
    KEY idx_newsletter_preferencias_publico (id_categoria, aceita, id_inscrito),
    CONSTRAINT chk_newsletter_preferencias_aceita CHECK (aceita IN (0, 1)),
    CONSTRAINT fk_newsletter_preferencias_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE,
    CONSTRAINT fk_newsletter_preferencias_categoria FOREIGN KEY (id_categoria)
        REFERENCES newsletter_categorias(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:9';

    -- 69/176: 20261006_alter_table_filmes.sql:10
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:10', 'bd1b7bc06b0128502a7212c5b262f3ddb19cf9d254b0ccc9d3665327f97e1735', 'RUNNING');
CREATE TABLE newsletter_tokens (
    id_token BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_inscrito INT UNSIGNED NOT NULL,
    finalidade ENUM('CONFIRMACAO','DESCADASTRO') NOT NULL,
    token_hash BINARY(32) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    utilizado_em DATETIME NULL,
    UNIQUE KEY uk_newsletter_tokens_hash (token_hash),
    KEY idx_newsletter_tokens_inscrito (id_inscrito, finalidade, utilizado_em),
    KEY idx_newsletter_tokens_expiracao (expira_em),
    CONSTRAINT chk_newsletter_tokens_expiracao CHECK (expira_em > criado_em),
    CONSTRAINT chk_newsletter_tokens_utilizacao CHECK (
        utilizado_em IS NULL OR utilizado_em >= criado_em
    ),
    CONSTRAINT fk_newsletter_tokens_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:10';

    -- 70/176: 20261006_alter_table_filmes.sql:11
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:11', '8ad401be6ec789f7b859259f881635011fcb8fe7d6af65e16d9100d53392c270', 'RUNNING');
CREATE TABLE newsletter_campanhas (
    id_campanha INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    conteudo_html MEDIUMTEXT NOT NULL,
    conteudo_texto MEDIUMTEXT NULL,
    status ENUM('RASCUNHO','AGENDADA','ENVIANDO','CONCLUIDA','CANCELADA')
        NOT NULL DEFAULT 'RASCUNHO',
    agendada_para DATETIME NULL,
    iniciada_em DATETIME NULL,
    concluida_em DATETIME NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_newsletter_campanhas_agendamento (status, agendada_para, id_campanha),
    CONSTRAINT chk_newsletter_campanhas_assunto CHECK (
        CHAR_LENGTH(TRIM(assunto)) > 0
    ),
    CONSTRAINT chk_newsletter_campanhas_agendada CHECK (
        status <> 'AGENDADA' OR agendada_para IS NOT NULL
    ),
    CONSTRAINT fk_newsletter_campanhas_categoria FOREIGN KEY (id_categoria)
        REFERENCES newsletter_categorias(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:11';

    -- 71/176: 20261006_alter_table_filmes.sql:12
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_alter_table_filmes.sql:12', 'bec702b449709aefae03caa067c5b1ce51ec53583ac08b9f359d7f70763dfadf', 'RUNNING');
CREATE TABLE newsletter_envios (
    id_envio BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_campanha INT UNSIGNED NOT NULL,
    id_inscrito INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','PROCESSANDO','ENVIADO','FALHOU','CANCELADO')
        NOT NULL DEFAULT 'PENDENTE',
    tentativas INT UNSIGNED NOT NULL DEFAULT 0,
    ultima_tentativa_em DATETIME NULL,
    processando_desde DATETIME NULL COMMENT 'Permite recuperar jobs abandonados',
    enviado_em DATETIME NULL,
    id_mensagem_provedor VARCHAR(255) NULL,
    ultimo_erro TEXT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_newsletter_envios_destinatario (id_campanha, id_inscrito),
    KEY idx_newsletter_envios_fila (status, id_campanha, id_envio),
    KEY idx_newsletter_envios_recuperacao (status, processando_desde),
    CONSTRAINT chk_newsletter_envios_enviado CHECK (
        status <> 'ENVIADO' OR enviado_em IS NOT NULL
    ),
    CONSTRAINT chk_newsletter_envios_processando CHECK (
        status <> 'PROCESSANDO' OR processando_desde IS NOT NULL
    ),
    CONSTRAINT fk_newsletter_envios_campanha FOREIGN KEY (id_campanha)
        REFERENCES newsletter_campanhas(id_campanha),
    CONSTRAINT fk_newsletter_envios_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_alter_table_filmes.sql:12';

    -- 72/176: 20261006_01_infrastructure_events.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_01_infrastructure_events.sql:1', '6401ebe285da99d6f103fa4e48d7ae244ef4bf1b80d56d7cf814e1fa2171fb65', 'RUNNING');
CREATE TABLE auditoria_eventos (
    id_auditoria BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    id_usuario INT UNSIGNED NULL,
    aggregate_id VARCHAR(20) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    occurred_at DATETIME(3) NOT NULL,
    version INT UNSIGNED NOT NULL,
    request_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_auditoria_version CHECK (version > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_01_infrastructure_events.sql:1';

    -- 73/176: 20261006_01_infrastructure_events.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261006_01_infrastructure_events.sql:2', 'c62344286ecd2e554b387e9c4b79a525f1d9bdeeb381d2e78b3d3c438940783a', 'RUNNING');
CREATE TABLE outbox_eventos (
    id_outbox BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    payload JSON NOT NULL,
    status ENUM('PENDENTE','PROCESSANDO','CONCLUIDO','FALHOU') NOT NULL DEFAULT 'PENDENTE',
    tentativas INT UNSIGNED NOT NULL DEFAULT 0,
    disponivel_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    processando_desde DATETIME(3) NULL,
    CONSTRAINT fk_outbox_evento FOREIGN KEY (event_id) REFERENCES auditoria_eventos(event_id),
    CONSTRAINT chk_outbox_processing CHECK (status <> 'PROCESSANDO' OR processando_desde IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261006_01_infrastructure_events.sql:2';

    -- 74/176: 20261008_01_identity.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:1', '9dd3c2bcf4858aab701f9bb54a2b714d0b91df0824c90c3ccb76430f69fe8f43', 'RUNNING');
ALTER TABLE usuarios
    ADD COLUMN email_normalizado VARCHAR(150) GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED,
    ADD COLUMN cpf_normalizado VARCHAR(14) GENERATED ALWAYS AS (REPLACE(REPLACE(TRIM(cpf), '.', ''), '-', '')) STORED,
    ADD UNIQUE KEY uk_usuarios_email_normalizado (email_normalizado),
    ADD UNIQUE KEY uk_usuarios_cpf_normalizado (cpf_normalizado);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:1';

    -- 75/176: 20261008_01_identity.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:2', '91d1d952b80f30f198359d1ac99cdee86ea4bf40ba971131dd1ff87c1961da86', 'RUNNING');
ALTER TABLE autenticacao_2fa
    ADD COLUMN ultimo_passo BIGINT UNSIGNED NULL,
    ADD UNIQUE KEY uk_2fa_usuario_metodo (id_usuario, metodo);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:2';

    -- 76/176: 20261008_01_identity.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:3', 'f4e32bd44d6aba1c3032cf07ac313eadfb38e3522bd91954cc9c1e9cc5db9c6d', 'RUNNING');
ALTER TABLE enderecos
    ADD COLUMN slot_principal TINYINT GENERATED ALWAYS AS (CASE WHEN principal = 1 THEN 1 ELSE NULL END) STORED,
    ADD UNIQUE KEY uk_enderecos_principal (id_usuario, slot_principal);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:3';

    -- 77/176: 20261008_01_identity.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:4', '248d0932cf3d7dff9e14b40d854d08b1dae04a98c27a9e8ebe3648fd25d4bca0', 'RUNNING');
ALTER TABLE contatos
    ADD COLUMN tipo_principal VARCHAR(30) GENERATED ALWAYS AS (CASE WHEN principal = 1 THEN tipo ELSE NULL END) STORED,
    ADD UNIQUE KEY uk_contatos_principal (id_usuario, tipo_principal);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:4';

    -- 78/176: 20261008_01_identity.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:5', '4024a8d2c5114945eb03d4a380ec754824f06c3ee89140fa6e4af715c20b116c', 'RUNNING');
ALTER TABLE preferencias_usuario
    ADD COLUMN aparencia ENUM('cineastra','violet-bloom','mocha-mousse','catppucin') NOT NULL DEFAULT 'cineastra';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:5';

    -- 79/176: 20261008_01_identity.sql:6
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:6', '97f22ee66cfc54a8c791d57e39e5e3371f625c63b1a7fc0d9375310317e4da67', 'RUNNING');
CREATE TABLE sessoes_autenticacao (
    id_sessao_auth BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    jti_hash BINARY(32) NOT NULL UNIQUE,
    expiracao DATETIME(3) NOT NULL,
    revogada_em DATETIME(3) NULL,
    two_factor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_sessoes_auth_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    KEY idx_sessoes_auth_usuario (id_usuario, revogada_em, expiracao)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:6';

    -- 80/176: 20261008_01_identity.sql:7
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:7', 'd528ef8017f8be1eb0e8e3d681b3a4b67c64c66a25ed9412e2ff70003c8b2f6a', 'RUNNING');
CREATE TABLE desafios_2fa (
    id_desafio BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    token_hash BINARY(32) NOT NULL UNIQUE,
    finalidade ENUM('LOGIN','ENROLLMENT') NOT NULL,
    metodo ENUM('APP','SMS','EMAIL') NULL,
    codigo_hash BINARY(32) NULL,
    chave_pendente VARCHAR(255) NULL,
    expiracao DATETIME(3) NOT NULL,
    tentativas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    consumido_em DATETIME(3) NULL,
    CONSTRAINT fk_desafios_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    KEY idx_desafios_usuario (id_usuario, consumido_em, expiracao)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:7';

    -- 81/176: 20261008_01_identity.sql:8
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:8', 'df9140ba1174cec279f8aa61d9d5097f5533bbf5f945b9fb143e26f3f8400a46', 'RUNNING');
CREATE TABLE consentimentos_usuario (
    id_consentimento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    finalidade ENUM('TERMOS','PRIVACIDADE') NOT NULL,
    versao VARCHAR(50) NOT NULL,
    base_legal VARCHAR(100) NOT NULL,
    aceito_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    revogado_em DATETIME(3) NULL,
    CONSTRAINT fk_consentimento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:8';

    -- 82/176: 20261008_01_identity.sql:9
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:9', '50f37d6c5b1375ee2b70dd58ca7be8e6554812ecf2bbfdec62b124cce5fb5093', 'RUNNING');
CREATE TABLE verificacoes_idade (
    id_verificacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    faixa_etaria ENUM('ATE_16','MAIOR_16') NOT NULL,
    referencia_provedor VARCHAR(150) NOT NULL,
    verificado_em DATETIME(3) NOT NULL,
    expiracao DATETIME(3) NOT NULL,
    CONSTRAINT fk_verificacao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_verificacao_expiracao CHECK (expiracao > verificado_em)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:9';

    -- 83/176: 20261008_01_identity.sql:10
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:10', '0665ace351988ea3dcf18b00c60a6551f80d58252b171b7c646b84e8f817fa09', 'RUNNING');
CREATE TABLE responsaveis_usuario (
    id_vinculo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_menor INT UNSIGNED NOT NULL,
    id_responsavel INT UNSIGNED NOT NULL,
    referencia_prova VARCHAR(150) NOT NULL,
    status ENUM('ATIVO','REVOGADO') NOT NULL DEFAULT 'ATIVO',
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    revogado_em DATETIME(3) NULL,
    UNIQUE KEY uk_responsavel_menor (id_menor, id_responsavel),
    CONSTRAINT chk_responsavel_distinto CHECK (id_menor <> id_responsavel),
    CONSTRAINT fk_responsavel_menor FOREIGN KEY (id_menor) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_responsavel_usuario FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:10';

    -- 84/176: 20261008_01_identity.sql:11
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:11', '77696555ca2d34e093cfc7e867b51073292617bd956bc30d99d13d747a42f777', 'RUNNING');
CREATE TABLE controles_parentais (
    id_menor INT UNSIGNED PRIMARY KEY,
    compras_permitidas BOOLEAN NOT NULL DEFAULT FALSE,
    assinaturas_permitidas BOOLEAN NOT NULL DEFAULT FALSE,
    limite_minutos_diarios SMALLINT UNSIGNED NOT NULL DEFAULT 120,
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT chk_parental_minutos CHECK (limite_minutos_diarios BETWEEN 1 AND 1440),
    CONSTRAINT fk_parental_menor FOREIGN KEY (id_menor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:11';

    -- 85/176: 20261008_01_identity.sql:12
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:12', '5a0ab7c7fd72673c27fced697381b8acb9b565cff28b5eb1901ae4d3a953a5ff', 'RUNNING');
CREATE TABLE autorizacoes_responsavel (
    id_autorizacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_vinculo BIGINT UNSIGNED NOT NULL,
    finalidade ENUM('COMPRA','ASSINATURA') NOT NULL,
    referencia_operacao VARCHAR(100) NOT NULL,
    autorizada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expiracao DATETIME(3) NOT NULL,
    revogada_em DATETIME(3) NULL,
    UNIQUE KEY uk_autorizacao_operacao (id_vinculo, finalidade, referencia_operacao),
    CONSTRAINT fk_autorizacao_vinculo FOREIGN KEY (id_vinculo) REFERENCES responsaveis_usuario(id_vinculo)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:12';

    -- 86/176: 20261008_01_identity.sql:13
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_01_identity.sql:13', 'c3902702d7552a2f99346b1d073fadba39233493793e59b0dfe4c97d3f3f225e', 'RUNNING');
CREATE TABLE solicitacoes_privacidade (
    id_solicitacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('EXCLUSAO') NOT NULL,
    status ENUM('RECEBIDA','EM_ANALISE','CONCLUIDA','RECUSADA') NOT NULL DEFAULT 'RECEBIDA',
    motivo_decisao VARCHAR(255) NULL,
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    encerrada_em DATETIME(3) NULL,
    slot_aberto TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('RECEBIDA','EM_ANALISE') THEN 1 ELSE NULL END) STORED,
    UNIQUE KEY uk_privacidade_aberta (id_usuario, tipo, slot_aberto),
    CONSTRAINT fk_privacidade_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_01_identity.sql:13';

    -- 87/176: 20261008_02_identity_guard.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_02_identity_guard.sql:1', 'd3c397f1d6e291125dc8dd9730addd32cb2def960c57aac84bcef83229d984c5', 'RUNNING');
CREATE TABLE identity_admin_guard (
    id TINYINT UNSIGNED PRIMARY KEY,
    CONSTRAINT chk_identity_admin_guard CHECK (id = 1)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_02_identity_guard.sql:1';

    -- 88/176: 20261008_02_identity_guard.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_02_identity_guard.sql:2', '468a4c8459101f58f8d5dd08be0faa2545240fd099245b62a8fa181914981ce9', 'RUNNING');
INSERT INTO identity_admin_guard (id) VALUES (1);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_02_identity_guard.sql:2';

    -- 89/176: 20261008_03_catalog_genres.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_03_catalog_genres.sql:1', '3c3b793ca9dfc1f50e84c681a8316219ca0e8f83483f14dcd9f35f3d7235ae6c', 'RUNNING');
ALTER TABLE generos ADD COLUMN status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_03_catalog_genres.sql:1';

    -- 90/176: 20261008_04_team_entries.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_04_team_entries.sql:1', 'e1155e5099c1948b77266fe9af098a31d39e3f5ba8108415d0caa12a57e8b11b', 'RUNNING');
CREATE TABLE equipe_entradas (
    id_entrada BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_equipe INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_emissor INT UNSIGNED NOT NULL,
    tipo ENUM('SOLICITACAO','CONVITE') NOT NULL,
    funcao_proposta VARCHAR(100) NULL,
    status ENUM('PENDENTE','ACEITA','RECUSADA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    pendente_usuario INT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN status = 'PENDENTE' THEN id_usuario ELSE NULL END
    ) STORED,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decidido_em DATETIME NULL,
    UNIQUE KEY uk_equipe_entrada_pendente (id_equipe, pendente_usuario),
    KEY idx_equipe_entradas_usuario (id_usuario, status, id_entrada),
    CONSTRAINT fk_equipe_entradas_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id_equipe),
    CONSTRAINT fk_equipe_entradas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_equipe_entradas_emissor FOREIGN KEY (id_emissor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_04_team_entries.sql:1';

    -- 91/176: 20261008_05_internal_tasks.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_05_internal_tasks.sql:1', 'efafe79d97cde7752e704a0011aa900b4bf8ecf8d82b5b5b863c212764ae8653', 'RUNNING');
ALTER TABLE equipes
    ADD UNIQUE KEY uk_equipes_id_sessao (id_equipe,id_sessao);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_05_internal_tasks.sql:1';

    -- 92/176: 20261008_05_internal_tasks.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_05_internal_tasks.sql:2', '1b4b47225e935bffc352e1096eb93c5e527cb07df40eda810c17723a774f79ca', 'RUNNING');
ALTER TABLE chamados
    ADD COLUMN id_equipe INT UNSIGNED NULL AFTER id_sessao,
    ADD KEY idx_chamados_equipe (id_equipe,id_sessao,id_chamado),
    ADD CONSTRAINT fk_chamados_equipe_sessao FOREIGN KEY (id_equipe,id_sessao) REFERENCES equipes(id_equipe,id_sessao),
    MODIFY COLUMN status ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO') NOT NULL DEFAULT 'ABERTO';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_05_internal_tasks.sql:2';

    -- 93/176: 20261008_05_internal_tasks.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_05_internal_tasks.sql:3', 'cce6334d3c34b4baabfd8c20b35b4b82887cfc348d87891455c4bb508f0fd211', 'RUNNING');
CREATE TABLE chamado_eventos (
    id_evento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_chamado INT UNSIGNED NOT NULL,
    id_ator INT UNSIGNED NOT NULL,
    acao ENUM('CRIADO','EDITADO','ATRIBUIDO','ACEITO','RESOLVIDO','FECHADO','CANCELADO') NOT NULL,
    status_anterior ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO') NULL,
    status_novo ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO','CANCELADO') NOT NULL,
    id_responsavel INT UNSIGNED NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_chamado_eventos_chamado (id_chamado,id_evento),
    CONSTRAINT fk_chamado_eventos_chamado FOREIGN KEY (id_chamado) REFERENCES chamados(id_chamado),
    CONSTRAINT fk_chamado_eventos_ator FOREIGN KEY (id_ator) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamado_eventos_responsavel FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_05_internal_tasks.sql:3';

    -- 94/176: 20261008_06_notification_dedupe.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_06_notification_dedupe.sql:1', '8c7766b76617bced041fd12c890d281be30d1501155e8130ef145814ba0de532', 'RUNNING');
ALTER TABLE notificacoes
    ADD COLUMN dedupe_key VARCHAR(191) NULL AFTER tipo,
    ADD UNIQUE KEY uk_notificacoes_usuario_evento (id_usuario,dedupe_key),
    ADD KEY idx_notificacoes_usuario_id (id_usuario,id_notificacao);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_06_notification_dedupe.sql:1';

    -- 95/176: 20261008_07_supplier_cnpj.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_07_supplier_cnpj.sql:1', 'bd3b1430a0db9b13621160d2b8973079803915b87f8962b5e1446d4deafec36a', 'RUNNING');
ALTER TABLE fornecedores
    ADD COLUMN cnpj_normalizado CHAR(14) CHARACTER SET ascii COLLATE ascii_bin
        GENERATED ALWAYS AS (UPPER(REPLACE(REPLACE(REPLACE(TRIM(cnpj), '.', ''), '/', ''), '-', ''))) STORED,
    ADD UNIQUE KEY uk_fornecedores_cnpj_normalizado (cnpj_normalizado);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_07_supplier_cnpj.sql:1';

    -- 96/176: 20261008_08_supplier_products.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_08_supplier_products.sql:1', 'b4de42ae96c0c229a6239c9f436739cac489d378102574ada7975cf7bac5fcf3', 'RUNNING');
CREATE TABLE fornecedor_locais (
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_fornecedor,id_local),
    KEY idx_fornecedor_locais_local (id_local,status),
    CONSTRAINT fk_fornecedor_locais_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_fornecedor_locais_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_08_supplier_products.sql:1';

    -- 97/176: 20261008_08_supplier_products.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_08_supplier_products.sql:2', 'ce11b93da57d6bbba2ea5ffd3c9a93557b0c9a0c0483153434bcdb2ccb90b772', 'RUNNING');
ALTER TABLE equipamentos
    ADD COLUMN patrimonio_normalizado VARCHAR(100)
        GENERATED ALWAYS AS (NULLIF(UPPER(TRIM(numero_patrimonio)), '')) STORED,
    ADD UNIQUE KEY uk_equipamentos_patrimonio_normalizado (patrimonio_normalizado);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_08_supplier_products.sql:2';

    -- 98/176: 20261008_09_combo_location.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261008_09_combo_location.sql:1', 'b2c234a713e40d7fc64e68f19f7663a93db72d1addb279a52322e3a1b1f3992a', 'RUNNING');
ALTER TABLE combos
    ADD COLUMN id_local INT UNSIGNED NULL AFTER id_combo,
    ADD KEY idx_combos_local_ativo (id_local, ativo, id_combo),
    ADD CONSTRAINT fk_combos_local FOREIGN KEY (id_local) REFERENCES locais(id_local);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261008_09_combo_location.sql:1';

    -- 99/176: 20261009_10_inventory_reservations.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_10_inventory_reservations.sql:1', 'a7f80c266f3ee32673698a8051ddef2ae0de4f83c3fe3b4594c67c8eba548309', 'RUNNING');
ALTER TABLE insumos
    ADD COLUMN quantidade_reservada INT NOT NULL DEFAULT 0 AFTER quantidade,
    ADD CONSTRAINT chk_insumos_reserva CHECK (quantidade_reservada >= 0 AND quantidade_reservada <= quantidade);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_10_inventory_reservations.sql:1';

    -- 100/176: 20261009_10_inventory_reservations.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_10_inventory_reservations.sql:2', '0f94e61a6913d5a34892629cd7ee3544a5b69b2c8d40f4283c10b40a5ffe2339', 'RUNNING');
CREATE TABLE estoque_reservas (
    id_reserva BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED NOT NULL,
    quantidade INT NOT NULL,
    status ENUM('ATIVA','CONSUMIDA','LIBERADA','COMPENSADA') NOT NULL DEFAULT 'ATIVA',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_estoque_reservas_pedido_insumo (id_pedido,id_insumo),
    KEY idx_estoque_reservas_insumo_status (id_insumo,status),
    CONSTRAINT chk_estoque_reservas_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_estoque_reservas_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_estoque_reservas_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_10_inventory_reservations.sql:2';

    -- 101/176: 20261009_10_inventory_reservations.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_10_inventory_reservations.sql:3', 'e469a66216cd79c9da78eb91746f83bf2d0692f01bdcb3cf761c6fab7ef4c2e8', 'RUNNING');
ALTER TABLE movimentacoes_estoque
    ADD COLUMN id_reserva BIGINT UNSIGNED NULL AFTER id_equipamento,
    ADD UNIQUE KEY uk_movestoque_reserva_tipo (id_reserva,tipo),
    ADD CONSTRAINT fk_movestoque_reserva FOREIGN KEY (id_reserva) REFERENCES estoque_reservas(id_reserva);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_10_inventory_reservations.sql:3';

    -- 102/176: 20261009_11_supply_logistics.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_11_supply_logistics.sql:1', '8e21f73945e463a5496d6d582dc2bd3943f22b31b756a3f4b2b92926f3680b46', 'RUNNING');
ALTER TABLE logistica
    ADD COLUMN id_insumo_origem INT UNSIGNED NULL AFTER id_solicitacao,
    ADD COLUMN id_equipamento_origem INT UNSIGNED NULL AFTER id_insumo_origem,
    ADD COLUMN id_insumo_destino INT UNSIGNED NULL AFTER id_equipamento_origem,
    ADD COLUMN quantidade INT NULL AFTER id_insumo_destino,
    ADD COLUMN id_usuario_recebimento INT UNSIGNED NULL AFTER quantidade,
    ADD COLUMN data_devolucao DATETIME NULL AFTER id_usuario_recebimento,
    ADD COLUMN id_usuario_devolucao INT UNSIGNED NULL AFTER data_devolucao,
    ADD UNIQUE KEY uk_logistica_solicitacao (id_solicitacao),
    ADD CONSTRAINT fk_logistica_insumo_origem FOREIGN KEY (id_insumo_origem) REFERENCES insumos(id_insumo),
    ADD CONSTRAINT fk_logistica_equipamento_origem FOREIGN KEY (id_equipamento_origem) REFERENCES equipamentos(id_equipamento),
    ADD CONSTRAINT fk_logistica_insumo_destino FOREIGN KEY (id_insumo_destino) REFERENCES insumos(id_insumo),
    ADD CONSTRAINT fk_logistica_recebedor FOREIGN KEY (id_usuario_recebimento) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT fk_logistica_devolvedor FOREIGN KEY (id_usuario_devolucao) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT chk_logistica_identidade CHECK (id_solicitacao IS NULL OR (COALESCE(quantidade,0) > 0 AND ((id_insumo_origem IS NOT NULL AND id_equipamento_origem IS NULL) OR (id_insumo_origem IS NULL AND id_equipamento_origem IS NOT NULL))));
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_11_supply_logistics.sql:1';

    -- 103/176: 20261009_11_supply_logistics.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_11_supply_logistics.sql:2', 'cbf636f4c61641546dcf2c9fa7e355730d7e4a5729bd03aa93c2f1f37cf4eeac', 'RUNNING');
ALTER TABLE logistica
    MODIFY COLUMN status ENUM('PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO','DEVOLVIDO') DEFAULT 'PENDENTE';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_11_supply_logistics.sql:2';

    -- 104/176: 20261009_11_supply_logistics.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_11_supply_logistics.sql:3', '244170f63c8f1a834f699ecd4b31b04a0b8a9d00ce7bcf880126f21c9c32af75', 'RUNNING');
ALTER TABLE movimentacoes_estoque
    ADD COLUMN id_logistica INT UNSIGNED NULL AFTER id_reserva,
    ADD UNIQUE KEY uk_movestoque_logistica_tipo (id_logistica,tipo),
    ADD CONSTRAINT fk_movestoque_logistica FOREIGN KEY (id_logistica) REFERENCES logistica(id_logistica);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_11_supply_logistics.sql:3';

    -- 105/176: 20261009_12_pricing.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:1', '35efbc7404bfff20cf03cd0fa0b0e9fc57d9d37e64d07b10cb398c40fef097f5', 'RUNNING');
ALTER TABLE insumos ADD COLUMN custo_receita DECIMAL(10,2) NULL, ADD COLUMN custo_parceria DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_insumos_custos CHECK ((custo_receita IS NULL OR custo_receita >= 0) AND (custo_parceria IS NULL OR custo_parceria >= 0));
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:1';

    -- 106/176: 20261009_12_pricing.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:2', '2bf79faf4b32951a1b54330126a7aea192bf271f89c7c97c7ed55f58cf32e8e2', 'RUNNING');
ALTER TABLE sessoes ADD COLUMN custo_local_dia DECIMAL(10,2) NULL, ADD COLUMN custo_exibicao DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_sessoes_custos CHECK ((custo_local_dia IS NULL OR custo_local_dia >= 0) AND (custo_exibicao IS NULL OR custo_exibicao >= 0));
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:2';

    -- 107/176: 20261009_12_pricing.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:3', '1bb87b60dc0b644e0a29949ee722177202e42aacb83f6cf14c2c15b102bf8800', 'RUNNING');
ALTER TABLE filmes ADD COLUMN custo_streaming_dia DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_filmes_custo_streaming CHECK (custo_streaming_dia IS NULL OR custo_streaming_dia >= 0);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:3';

    -- 108/176: 20261009_12_pricing.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:4', '10e7c08c154064cb43c85ab9af92e1494a9b9e7c1d85df9ddc9ff361c35497f2', 'RUNNING');
ALTER TABLE combos ADD COLUMN custo_operacional DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_combos_custo CHECK (custo_operacional IS NULL OR custo_operacional >= 0);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:4';

    -- 109/176: 20261009_12_pricing.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:5', '90b7a4f55412c8568e36fff2900a59ccd9d5f59655a076d31fa6b7233dcb19b0', 'RUNNING');
ALTER TABLE planos ADD COLUMN custo_beneficios_mensal DECIMAL(10,2) NULL, ADD COLUMN custo_beneficios_anual DECIMAL(10,2) NULL,
    ADD COLUMN combo_gratis_mes INT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_planos_custos CHECK ((custo_beneficios_mensal IS NULL OR custo_beneficios_mensal >= 0) AND (custo_beneficios_anual IS NULL OR custo_beneficios_anual >= 0) AND combo_gratis_mes >= 0);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:5';

    -- 110/176: 20261009_12_pricing.sql:6
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:6', '520a9c7e1467bdee97ffc3ff5dbd6fa4f15db24d39d536013078264889b30a28', 'RUNNING');
CREATE TABLE precificacao_parametros (
    categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PLAN') PRIMARY KEY,
    markup_bps SMALLINT UNSIGNED NOT NULL DEFAULT 6000,
    margem_alerta_bps SMALLINT UNSIGNED NOT NULL DEFAULT 2000,
    teto_desconto_bps SMALLINT UNSIGNED NOT NULL DEFAULT 2500,
    ocupacao_referencia SMALLINT UNSIGNED NOT NULL DEFAULT 20,
    meia_projecao_bps SMALLINT UNSIGNED NOT NULL DEFAULT 5000,
    combo_passo_bps SMALLINT UNSIGNED NOT NULL DEFAULT 500,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_precificacao_parametros CHECK (markup_bps <= 30000 AND margem_alerta_bps <= 10000 AND teto_desconto_bps <= 10000 AND ocupacao_referencia > 0 AND meia_projecao_bps <= 10000 AND combo_passo_bps <= 10000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:6';

    -- 111/176: 20261009_12_pricing.sql:7
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:7', '6412b48d1d890509356e8f3e2cd83df4521fd7f9acf5b5a38227b06a622d6411', 'RUNNING');
INSERT INTO precificacao_parametros(categoria) VALUES ('SESSION'),('INPUT'),('COMBO'),('RENTAL'),('PLAN');
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:7';

    -- 112/176: 20261009_12_pricing.sql:8
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:8', '0f4cffe2d43c6346ae0899dcb7de714ef3a98ef2f315c7817c6d3fee1d152983', 'RUNNING');
CREATE TABLE plano_beneficios (
    id_plano INT UNSIGNED NOT NULL,
    categoria ENUM('SESSION','INPUT','COMBO','RENTAL') NOT NULL,
    desconto_bps SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY(id_plano,categoria),
    CONSTRAINT fk_plano_beneficios_plano FOREIGN KEY(id_plano) REFERENCES planos(id_plano),
    CONSTRAINT chk_plano_beneficios_desconto CHECK(desconto_bps <= 10000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:8';

    -- 113/176: 20261009_12_pricing.sql:9
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:9', 'ed9980d3cc490e50a83f484ef28f77384ed2eabf9ad62bab9b89c5d87167b189', 'RUNNING');
CREATE TABLE promocoes_precificacao (
    id_promocao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PLAN') NOT NULL,
    desconto_bps SMALLINT UNSIGNED NOT NULL,
    publico_geral BOOLEAN NOT NULL DEFAULT FALSE,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_promocoes_desconto CHECK(desconto_bps > 0 AND desconto_bps <= 10000),
    CONSTRAINT chk_promocoes_periodo CHECK(fim > inicio),
    KEY idx_promocoes_ativas(categoria,ativo,inicio,fim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:9';

    -- 114/176: 20261009_12_pricing.sql:10
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:10', '42da751c073dbb6440e798e6c916e6463d0913fa0b456fc3062b6a1be357e77b', 'RUNNING');
CREATE TABLE cupom_utilizacoes (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    id_cupom INT UNSIGNED NOT NULL,
    desconto_bps SMALLINT UNSIGNED NOT NULL,
    status ENUM('RESERVADO','CONFIRMADO','LIBERADO') NOT NULL DEFAULT 'RESERVADO',
    expira_em DATETIME NULL,
    utilizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_cupom_utilizacoes_cupom(id_cupom),
    CONSTRAINT fk_cupom_utilizacoes_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_cupom_utilizacoes_cupom FOREIGN KEY(id_cupom) REFERENCES cupons(id_cupom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:10';

    -- 115/176: 20261009_12_pricing.sql:11
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:11', '3a17aa91d79b4db2aa95880ffea96e62c5654403d581fc31ba0159e5b6862673', 'RUNNING');
INSERT INTO cupom_utilizacoes(id_pedido,id_cupom,desconto_bps,status)
    SELECT id_pedido,id_cupom,CAST(ROUND(desconto*100,0) AS UNSIGNED),'CONFIRMADO' FROM pedidos JOIN cupons USING(id_cupom)
    WHERE id_cupom IS NOT NULL AND pedidos.status <> 'CANCELADO';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:11';

    -- 116/176: 20261009_12_pricing.sql:12
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_12_pricing.sql:12', 'e214f0def844cf22ce3efb5df3d283f5c82a171e9c68d76d4d56be5900ddcf54', 'RUNNING');
CREATE TABLE pedido_precificacao (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    snapshot JSON NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_precificacao_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT chk_pedido_precificacao_total CHECK(total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_12_pricing.sql:12';

    -- 117/176: 20261009_13_payment_methods.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_13_payment_methods.sql:1', '1ca72a67fec1103e88182439a0855a6e7700b84b09536d5ea21660fba1d0a8c5', 'RUNNING');
ALTER TABLE metodos_pagamento
    ADD COLUMN provider VARCHAR(40) NULL,
    ADD COLUMN provider_token VARCHAR(255) COLLATE utf8mb4_bin NULL,
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN principal_dono INT UNSIGNED GENERATED ALWAYS AS (CASE WHEN ativo = TRUE AND principal = TRUE THEN id_usuario ELSE NULL END) STORED,
    ADD CONSTRAINT chk_metodos_token_par CHECK ((provider IS NULL AND provider_token IS NULL) OR (provider IS NOT NULL AND provider_token IS NOT NULL)),
    ADD UNIQUE KEY uk_metodos_provider_token(provider,provider_token),
    ADD UNIQUE KEY uk_metodos_principal_dono(principal_dono),
    ADD KEY idx_metodos_dono_ativo(id_usuario,ativo);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_13_payment_methods.sql:1';

    -- 118/176: 20261009_13_payment_methods.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_13_payment_methods.sql:2', '9ae0ecff88967b1181049f1511d94b2bc515e92c04bf31ba436db64491308f9a', 'RUNNING');
CREATE TABLE pagamento_intencoes (
    id_intencao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    chave_idempotencia VARCHAR(120) NOT NULL,
    id_pedido BIGINT UNSIGNED NULL,
    id_cobranca BIGINT UNSIGNED NULL,
    id_metodo INT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    estado ENUM('PREPARADA','ENVIADA','CONCILIADA','CANCELADA') NOT NULL DEFAULT 'PREPARADA',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_intencao_pagador_chave(id_usuario,chave_idempotencia),
    KEY idx_intencao_pedido(id_pedido),
    KEY idx_intencao_cobranca(id_cobranca),
    CONSTRAINT fk_intencao_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_intencao_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_intencao_cobranca FOREIGN KEY(id_cobranca) REFERENCES assinatura_cobrancas(id_cobranca),
    CONSTRAINT fk_intencao_metodo FOREIGN KEY(id_metodo) REFERENCES metodos_pagamento(id_metodo),
    CONSTRAINT chk_intencao_obrigacao CHECK ((id_pedido IS NOT NULL AND id_cobranca IS NULL) OR (id_pedido IS NULL AND id_cobranca IS NOT NULL)),
    CONSTRAINT chk_intencao_valor CHECK (valor > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_13_payment_methods.sql:2';

    -- 119/176: 20261009_14_payments.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_14_payments.sql:1', 'a578d43243bff5153c157262839918f7db651f4b5dd29f94b9527236bad3c119', 'RUNNING');
ALTER TABLE pagamento_intencoes
    ADD COLUMN provider VARCHAR(40) NULL,
    ADD COLUMN provider_ref VARCHAR(150) COLLATE utf8mb4_bin NULL,
    ADD COLUMN moeda CHAR(3) NOT NULL DEFAULT 'BRL',
    ADD COLUMN enviado_em DATETIME(3) NULL,
    ADD COLUMN ultimo_evento_em DATETIME(3) NULL,
    ADD CONSTRAINT chk_intencao_moeda CHECK (moeda = 'BRL'),
    ADD KEY idx_intencao_provider_ref(provider,provider_ref);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_14_payments.sql:1';

    -- 120/176: 20261009_14_payments.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_14_payments.sql:2', '5b597400a6b3f3fb7756d7e5a4daafb7b706f12b8a67188b649f08f55110cb03', 'RUNNING');
ALTER TABLE pagamentos
    ADD COLUMN id_intencao BIGINT UNSIGNED NULL,
    ADD UNIQUE KEY uk_pagamentos_intencao(id_intencao),
    ADD CONSTRAINT fk_pagamentos_intencao FOREIGN KEY(id_intencao) REFERENCES pagamento_intencoes(id_intencao);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_14_payments.sql:2';

    -- 121/176: 20261009_14_payments.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261009_14_payments.sql:3', '040b640b4c6ecd8f484ed5470759528a8d619333e47d7b22a73765ebdd810a86', 'RUNNING');
CREATE TABLE pagamento_gateway_eventos (
    id_gateway_evento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(40) NOT NULL,
    evento_id VARCHAR(150) COLLATE utf8mb4_bin NOT NULL,
    id_intencao BIGINT UNSIGNED NOT NULL,
    tipo ENUM('WEBHOOK','CONSULTA') NOT NULL,
    status ENUM('PENDENTE','APROVADO','RECUSADO') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    moeda CHAR(3) NOT NULL,
    ocorrido_em DATETIME(3) NOT NULL,
    recebido_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_gateway_evento(provider,evento_id),
    KEY idx_gateway_evento_intencao(id_intencao,ocorrido_em),
    CONSTRAINT fk_gateway_evento_intencao FOREIGN KEY(id_intencao) REFERENCES pagamento_intencoes(id_intencao),
    CONSTRAINT chk_gateway_evento_valor CHECK(valor > 0),
    CONSTRAINT chk_gateway_evento_moeda CHECK(moeda = 'BRL')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261009_14_payments.sql:3';

    -- 122/176: 20261010_15_refunds.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_15_refunds.sql:1', '9529d9dc70f47667a6558f15f34e00665d84b58f7b11a53641493c0f85ba7b72', 'RUNNING');
ALTER TABLE pagamentos MODIFY COLUMN status ENUM('PENDENTE','APROVADO','RECUSADO','PARCIALMENTE_ESTORNADO','ESTORNADO') DEFAULT 'PENDENTE';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_15_refunds.sql:1';

    -- 123/176: 20261010_15_refunds.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_15_refunds.sql:2', '8e649522a829cc402ff5325743a57ad80732e0387b5a5c04ce864bda5404c4d0', 'RUNNING');
CREATE TABLE reembolso_solicitacoes (
    id_reembolso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pagamento BIGINT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    chave_idempotencia VARCHAR(120) NOT NULL,
    motivo ENUM('ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO') NOT NULL,
    detalhes VARCHAR(1000) NULL,
    dentro_prazo BOOLEAN NOT NULL,
    termos_versao VARCHAR(50) NULL,
    decisao_fundamento VARCHAR(1000) NULL,
    valor_solicitado DECIMAL(10,2) NULL,
    valor_confirmado DECIMAL(10,2) NULL,
    status ENUM('RECEBIDA','EM_ANALISE','ENVIADA','CONFIRMADA','NEGADA','FALHOU') NOT NULL DEFAULT 'RECEBIDA',
    provider_ref VARCHAR(150) COLLATE utf8mb4_bin NULL,
    compensacao_status ENUM('NAO_APLICAVEL','PENDENTE','CONCLUIDA') NOT NULL DEFAULT 'NAO_APLICAVEL',
    solicitado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    prazo_resposta_em DATETIME(3) NOT NULL,
    respondido_em DATETIME(3) NULL,
    aberta_pagamento BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status IN ('RECEBIDA','EM_ANALISE','ENVIADA') THEN id_pagamento ELSE NULL END) STORED,
    UNIQUE KEY uk_reembolso_usuario_chave(id_usuario,chave_idempotencia),
    UNIQUE KEY uk_reembolso_aberto(aberta_pagamento),
    KEY idx_reembolso_pagamento(id_pagamento),
    CONSTRAINT fk_reembolso_pagamento FOREIGN KEY(id_pagamento) REFERENCES pagamentos(id_pagamento),
    CONSTRAINT fk_reembolso_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_reembolso_valores CHECK ((valor_solicitado IS NULL OR valor_solicitado > 0) AND (valor_confirmado IS NULL OR (valor_confirmado > 0 AND valor_confirmado <= valor_solicitado)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_15_refunds.sql:2';

    -- 124/176: 20261010_16_seat_occupancy.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_16_seat_occupancy.sql:1', '7c93f2824cf9aca894a0721361679f26cf7562e4f8977e4fc15badb81381f425', 'RUNNING');
CREATE TABLE assento_ocupacoes (
    id_ocupacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_sessao INT UNSIGNED NOT NULL,
    id_assento INT UNSIGNED NOT NULL,
    id_pedido BIGINT UNSIGNED NOT NULL,
    id_item BIGINT UNSIGNED NULL,
    estado ENUM('RESERVADA','CONFIRMADA') NOT NULL,
    expira_em DATETIME(3) NULL,
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_ocupacao_sessao_assento (id_sessao,id_assento),
    UNIQUE KEY uk_ocupacao_item (id_item),
    KEY ix_ocupacao_pedido (id_pedido),
    KEY ix_ocupacao_expira (estado,expira_em),
    CONSTRAINT fk_ocupacao_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_ocupacao_assento FOREIGN KEY (id_assento) REFERENCES assentos(id_assento),
    CONSTRAINT fk_ocupacao_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_ocupacao_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item),
    CONSTRAINT chk_ocupacao_estado CHECK ((estado='RESERVADA' AND expira_em IS NOT NULL AND id_item IS NULL) OR (estado='CONFIRMADA' AND expira_em IS NULL AND id_item IS NOT NULL))
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_16_seat_occupancy.sql:1';

    -- 125/176: 20261010_16_seat_occupancy.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_16_seat_occupancy.sql:2', 'a8fb18382d594075530051f132f358a8bbec7d4fd9e4b77cdb24736f914da361', 'RUNNING');
INSERT INTO assento_ocupacoes (id_sessao,id_assento,id_pedido,id_item,estado,expira_em)
SELECT ip.id_sessao,ip.id_assento,ip.id_pedido,ip.id_item,'CONFIRMADA',NULL
FROM itens_pedido ip JOIN pedidos p ON p.id_pedido=ip.id_pedido
WHERE ip.id_sessao IS NOT NULL AND p.status IN ('PAGO','FINALIZADO');
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_16_seat_occupancy.sql:2';

    -- 126/176: 20261010_16_seat_occupancy.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_16_seat_occupancy.sql:3', 'ada660273edeba31d575e5d7a5075734d83beaa391032e12b54baa28b7cba2eb', 'RUNNING');
INSERT INTO assento_ocupacoes (id_sessao,id_assento,id_pedido,id_item,estado,expira_em)
SELECT ip.id_sessao,ip.id_assento,ip.id_pedido,NULL,'RESERVADA',DATE_ADD(p.data_pedido,INTERVAL 15 MINUTE)
FROM itens_pedido ip JOIN pedidos p ON p.id_pedido=ip.id_pedido
WHERE ip.id_sessao IS NOT NULL AND p.status IN ('EM_ANDAMENTO','AGUARDANDO_PAGAMENTO')
  AND DATE_ADD(p.data_pedido,INTERVAL 15 MINUTE)>UTC_TIMESTAMP(3);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_16_seat_occupancy.sql:3';

    -- 127/176: 20261010_16_seat_occupancy.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_16_seat_occupancy.sql:4', '08db9486fbf7b5cf3e07533563a0d9b45d0cdb1a36f8b87db3493bad84c8f364', 'RUNNING');
ALTER TABLE itens_pedido ADD KEY ix_itens_sessao_assento_historico (id_sessao,id_assento);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_16_seat_occupancy.sql:4';

    -- 128/176: 20261010_16_seat_occupancy.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_16_seat_occupancy.sql:5', 'a91f3883d1862141bddc232d5b2224197d26e598df8dcd99c45622a783dc847a', 'RUNNING');
ALTER TABLE itens_pedido DROP INDEX uk_sessao_assento;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_16_seat_occupancy.sql:5';

    -- 129/176: 20261010_17_streaming_purchase_pricing.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_17_streaming_purchase_pricing.sql:1', '99f69732b1e4740f8d7646c7c7a0ed14ba97f23496495030814763f9b1d4b0d0', 'RUNNING');
ALTER TABLE filmes ADD COLUMN custo_streaming_compra DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_filmes_custo_compra CHECK (custo_streaming_compra IS NULL OR custo_streaming_compra >= 0);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_17_streaming_purchase_pricing.sql:1';

    -- 130/176: 20261010_17_streaming_purchase_pricing.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_17_streaming_purchase_pricing.sql:2', '40c5ea9b524231740fb6758e3ea8d3cd4346ddd48a2109b04bbdbd06a28e1e52', 'RUNNING');
ALTER TABLE precificacao_parametros MODIFY categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PURCHASE','PLAN') NOT NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_17_streaming_purchase_pricing.sql:2';

    -- 131/176: 20261010_17_streaming_purchase_pricing.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_17_streaming_purchase_pricing.sql:3', 'edec6834ef48fd9f96d4ec05b467231a1ec89cde98b4bb666ddb2c315c5a3617', 'RUNNING');
INSERT INTO precificacao_parametros(categoria) VALUES ('PURCHASE');
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_17_streaming_purchase_pricing.sql:3';

    -- 132/176: 20261010_17_streaming_purchase_pricing.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_17_streaming_purchase_pricing.sql:4', '1427f4a72b0e72a0fa636328eb0f96567ca9e4d746b0fc30d710c3af5942a4c5', 'RUNNING');
ALTER TABLE plano_beneficios MODIFY categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PURCHASE') NOT NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_17_streaming_purchase_pricing.sql:4';

    -- 133/176: 20261010_17_streaming_purchase_pricing.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_17_streaming_purchase_pricing.sql:5', '7685710ed8e3cff3405ff6cc4fdd99096d00ee2c8e558a7ef3edf92c7a5fc44e', 'RUNNING');
ALTER TABLE promocoes_precificacao MODIFY categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PURCHASE','PLAN') NOT NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_17_streaming_purchase_pricing.sql:5';

    -- 134/176: 20261010_18_checkout_expiry.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_18_checkout_expiry.sql:1', 'ece6d0bb237668377e1673ad25ee77e3aa11191daba2441dd21dba221204d1c2', 'RUNNING');
ALTER TABLE pedidos
    ADD COLUMN checkout_key VARCHAR(120) COLLATE utf8mb4_bin NULL,
    ADD COLUMN checkout_hash CHAR(64) COLLATE utf8mb4_bin NULL,
    ADD COLUMN checkout_expira_em DATETIME(3) NULL,
    ADD UNIQUE KEY uk_pedidos_checkout_usuario_chave (id_usuario,checkout_key),
    ADD KEY ix_pedidos_checkout_expira (status,checkout_expira_em),
    ADD CONSTRAINT chk_pedidos_checkout_meta CHECK
      ((checkout_key IS NULL AND checkout_hash IS NULL AND checkout_expira_em IS NULL) OR
       (checkout_key IS NOT NULL AND checkout_hash IS NOT NULL AND checkout_expira_em IS NOT NULL));
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_18_checkout_expiry.sql:1';

    -- 135/176: 20261010_18_checkout_expiry.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_18_checkout_expiry.sql:2', '3f18f60b4503954d9f7f87b4cda772499c5d783455f72abe09627edf250c6f06', 'RUNNING');
ALTER TABLE cupom_utilizacoes MODIFY expira_em DATETIME(3) NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_18_checkout_expiry.sql:2';

    -- 136/176: 20261010_19_tickets.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_19_tickets.sql:1', '130bd0d2472e2af3f38c635f93860a90512b7bd93c5b8f1ee1bcbd30097b482b', 'RUNNING');
ALTER TABLE itens_pedido
    ADD COLUMN id_sessao_retirada INT UNSIGNED NULL,
    ADD KEY ix_itens_sessao_retirada (id_sessao_retirada),
    ADD CONSTRAINT fk_itens_sessao_retirada FOREIGN KEY (id_sessao_retirada) REFERENCES sessoes(id_sessao),
    ADD CONSTRAINT chk_itens_sessao_retirada CHECK (id_sessao_retirada IS NULL OR id_combo IS NOT NULL);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_19_tickets.sql:1';

    -- 137/176: 20261010_19_tickets.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_19_tickets.sql:2', '1ad7b4da30e106bd96c355bf149fdff8bc5be6fe28b112a261b938bfee869d60', 'RUNNING');
ALTER TABLE tickets
    ADD COLUMN unidade INT UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN id_sessao_retirada INT UNSIGNED NULL,
    ADD COLUMN expira_em DATETIME(3) NULL,
    ADD COLUMN conferido_por INT UNSIGNED NULL,
    ADD COLUMN meia_comprovacao ENUM('CIE','PCD','ID_JOVEM','IDOSO') NULL,
    ADD COLUMN saida_em DATETIME(3) NULL,
    ADD COLUMN saida_por INT UNSIGNED NULL,
    ADD UNIQUE KEY uk_ticket_item_tipo_unidade (id_item,tipo,unidade),
    ADD KEY ix_ticket_sessao_retirada (id_sessao_retirada,status),
    ADD CONSTRAINT fk_ticket_sessao_retirada FOREIGN KEY (id_sessao_retirada) REFERENCES sessoes(id_sessao),
    ADD CONSTRAINT fk_ticket_conferido_por FOREIGN KEY (conferido_por) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT fk_ticket_saida_por FOREIGN KEY (saida_por) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT chk_ticket_unidade CHECK (unidade > 0),
    ADD CONSTRAINT chk_ticket_meia CHECK (meia_comprovacao IS NULL OR conferido_por IS NOT NULL),
    ADD CONSTRAINT chk_ticket_saida CHECK ((saida_em IS NULL AND saida_por IS NULL) OR (saida_em IS NOT NULL AND saida_por IS NOT NULL AND status='UTILIZADO' AND tipo='INGRESSO_SESSAO'));
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_19_tickets.sql:2';

    -- 138/176: 20261010_20_ticket_passages.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_20_ticket_passages.sql:1', 'cd5303fe1c59f8ccfb4571c41b9afb6c0edd08511f6e66a95f4c380cacb81fb5', 'RUNNING');
CREATE TABLE ticket_passagens (
    id_passagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ticket BIGINT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA','SAIDA') NOT NULL,
    ocorrido_em DATETIME(3) NOT NULL,
    id_usuario_staff INT UNSIGNED NULL,
    meia_comprovacao ENUM('CIE','PCD','ID_JOVEM','IDOSO') NULL,
    CONSTRAINT fk_passagem_ticket FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket),
    CONSTRAINT fk_passagem_staff FOREIGN KEY (id_usuario_staff) REFERENCES usuarios(id_usuario),
    KEY ix_passagem_ticket_ultima (id_ticket,id_passagem)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_20_ticket_passages.sql:1';

    -- 139/176: 20261010_20_ticket_passages.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_20_ticket_passages.sql:2', '39f6bb35c1efdd9520f90aa09cf50709c9919c9073d291f1fd5cc2274c0498da', 'RUNNING');
INSERT INTO ticket_passagens(id_ticket,tipo,ocorrido_em,id_usuario_staff,meia_comprovacao)
SELECT id_ticket,'ENTRADA',COALESCE(data_utilizacao,data_geracao,UTC_TIMESTAMP(3)),conferido_por,meia_comprovacao
FROM tickets WHERE tipo='INGRESSO_SESSAO' AND status='UTILIZADO';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_20_ticket_passages.sql:2';

    -- 140/176: 20261010_20_ticket_passages.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_20_ticket_passages.sql:3', '34d6323e7134879e75348acfb037f857ff27db5d2515cdf1e66172809b65a97e', 'RUNNING');
INSERT INTO ticket_passagens(id_ticket,tipo,ocorrido_em,id_usuario_staff)
SELECT id_ticket,'SAIDA',saida_em,saida_por
FROM tickets WHERE tipo='INGRESSO_SESSAO' AND status='UTILIZADO' AND saida_em IS NOT NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_20_ticket_passages.sql:3';

    -- 141/176: 20261010_21_streaming_rental_snapshot.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_21_streaming_rental_snapshot.sql:1', '3163785b7a2faadfaca45ff23dc07bd4313b0fb4ab3343fa2cda25bd34b57c90', 'RUNNING');
ALTER TABLE itens_pedido
    ADD COLUMN dias_acesso_aluguel_snapshot INT UNSIGNED NULL,
    ADD CONSTRAINT chk_item_aluguel_snapshot CHECK (
        dias_acesso_aluguel_snapshot IS NULL OR
        (tipo_streaming='ALUGUEL' AND dias_acesso_aluguel_snapshot BETWEEN 1 AND 36500)
    );
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_21_streaming_rental_snapshot.sql:1';

    -- 142/176: 20261010_22_plan_contracts.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_22_plan_contracts.sql:1', '71469de2894868aa44082be24ca33d77dfb15aab9b9aefa3880dad1a4fecbe6c', 'RUNNING');
ALTER TABLE planos
    ADD COLUMN acesso_catalogo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN id_combo_medio INT UNSIGNED NULL,
    ADD CONSTRAINT fk_planos_combo_medio FOREIGN KEY (id_combo_medio) REFERENCES combos(id_combo),
    ADD CONSTRAINT chk_planos_limite_membros CHECK (limite_membros BETWEEN 1 AND 100);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_22_plan_contracts.sql:1';

    -- 143/176: 20261010_22_plan_contracts.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_22_plan_contracts.sql:2', '2f88fc9e67e069f4b3a52654941c73400b086b5751ffa3b0307e015e7f08c507', 'RUNNING');
ALTER TABLE assinaturas
    ADD COLUMN chave_contratacao VARCHAR(120) COLLATE utf8mb4_bin NULL,
    ADD COLUMN contratacao_hash CHAR(64) COLLATE utf8mb4_bin NULL,
    ADD COLUMN contrato_snapshot JSON NULL,
    ADD COLUMN preco_contratado DECIMAL(10,2) NULL,
    ADD COLUMN limite_membros_contratado INT UNSIGNED NULL,
    ADD UNIQUE KEY uk_assinatura_titular_chave (id_usuario,chave_contratacao),
    ADD CONSTRAINT chk_assinatura_preco_contratado CHECK (preco_contratado IS NULL OR preco_contratado > 0);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_22_plan_contracts.sql:2';

    -- 144/176: 20261010_22_plan_contracts.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261010_22_plan_contracts.sql:3', '07aec56fa34ca4795ef20e309858bbe6311f85885f2d059af128e6fd80d5c368', 'RUNNING');
CREATE TABLE beneficio_resgates (
    id_resgate BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_combo INT UNSIGNED NOT NULL,
    competencia DATE NOT NULL,
    status ENUM('SOLICITADO','ENTREGUE','CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
    solicitado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_resgate_assinatura_competencia (id_assinatura,competencia),
    CONSTRAINT fk_resgate_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_resgate_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_resgate_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261010_22_plan_contracts.sql:3';

    -- 145/176: 20261011_23_plan_participants.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_23_plan_participants.sql:1', '27dea6094b3ca905a5cb623dc1ffd4f6a58169f68e066728ef438eeca7244390', 'RUNNING');
CREATE TABLE assinatura_participantes (
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    status ENUM('ATIVO','SAIU','SUSPENSO') NOT NULL DEFAULT 'ATIVO',
    entrada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    saida_em DATETIME(3) NULL,
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id_assinatura,id_usuario),
    CONSTRAINT fk_assinatura_participante_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_assinatura_participante_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_23_plan_participants.sql:1';

    -- 146/176: 20261011_23_plan_participants.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_23_plan_participants.sql:2', '4261a7cf9b57c168c3ba5cd74e248a9910b57cc3ad00f070ad3eb9b7b494395e', 'RUNNING');
INSERT INTO assinatura_participantes (id_assinatura,id_usuario,status,entrada_em)
SELECT id_assinatura,id_usuario_convidado,'ATIVO',COALESCE(data_resposta,data_convite)
FROM convites_plano WHERE status='ACEITO';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_23_plan_participants.sql:2';

    -- 147/176: 20261011_23_plan_participants.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_23_plan_participants.sql:3', '3c0ae1816d471ca93d81903404b574d0b0e9cfb939491e8232f95e4b1547954b', 'RUNNING');
CREATE TABLE assinatura_participante_eventos (
    id_evento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_ator INT UNSIGNED NOT NULL,
    evento ENUM('ENTROU','SAIU','SUSPENSO','REATIVADO') NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_participante_evento_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_participante_evento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_participante_evento_ator FOREIGN KEY (id_ator) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_23_plan_participants.sql:3';

    -- 148/176: 20261011_23_plan_participants.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_23_plan_participants.sql:4', '2440388e47b0e6874ce933c2fa6b725400c9d50b98899749de6f4b530a9ba88d', 'RUNNING');
INSERT INTO assinatura_participante_eventos (id_assinatura,id_usuario,id_ator,evento,criado_em)
SELECT v.id_assinatura,v.id_usuario_convidado,v.id_usuario_convidado,'ENTROU',COALESCE(v.data_resposta,v.data_convite)
FROM convites_plano v WHERE v.status='ACEITO';
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_23_plan_participants.sql:4';

    -- 149/176: 20261011_23_plan_participants.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_23_plan_participants.sql:5', '8eeb1c5d12364e62a04eb4eb118499763c42578d446a4084e0556be38fb153a8', 'RUNNING');
ALTER TABLE assinaturas
    ADD COLUMN tipo_divisao_proximo ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NULL,
    ADD COLUMN tipo_divisao_efetiva_em DATE NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_23_plan_participants.sql:5';

    -- 150/176: 20261011_23_plan_participants.sql:6
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_23_plan_participants.sql:6', '756900baa5b4048a9d001494fece5a133b9e11f882139be53a2e6bab22d3d20d', 'RUNNING');
CREATE TABLE assinatura_rateio_propostas (
    id_proposta BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_proponente INT UNSIGNED NOT NULL,
    tipo_divisao ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NOT NULL,
    competencia_efetiva DATE NOT NULL,
    status ENUM('PENDENTE','APROVADA','REJEITADA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    decidida_em DATETIME(3) NULL,
    CONSTRAINT fk_rateio_proposta_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_rateio_proposta_proponente FOREIGN KEY (id_proponente) REFERENCES usuarios(id_usuario),
    KEY idx_rateio_proposta_status (id_assinatura,status)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_23_plan_participants.sql:6';

    -- 151/176: 20261011_23_plan_participants.sql:7
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_23_plan_participants.sql:7', 'b973534f6abbeed249ab47cdbda722c18145c712c6abeaaebc078e0ee5f73e88', 'RUNNING');
CREATE TABLE assinatura_rateio_consensos (
    id_proposta BIGINT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','ACEITO','RECUSADO') NOT NULL DEFAULT 'PENDENTE',
    decidido_em DATETIME(3) NULL,
    PRIMARY KEY (id_proposta,id_usuario),
    CONSTRAINT fk_rateio_consenso_proposta FOREIGN KEY (id_proposta) REFERENCES assinatura_rateio_propostas(id_proposta),
    CONSTRAINT fk_rateio_consenso_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_23_plan_participants.sql:7';

    -- 152/176: 20261011_24_subscription_billing.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_24_subscription_billing.sql:1', '5d44af4515e873f43ac8099a8a72753ddedf6db9c9f44c07f3c7cf941fe19ca5', 'RUNNING');
ALTER TABLE assinatura_cobrancas
    ADD COLUMN juros_mora DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN correcao_ipca DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN encargos_calculados_ate DATE NULL,
    ADD COLUMN ipca_periodo_final CHAR(6) NULL,
    ADD CONSTRAINT chk_cobrancas_encargos CHECK (juros_mora >= 0);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_24_subscription_billing.sql:1';

    -- 153/176: 20261011_24_subscription_billing.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_24_subscription_billing.sql:2', '3f9583b8023758d0029261370a903058e5e962b90c99950ebda46375d1c66b00', 'RUNNING');
ALTER TABLE assinaturas
    ADD COLUMN suspenso_por_cobranca BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_24_subscription_billing.sql:2';

    -- 154/176: 20261011_24_subscription_billing.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_24_subscription_billing.sql:3', '0a7412bb351b80048a3d0b1a2e8095c38de90fb5866dadaed4364de3ee98fca4', 'RUNNING');
ALTER TABLE assinatura_participantes
    ADD COLUMN suspenso_por_cobranca BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_24_subscription_billing.sql:3';

    -- 155/176: 20261011_24_subscription_billing.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_24_subscription_billing.sql:4', 'a3dd92440846636699d099008c18c3d3eed4ea975db5e4f3476544abfe0e1ca5', 'RUNNING');
CREATE TABLE assinatura_ciclos (
    id_ciclo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    competencia DATE NOT NULL,
    vencimento DATE NOT NULL,
    tipo_divisao ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    participantes_snapshot JSON NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_assinatura_ciclo (id_assinatura,competencia),
    CONSTRAINT fk_ciclo_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT chk_ciclo_total CHECK (valor_total > 0)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_24_subscription_billing.sql:4';

    -- 156/176: 20261011_24_subscription_billing.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_24_subscription_billing.sql:5', 'b9c213c159270419b7d656fa3d112705728ceb3adf8baa533f4077994a151be1', 'RUNNING');
CREATE TABLE assinatura_cobranca_marcos (
    id_marco BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cobranca BIGINT UNSIGNED NOT NULL,
    marco ENUM('ATRASO_1','SUSPENSAO_8','CANCELAMENTO_30') NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_cobranca_marco (id_cobranca,marco),
    CONSTRAINT fk_marco_cobranca FOREIGN KEY (id_cobranca) REFERENCES assinatura_cobrancas(id_cobranca)
);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_24_subscription_billing.sql:5';

    -- 157/176: 20261011_25_newsletter_management.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_25_newsletter_management.sql:1', '6df9490793a056d19c5adadab905abb0b25cf9d5011239e2b8d0fd9063ae8276', 'RUNNING');
ALTER TABLE newsletter_tokens
    MODIFY COLUMN finalidade ENUM('CONFIRMACAO','DESCADASTRO','GESTAO') NOT NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_25_newsletter_management.sql:1';

    -- 158/176: 20261011_26_newsletter_delivery_suppression.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_26_newsletter_delivery_suppression.sql:1', 'b1c717c858babe733a8b15a0d790504e2c1c94c21d033db738bbafbd992919a0', 'RUNNING');
CREATE TABLE newsletter_bloqueios (
    id_inscrito INT UNSIGNED PRIMARY KEY,
    motivo ENUM('BOUNCE','COMPLAINT') NOT NULL,
    id_evento_provedor VARCHAR(255) NOT NULL,
    bloqueado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_newsletter_bloqueios_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_26_newsletter_delivery_suppression.sql:1';

    -- 159/176: 20261011_27_support_history.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_27_support_history.sql:1', 'b1400612d94a70393533e9d7719002d602afa19e14259e28c5ae4cd771d0e3c3', 'RUNNING');
ALTER TABLE suporte
    ADD COLUMN prazo_resposta_em DATETIME NULL,
    ADD COLUMN primeira_resposta_em DATETIME NULL,
    ADD COLUMN ultima_interacao_em DATETIME NULL,
    ADD KEY idx_suporte_fila (status, prazo_resposta_em, id_suporte);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_27_support_history.sql:1';

    -- 160/176: 20261011_27_support_history.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_27_support_history.sql:2', '672d827363eafbd22a18cf3db86640f68b0609e807f2438f4cf71b292eae12c7', 'RUNNING');
UPDATE suporte SET prazo_resposta_em=DATE_ADD(data_abertura,INTERVAL 5 DAY),
    ultima_interacao_em=data_abertura
WHERE prazo_resposta_em IS NULL;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_27_support_history.sql:2';

    -- 161/176: 20261011_27_support_history.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_27_support_history.sql:3', '4d378d9131be0e66ca85f4afed453d5325f1547c69003fc632ff1a834f2d560c', 'RUNNING');
CREATE TABLE suporte_mensagens (
    id_mensagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_suporte INT UNSIGNED NOT NULL,
    id_autor INT UNSIGNED NULL,
    papel ENUM('CLIENTE','ADMIN') NOT NULL,
    mensagem TEXT NOT NULL,
    registrada_em DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    origem ENUM('NOVA','LEGADO_ABERTURA','LEGADO_RESPOSTA') NOT NULL DEFAULT 'NOVA',
    KEY idx_suporte_mensagens_historico (id_suporte,id_mensagem),
    CONSTRAINT fk_suporte_mensagens_suporte FOREIGN KEY (id_suporte) REFERENCES suporte(id_suporte),
    CONSTRAINT fk_suporte_mensagens_autor FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_27_support_history.sql:3';

    -- 162/176: 20261011_27_support_history.sql:4
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_27_support_history.sql:4', 'b416aec10e058f73379865ec2c5e27d714e29d3b501964b77ec9dcea60afc532', 'RUNNING');
INSERT INTO suporte_mensagens(id_suporte,id_autor,papel,mensagem,registrada_em,origem)
SELECT id_suporte,id_cliente,'CLIENTE',mensagem,data_abertura,'LEGADO_ABERTURA'
FROM suporte WHERE mensagem IS NOT NULL AND CHAR_LENGTH(TRIM(mensagem))>0;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_27_support_history.sql:4';

    -- 163/176: 20261011_27_support_history.sql:5
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_27_support_history.sql:5', 'f5f8537efbe6bdfbb2ee0796245144324b58b6cc529e695fa3faddb1045b5897', 'RUNNING');
INSERT INTO suporte_mensagens(id_suporte,id_autor,papel,mensagem,registrada_em,origem)
SELECT id_suporte,id_atendente,'ADMIN',resposta,NULL,'LEGADO_RESPOSTA'
FROM suporte WHERE resposta IS NOT NULL AND CHAR_LENGTH(TRIM(resposta))>0;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_27_support_history.sql:5';

    -- 164/176: 20261011_27_support_history.sql:6
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_27_support_history.sql:6', '0110700d72c155646fe467dd8cf76fd1082b2e5dfa38c078b0a189ffa0cda3b5', 'RUNNING');
CREATE TABLE suporte_atendimentos (
    id_atendimento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_suporte INT UNSIGNED NOT NULL,
    id_atendente INT UNSIGNED NOT NULL,
    iniciado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrado_em DATETIME NULL,
    id_suporte_ativo INT UNSIGNED GENERATED ALWAYS AS (IF(encerrado_em IS NULL,id_suporte,NULL)) STORED,
    UNIQUE KEY uk_suporte_atendimento_ativo (id_suporte_ativo),
    KEY idx_suporte_atendimentos_historico (id_suporte,id_atendimento),
    KEY idx_suporte_atendimentos_expiracao (encerrado_em,iniciado_em,id_suporte),
    CONSTRAINT chk_suporte_atendimento_10min CHECK (encerrado_em IS NULL OR
        (encerrado_em>=iniciado_em AND encerrado_em<=DATE_ADD(iniciado_em,INTERVAL 10 MINUTE))),
    CONSTRAINT fk_suporte_atendimento_suporte FOREIGN KEY (id_suporte) REFERENCES suporte(id_suporte),
    CONSTRAINT fk_suporte_atendimento_admin FOREIGN KEY (id_atendente) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_27_support_history.sql:6';

    -- 165/176: 20261011_28_content_contracts.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_28_content_contracts.sql:1', '4cac7f0de507ad0221013bc863c0cbbd0cb6db3d5b4adb6eb2daa2b296f97392', 'RUNNING');
CREATE TABLE conteudos_publicados (
    id_conteudo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug ENUM('business','team','history','reputation','partners','social-campaigns','terms','privacy','faq') NOT NULL,
    versao VARCHAR(50) COLLATE utf8mb4_bin NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    corpo JSON NOT NULL,
    fonte VARCHAR(500) NOT NULL,
    id_publicador INT UNSIGNED NOT NULL,
    publicado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_conteudo_versao (slug,versao),
    KEY ix_conteudo_atual (slug,id_conteudo),
    CONSTRAINT fk_conteudo_publicador FOREIGN KEY (id_publicador) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_28_content_contracts.sql:1';

    -- 166/176: 20261011_28_content_contracts.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_28_content_contracts.sql:2', 'bbff071cdf71d51a5c413e99d62e0c4ae6a34e1857abe69a8cae068a66754810', 'RUNNING');
CREATE TABLE pedido_contratos (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    oferta_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL,
    contrato_snapshot JSON NOT NULL,
    aceito_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_pedido_contrato FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_28_content_contracts.sql:2';

    -- 167/176: 20261011_29_admin_reports.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_29_admin_reports.sql:1', '243b0f6ebaf4563b5ccab3d52fdce9922688e889557621ff0bde0ec41ff9a6d0', 'RUNNING');
ALTER TABLE pagamentos ADD KEY idx_pagamentos_relatorio (data_pagamento,status,id_pedido,id_cobranca);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_29_admin_reports.sql:1';

    -- 168/176: 20261011_29_admin_reports.sql:2
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_29_admin_reports.sql:2', '5ec47d467804dd00824ac0eac3922ad69476d4022879f331a7041e63f01eca33', 'RUNNING');
ALTER TABLE reembolso_solicitacoes ADD KEY idx_reembolsos_relatorio (respondido_em,status,id_pagamento);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_29_admin_reports.sql:2';

    -- 169/176: 20261011_29_admin_reports.sql:3
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_29_admin_reports.sql:3', '891d3219f2208259345bd5339f68d68b3156ec8bfb4eb229ab425013c781ad5c', 'RUNNING');
ALTER TABLE auditoria_eventos ADD KEY idx_auditoria_relatorio (occurred_at,id_auditoria);
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_29_admin_reports.sql:3';

    -- 170/176: 20261011_30_order_manual_cancellation.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261011_30_order_manual_cancellation.sql:1', 'e38ca4804bf0ec38f80f8ae3915e4712ec132757b25a508214144638156bbba8', 'RUNNING');
CREATE TABLE pedido_cancelamentos (
    id_cancelamento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_pedido BIGINT UNSIGNED NOT NULL,
    chave_idempotencia VARCHAR(120) NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_pedido_cancelamento_usuario_chave(id_usuario,chave_idempotencia),
    KEY idx_pedido_cancelamento_pedido(id_pedido),
    CONSTRAINT fk_pedido_cancelamento_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_pedido_cancelamento_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261011_30_order_manual_cancellation.sql:1';

    -- 171/176: 20261025_31_streaming_profiles.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261025_31_streaming_profiles.sql:1', '6999c4069cb2d69c22ca137ce439f259d3878538321e30ab53f9cfb55c56f976', 'RUNNING');
CREATE TABLE streaming_perfis (
    id_perfil INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    nome VARCHAR(24) NOT NULL,
    nome_chave VARBINARY(192) NOT NULL,
    avatar ENUM('astronauta','gato','lua','pipoca','fantasma','robo','raposa','estrela') NOT NULL DEFAULT 'astronauta',
    infantil BOOLEAN NOT NULL DEFAULT FALSE,
    selecionado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_streaming_perfil_nome (id_usuario,nome_chave),
    CONSTRAINT fk_streaming_perfil_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261025_31_streaming_profiles.sql:1';

    -- 172/176: 20261025_32_streaming_favorites.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261025_32_streaming_favorites.sql:1', 'b339267661d0c26635c6d3bc101139689a765217c03b259f5b0a2bbd7031d635', 'RUNNING');
CREATE TABLE streaming_favoritos (
    id_favorito BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_perfil INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_streaming_favorito_perfil_filme (id_perfil,id_filme),
    KEY idx_streaming_favorito_perfil_id (id_perfil,id_favorito),
    CONSTRAINT fk_streaming_favorito_perfil FOREIGN KEY(id_perfil) REFERENCES streaming_perfis(id_perfil) ON DELETE CASCADE,
    CONSTRAINT fk_streaming_favorito_filme FOREIGN KEY(id_filme) REFERENCES filmes(id_filme)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261025_32_streaming_favorites.sql:1';

    -- 173/176: 20261025_33_streaming_progress.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261025_33_streaming_progress.sql:1', '4b4946e15d7ae4af42c30319bee454ec936a94e99c2791b8659214547b651821', 'RUNNING');
CREATE TABLE streaming_progresso (
    id_progresso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_perfil INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    posicao_segundos INT UNSIGNED NOT NULL,
    duracao_segundos INT UNSIGNED NOT NULL,
    concluido BOOLEAN NOT NULL DEFAULT FALSE,
    versao INT UNSIGNED NOT NULL DEFAULT 1,
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_streaming_progresso_perfil_filme (id_perfil,id_filme),
    KEY idx_streaming_progresso_recente (id_perfil,atualizado_em,id_progresso),
    CONSTRAINT chk_streaming_progresso_posicao CHECK (duracao_segundos>0 AND posicao_segundos<=duracao_segundos),
    CONSTRAINT fk_streaming_progresso_perfil FOREIGN KEY(id_perfil) REFERENCES streaming_perfis(id_perfil) ON DELETE CASCADE,
    CONSTRAINT fk_streaming_progresso_filme FOREIGN KEY(id_filme) REFERENCES filmes(id_filme)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261025_33_streaming_progress.sql:1';

    -- 174/176: 20261025_34_input_retail_publication.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261025_34_input_retail_publication.sql:1', '5af9d8d316fa159d213d7ca4dae0f9165991c751f238fd9c0f8f8e8e1f2b102c', 'RUNNING');
ALTER TABLE insumos ADD COLUMN venda_avulsa BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261025_34_input_retail_publication.sql:1';

    -- 175/176: 20261026_35_promotional_content.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261026_35_promotional_content.sql:1', '4e615dbf4587b130995e2202fc9301e4aaa228ec8f80f1fb2006dc7c81631efa', 'RUNNING');
CREATE TABLE conteudos_promocionais (
 id_conteudo INT UNSIGNED NOT NULL AUTO_INCREMENT,
 tipo ENUM('partners','experiences','banners') NOT NULL,
 slug VARCHAR(100) NOT NULL,
 ativo BOOLEAN NOT NULL DEFAULT FALSE,
 dados JSON NOT NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (id_conteudo),
 UNIQUE KEY uq_promocional_slug (tipo, slug),
 KEY idx_promocional_publico (tipo, ativo, id_conteudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261026_35_promotional_content.sql:1';

    -- 176/176: 20261026_36_streaming_profile_photos.sql:1
    INSERT INTO schema_migrations (name, checksum, status) VALUES ('20261026_36_streaming_profile_photos.sql:1', 'b54b9c755caf29e885004b9c7a4a6ae3a71b412dafa75e80fc71bae7bd539ccc', 'RUNNING');
CREATE TABLE streaming_perfil_fotos (
 id_perfil INT UNSIGNED NOT NULL PRIMARY KEY,
 imagem MEDIUMBLOB NOT NULL,
 largura SMALLINT UNSIGNED NOT NULL,
 altura SMALLINT UNSIGNED NOT NULL,
 atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 CONSTRAINT fk_perfil_foto FOREIGN KEY (id_perfil) REFERENCES streaming_perfis(id_perfil) ON DELETE CASCADE,
 CONSTRAINT chk_perfil_foto_bytes CHECK (OCTET_LENGTH(imagem) BETWEEN 1 AND 262144),
 CONSTRAINT chk_perfil_foto_dim CHECK (largura BETWEEN 1 AND 512 AND altura BETWEEN 1 AND 512)
) ENGINE=InnoDB;
    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '20261026_36_streaming_profile_photos.sql:1';

    DO RELEASE_LOCK(CONCAT(DATABASE(), ':cineastra:migrate'));
    SET install_lock_acquired = 0;
END$$
DELIMITER ;

CALL _cineastra_install();
DROP PROCEDURE _cineastra_install;

SELECT DATABASE() AS banco, COUNT(*) AS migrations_aplicadas
FROM schema_migrations WHERE status = 'APPLIED';
