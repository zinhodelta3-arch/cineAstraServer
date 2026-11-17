CREATE TABLE IF NOT EXISTS solicitacoes_experiencia (
    id_solicitacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_experiencia INT UNSIGNED NOT NULL,
    id_cliente INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NULL,
    id_responsavel INT UNSIGNED NULL,
    titulo VARCHAR(150) NOT NULL,
    data_desejada DATE NOT NULL,
    horario_desejado TIME NULL,
    quantidade INT UNSIGNED NOT NULL,
    descricao TEXT NOT NULL,
    preferencias TEXT NULL,
    status ENUM('RECEBIDA','EM_ANALISE','PROPOSTA_ENVIADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'RECEBIDA',
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    atualizada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX ix_experiencia_cliente (id_cliente,id_solicitacao),
    INDEX ix_experiencia_unidade (id_local,id_solicitacao),
    FOREIGN KEY (id_experiencia) REFERENCES conteudos_promocionais(id_conteudo),
    FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_local) REFERENCES locais(id_local),
    FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS historico_experiencia (
    id_evento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_solicitacao INT UNSIGNED NOT NULL,
    tipo ENUM('STATUS','MENSAGEM','ATRIBUICAO') NOT NULL,
    remetente ENUM('CLIENTE','EQUIPE') NOT NULL,
    texto TEXT NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX ix_historico_experiencia (id_solicitacao,id_evento),
    FOREIGN KEY (id_solicitacao) REFERENCES solicitacoes_experiencia(id_solicitacao)
);
