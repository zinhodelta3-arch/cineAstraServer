import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {migrationPlan} from './migrationPlan.js';

// Artifact for an EMPTY schema, not a replacement for incremental migrations.
export async function generateInstallSql() {
 const plan=await migrationPlan();
 const statements=plan.map((step,index)=>{
  if(!/^[A-Za-z0-9_.:-]+$/.test(step.name)||!/^\w{64}$/.test(step.checksum)||step.sql.includes('$$'))throw new Error('Statement inválido para o consolidado');
  return `    -- ${index+1}/${plan.length}: ${step.name}\n    INSERT INTO schema_migrations (name, checksum, status) VALUES ('${step.name}', '${step.checksum}', 'RUNNING');\n${step.sql.replaceAll('\r\n','\n')};\n    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = '${step.name}';`;
 }).join('\n\n');
 return `-- CineAstra: instalacao unica em schema VAZIO (MySQL 8.0.16+).
-- Gerado por backend/scripts/generateInstallSql.js a partir de migrationPlan.js: ${plan.length} statements.
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

${statements}

    DO RELEASE_LOCK(CONCAT(DATABASE(), ':cineastra:migrate'));
    SET install_lock_acquired = 0;
END$$
DELIMITER ;

CALL _cineastra_install();
DROP PROCEDURE _cineastra_install;

SELECT DATABASE() AS banco, COUNT(*) AS migrations_aplicadas
FROM schema_migrations WHERE status = 'APPLIED';
`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 await writeFile(new URL('../../database/cineastra-install.sql',import.meta.url),await generateInstallSql());
 console.info('Consolidado atualizado a partir do plano de migrations.');
}
