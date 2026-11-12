import { idString } from '../utils/dto.js';
const eventColumns='c.id_evento,c.id_sessao_evento,c.limite_evento,c.limite_cliente_evento';

export function createComboModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        local: (id, c = database, lock = false) => one(c, `SELECT id_local,status FROM locais WHERE id_local = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        combo: (id, c = database, lock = false) => one(c, `SELECT c.id_combo,c.id_local,c.nome,c.descricao,c.preco,c.custo_operacional,c.ativo,c.data_cadastro,${eventColumns}, (SELECT im.url FROM combos_imagens im WHERE im.id_combo=c.id_combo AND im.tipo='PRINCIPAL' ORDER BY im.ordem,im.id_imagem LIMIT 1) AS imagem FROM combos c WHERE c.id_combo = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        eventSession:(c,event)=>one(c,`SELECT sa.id_local FROM conteudos_promocionais e
          JOIN sessoes s ON s.id_sessao=? JOIN salas sa ON sa.id_sala=s.id_sala
          WHERE e.id_conteudo=? AND e.tipo='experiences' AND e.id_local_evento=sa.id_local
          AND s.status IN ('AGENDADA','EM_CARTAZ') AND TIMESTAMP(s.data,s.horario_inicio)>UTC_TIMESTAMP(3)`,[event.sessionId,event.eventId]),
        setEvent:(c,id,event)=>c.execute('UPDATE combos SET id_evento=?,id_sessao_evento=?,limite_evento=?,limite_cliente_evento=? WHERE id_combo=?',
          [event?.eventId??null,event?.sessionId??null,event?.totalLimit??null,event?.customerLimit??null,id]),
        planUsingCombo:(c,id)=>one(c,'SELECT id_plano FROM planos WHERE id_combo_medio=? LIMIT 1',[id]),
        inputs: (ids, c = database, lock = false) => rows(c, `SELECT i.id_insumo,i.id_local,i.id_fornecedor,i.nome,i.status,i.custo_receita,i.custo_parceria,f.status AS fornecedor_status,u.status AS usuario_status,u.tipo_usuario,fl.status AS vinculo_status FROM insumos i JOIN fornecedores f ON f.id_fornecedor = i.id_fornecedor JOIN usuarios u ON u.id_usuario = f.id_usuario LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor = i.id_fornecedor AND fl.id_local = i.id_local WHERE i.id_insumo IN (${ids.map(() => '?').join(',')}) ORDER BY i.id_insumo${lock ? ' FOR UPDATE' : ''}`, ids),
        items: (id, c = database) => rows(c, 'SELECT ci.id_insumo,ci.quantidade,i.nome FROM combo_itens ci JOIN insumos i ON i.id_insumo = ci.id_insumo WHERE ci.id_combo = ? ORDER BY ci.id_insumo', [id]),
        referenced: async (id, c) => Boolean((await one(c, 'SELECT 1 AS found FROM itens_pedido WHERE id_combo = ? LIMIT 1', [id]))),
        async adminList(c,q) {
            const where=[],args=[];
            if(q.cursor){where.push('c.id_combo<?');args.push(q.cursor);}
            if(q.localId){where.push('c.id_local=?');args.push(q.localId);}
            if(q.active!==undefined){where.push('c.ativo=?');args.push(q.active?1:0);}
            if(q.q){where.push("c.nome LIKE ? ESCAPE '!'");args.push('%'+q.q.replace(/[!%_]/g,v=>'!'+v)+'%');}
            args.push(q.limit+1);
            return rows(c,`SELECT c.id_combo,c.id_local,c.nome,c.descricao,c.preco,c.custo_operacional,c.ativo,c.data_cadastro,${eventColumns},
                (SELECT COUNT(*) FROM combo_itens ci WHERE ci.id_combo=c.id_combo) AS item_count
                FROM combos c ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY c.id_combo DESC LIMIT ?`,args);
        },
        async list(q, c = database) {
            const args = [q.localId, q.cursor ?? '0'];
            const eventFilter=q.sessionId ? `AND c.id_sessao_evento=? AND EXISTS (
              SELECT 1 FROM conteudos_promocionais e JOIN sessoes s ON s.id_sessao=c.id_sessao_evento
              JOIN salas sa ON sa.id_sala=s.id_sala WHERE e.id_conteudo=c.id_evento AND e.ativo=TRUE
              AND e.id_local_evento=c.id_local AND sa.id_local=c.id_local AND sa.status='ATIVA'
              AND s.status IN ('AGENDADA','EM_CARTAZ') AND TIMESTAMP(s.data,s.horario_inicio)>UTC_TIMESTAMP(3))
              AND c.limite_evento>COALESCE((SELECT SUM(ip.quantidade) FROM itens_pedido ip JOIN pedidos p ON p.id_pedido=ip.id_pedido
              WHERE ip.id_combo=c.id_combo AND p.status IN ('AGUARDANDO_PAGAMENTO','PAGO','FINALIZADO')),0)`
              : q.includeEvents ? '' : 'AND c.id_evento IS NULL';
            if(q.sessionId)args.push(q.sessionId);
            const nameFilter = q.q ? "AND c.nome LIKE ? ESCAPE '!'" : '';
            if (q.q) args.push(`%${q.q.replace(/[!%_]/g, value => `!${value}`)}%`);
            args.push(q.limit + 1);
            const stockFilter = q.inStock ? 'OR i.quantidade - i.quantidade_reservada < ci.quantidade' : '';
            const count = q.inStock ? ', (SELECT COUNT(*) FROM combo_itens ci WHERE ci.id_combo = c.id_combo) AS item_count' : '';
            return rows(c, `SELECT c.id_combo,c.id_local,c.nome,c.descricao,c.preco,c.ativo,c.data_cadastro,
                (SELECT im.url FROM combos_imagens im WHERE im.id_combo=c.id_combo AND im.tipo='PRINCIPAL' ORDER BY im.ordem,im.id_imagem LIMIT 1) AS imagem${count}
                FROM combos c JOIN locais l ON l.id_local = c.id_local
                WHERE c.id_local = ? AND c.id_combo > ? AND c.ativo = 1 AND c.custo_operacional IS NOT NULL AND l.status = 'ATIVO' ${eventFilter}
                AND EXISTS (SELECT 1 FROM combo_itens ci WHERE ci.id_combo = c.id_combo)
                AND NOT EXISTS (
                    SELECT 1 FROM combo_itens ci JOIN insumos i ON i.id_insumo = ci.id_insumo
                    JOIN fornecedores f ON f.id_fornecedor = i.id_fornecedor JOIN usuarios u ON u.id_usuario = f.id_usuario
                    LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor = i.id_fornecedor AND fl.id_local = i.id_local
                    WHERE ci.id_combo = c.id_combo AND (i.id_local <> c.id_local OR i.status <> 'DISPONIVEL'
                        OR f.status <> 'ATIVO' OR u.status <> 'ATIVO' OR u.tipo_usuario <> 'FORNECEDOR'
                        OR fl.status IS NULL OR fl.status <> 'ATIVO' ${stockFilter})
                ) ${nameFilter} ORDER BY c.id_combo LIMIT ?`, args);
        },
        async create(c, input) { const [result] = await c.execute('INSERT INTO combos (id_local,nome,descricao,preco,custo_operacional,ativo) VALUES (?,?,?,?,?,1)', [input.localId,input.nome,input.descricao ?? null,input.preco,input.custo_operacional]); return idString(result.insertId); },
        update(c, id, input) { const keys = Object.keys(input); if (!keys.length || keys.some(k => !['nome','descricao','preco','custo_operacional','ativo'].includes(k))) throw new TypeError('Campos inválidos'); return c.execute(`UPDATE combos SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_combo = ?`, [...keys.map(k => input[k]), id]); },
        async replaceItems(c, id, items) { await c.execute('DELETE FROM combo_itens WHERE id_combo = ?', [id]); for (const row of items) await c.execute('INSERT INTO combo_itens (id_combo,id_insumo,quantidade) VALUES (?,?,?)', [id,row.inputId,row.quantidade]); }
    };
}
