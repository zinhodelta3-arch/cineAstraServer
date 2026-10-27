import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generateInstallSql} from '../scripts/generateInstallSql.js';
import {migrationPlan} from '../scripts/migrationPlan.js';

test('consolidado reproduz exatamente o plano com ledger, ordem e checksums',async()=>{
 const plan=await migrationPlan(),sql=await readFile(new URL('../../database/cineastra-install.sql',import.meta.url),'utf8');
 assert.equal(sql,await generateInstallSql());
 const records=[...sql.matchAll(/INSERT INTO schema_migrations \(name, checksum, status\) VALUES \('([^']+)', '([^']+)', 'RUNNING'\);\n([\s\S]*?);\n    UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP\(3\) WHERE name = '([^']+)';/g)];
 assert.equal(records.length,plan.length);
 records.forEach((r,i)=>{assert.equal(r[1],plan[i].name);assert.equal(r[4],r[1]);assert.equal(r[3],plan[i].sql.replaceAll('\r\n','\n'));assert.equal(r[2],createHash('sha256').update(plan[i].sql).digest('hex'));});
});
test('nenhum arquivo SQL esquecido no plano; criação do schema é a única fonte excluída',async()=>{
 const files=(await readdir(new URL('../../database/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();
 const used=[...new Set((await migrationPlan()).map(s=>s.name.split(':')[0]))].sort();
 assert.deepEqual(files.filter(f=>!used.includes(f)),['20261001_01_create_database.sql']);
 assert.equal(new Set((await migrationPlan()).map(s=>s.name)).size,(await migrationPlan()).length);
});
test('consolidado exige schema vazio, não desabilita constraints e preserva marker de falha',async()=>{
 const sql=await generateInstallSql();
 assert.ok(sql.indexOf('schema precisa estar vazio')<sql.indexOf('CREATE TABLE schema_migrations'));
 assert.match(sql,/DECLARE EXIT HANDLER FOR SQLEXCEPTION[\s\S]*RESIGNAL/);
 assert.match(sql,/GET_LOCK/);assert.match(sql,/RELEASE_LOCK/);
 assert.doesNotMatch(sql,/^\s*(?:SET\s+FOREIGN_KEY_CHECKS\s*=\s*0|DROP TABLE|DROP DATABASE|CREATE DATABASE|USE )/mi);
});
