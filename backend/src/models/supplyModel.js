import { idString } from '../utils/dto.js';

export function createSupplyModel(database) {
    const rows = async (c, sql, args = []) => (await c.execute(sql,args))[0];
    const one = async (c, sql, args = []) => (await rows(c,sql,args))[0] ?? null;
    const itemSpec = kind => kind === 'input' ? ['insumos','id_insumo'] : ['equipamentos','id_equipamento'];
    const requestJoins = `FROM solicitacoes_estoque r
        LEFT JOIN insumos i ON i.id_insumo=r.id_insumo
        LEFT JOIN equipamentos e ON e.id_equipamento=r.id_equipamento
        LEFT JOIN rotas_logistica rota ON rota.id_local_origem=COALESCE(i.id_local,e.id_local)
            AND rota.id_local_destino=r.id_local AND rota.status='ATIVO'`;
    const outstandingEquipment = "status IN ('PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO')";
    const requestProjection = `r.*, COALESCE(i.nome,e.nome) AS nome_item, rota.distancia_km, rota.tempo_estimado_min,
        CASE
            WHEN r.status <> 'PENDENTE' THEN NULL
            WHEN i.id_insumo IS NOT NULL AND i.status='DISPONIVEL'
                AND i.quantidade-i.quantidade_reservada>=r.quantidade THEN 'DISPONIVEL'
            WHEN e.id_equipamento IS NOT NULL AND e.status='DISPONIVEL' AND e.quantidade=r.quantidade
                AND NOT EXISTS (SELECT 1 FROM logistica WHERE id_equipamento_origem=e.id_equipamento AND ${outstandingEquipment})
                THEN 'DISPONIVEL'
            WHEN i.id_insumo IS NOT NULL AND i.status='DISPONIVEL' THEN 'SALDO_INSUFICIENTE'
            ELSE 'INDISPONIVEL'
        END AS estoque_origem`;
    const shipmentJoins = `FROM logistica l
        LEFT JOIN solicitacoes_estoque r ON r.id_solicitacao=l.id_solicitacao
        LEFT JOIN sessoes s ON s.id_sessao=r.id_sessao
        LEFT JOIN fornecedor_transportes t ON t.id_transporte=l.id_transporte`;
    const shipmentProjection = `l.*, t.nome AS nome_transporte, COALESCE(l.status='RECEBIDO' AND l.id_equipamento_origem IS NOT NULL
        AND r.status='FINALIZADA' AND s.status='ENCERRADA', FALSE) AS devolucao_disponivel`;
    const routeProjection = `SELECT rota.*, origem.nome AS nome_origem, destino.nome AS nome_destino
        FROM rotas_logistica rota JOIN locais origem ON origem.id_local=rota.id_local_origem
        JOIN locais destino ON destino.id_local=rota.id_local_destino`;
    const inputLinkProjection = `SELECT v.*, origem.nome AS nome_insumo_origem, destino.nome AS nome_insumo_destino,
            origem.id_local AS id_local_origem, lo.nome AS nome_local_origem, ld.nome AS nome_local_destino
        FROM vinculos_insumos_reposicao v
        JOIN insumos origem ON origem.id_insumo=v.id_insumo_origem
        JOIN insumos destino ON destino.id_insumo=v.id_insumo_destino
        JOIN locais lo ON lo.id_local=origem.id_local
        JOIN locais ld ON ld.id_local=v.id_local_destino`;
    return {
        inputLinks: (q,c) => rows(c,`${inputLinkProjection} WHERE v.id_vinculo > ? ORDER BY v.id_vinculo LIMIT ?`,
            [q.cursor ?? '0', q.limit + 1]),
        inputLink: (c,sourceId,localId) => one(c,`SELECT id_insumo_destino FROM vinculos_insumos_reposicao
            WHERE id_insumo_origem=? AND id_local_destino=? FOR UPDATE`,[sourceId,localId]),
        async saveInputLink(c,sourceId,localId,targetId) {
            await c.execute(`INSERT INTO vinculos_insumos_reposicao (id_insumo_origem,id_local_destino,id_insumo_destino)
                VALUES (?,?,?) ON DUPLICATE KEY UPDATE id_insumo_destino=?`,[sourceId,localId,targetId,targetId]);
            return one(c,`${inputLinkProjection} WHERE v.id_insumo_origem=? AND v.id_local_destino=?`,[sourceId,localId]);
        },
        removeInputLink: (c,id) => c.execute('DELETE FROM vinculos_insumos_reposicao WHERE id_vinculo=?',[id]),
        logisticsRoutes: (q,c) => rows(c,`${routeProjection} WHERE rota.id_rota > ? ORDER BY rota.id_rota LIMIT ?`,
            [q.cursor ?? '0', q.limit + 1]),
        logisticsRoute: (id,c) => one(c,`${routeProjection} WHERE rota.id_rota=?`,[id]),
        async createLogisticsRoute(c,input) {
            const [result] = await c.execute(`INSERT INTO rotas_logistica
                (id_local_origem,id_local_destino,distancia_km,tempo_estimado_min) VALUES (?,?,?,?)`,
                [input.originId,input.destinationId,input.distancia_km,input.tempo_estimado_min]);
            return idString(result.insertId);
        },
        updateLogisticsRoute: (c,id,input) => c.execute(`UPDATE rotas_logistica SET
            distancia_km=COALESCE(?,distancia_km), tempo_estimado_min=COALESCE(?,tempo_estimado_min),
            status=COALESCE(?,status) WHERE id_rota=?`,
            [input.distancia_km ?? null,input.tempo_estimado_min ?? null,input.status ?? null,id]),
        local: (id,c=database) => one(c,'SELECT id_local,status FROM locais WHERE id_local = ?',[id]),
        supervisorLocation: (userId,c=database) => one(c,'SELECT id_local FROM supervisor_locais WHERE id_supervisor = ?',[userId]),
        availableInputs(localId,q,c=database) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            return rows(c,`SELECT i.id_insumo,i.nome,i.id_local AS id_local_origem,l.nome AS nome_origem,i.quantidade-i.quantidade_reservada AS disponivel
                FROM insumos i JOIN locais l ON l.id_local=i.id_local JOIN fornecedores f ON f.id_fornecedor=i.id_fornecedor
                JOIN usuarios u ON u.id_usuario=f.id_usuario
                JOIN fornecedor_locais origem ON origem.id_fornecedor=f.id_fornecedor AND origem.id_local=i.id_local
                JOIN fornecedor_locais destino ON destino.id_fornecedor=f.id_fornecedor AND destino.id_local=?
                WHERE i.id_local<>? AND i.id_insumo>? AND i.status='DISPONIVEL' AND i.quantidade-i.quantidade_reservada>0
                AND l.status='ATIVO' AND f.status='ATIVO' AND u.status='ATIVO' AND u.tipo_usuario='FORNECEDOR'
                AND origem.status='ATIVO' AND destino.status='ATIVO'
                ORDER BY i.id_insumo LIMIT ${q.limit+1}`,[localId,localId,q.cursor??'0']);
        },
        availableEquipment(localId,q,c=database) {
            return rows(c,`SELECT e.id_equipamento,e.nome,e.id_local AS id_local_origem,
                    l.nome AS nome_origem,e.quantidade AS disponivel
                FROM equipamentos e
                JOIN locais l ON l.id_local=e.id_local AND l.status='ATIVO'
                JOIN locais d ON d.id_local=? AND d.status='ATIVO'
                JOIN fornecedores f ON f.id_fornecedor=e.id_fornecedor AND f.status='ATIVO'
                JOIN usuarios u ON u.id_usuario=f.id_usuario AND u.status='ATIVO' AND u.tipo_usuario='FORNECEDOR'
                JOIN fornecedor_locais origem ON origem.id_fornecedor=f.id_fornecedor AND origem.id_local=l.id_local AND origem.status='ATIVO'
                JOIN fornecedor_locais destino ON destino.id_fornecedor=f.id_fornecedor AND destino.id_local=d.id_local AND destino.status='ATIVO'
                WHERE e.id_local<>d.id_local AND e.id_equipamento>? AND e.status='DISPONIVEL' AND e.quantidade>0
                AND NOT EXISTS (SELECT 1 FROM logistica WHERE id_equipamento_origem=e.id_equipamento AND ${outstandingEquipment})
                ORDER BY e.id_equipamento LIMIT ?`,[localId,q.cursor??'0',q.limit+1]);
        },
        alternativeSources(c, kind, source, destinationId, quantity) {
            const [table,key]=itemSpec(kind);
            const availability=kind==='input'
                ? 'p.quantidade-p.quantidade_reservada>=?'
                : `p.quantidade=? AND NOT EXISTS (
                    SELECT 1 FROM logistica WHERE id_equipamento_origem=p.id_equipamento AND ${outstandingEquipment})`;
            return rows(c,`SELECT p.${key} AS item_id, p.nome, p.id_local AS id_local_origem,
                    l.nome AS nome_origem, COALESCE(NULLIF(f.nome_cine,''),f.razao_social) AS fornecedor
                FROM ${table} p
                JOIN locais l ON l.id_local=p.id_local AND l.status='ATIVO'
                JOIN locais d ON d.id_local=? AND d.status='ATIVO'
                JOIN fornecedores f ON f.id_fornecedor=p.id_fornecedor AND f.status='ATIVO'
                JOIN usuarios u ON u.id_usuario=f.id_usuario AND u.status='ATIVO' AND u.tipo_usuario='FORNECEDOR'
                JOIN fornecedor_locais origem ON origem.id_fornecedor=f.id_fornecedor AND origem.id_local=l.id_local AND origem.status='ATIVO'
                JOIN fornecedor_locais destino ON destino.id_fornecedor=f.id_fornecedor AND destino.id_local=d.id_local AND destino.status='ATIVO'
                WHERE p.id_local<>d.id_local AND p.id_fornecedor<>? AND p.status='DISPONIVEL'
                    AND p.nome=? AND p.categoria=? AND ${availability}
                ORDER BY p.${key} LIMIT 5`,[destinationId,source.id_fornecedor,source.nome,source.categoria,quantity]);
        },
        stock: async (localId,c=database) => ({
            inputs:await rows(c,"SELECT id_insumo AS id,id_fornecedor,nome,quantidade,quantidade_reservada,status FROM insumos WHERE id_local=? ORDER BY id_insumo",[localId]),
            equipment:await rows(c,"SELECT id_equipamento AS id,id_fornecedor,nome,quantidade,status FROM equipamentos WHERE id_local=? ORDER BY id_equipamento",[localId])
        }),
        incoming: (localId,c=database) => rows(c,"SELECT l.id_logistica,l.id_insumo_origem,l.id_equipamento_origem,l.quantidade,l.status,COALESCE(i.nome,e.nome) AS nome FROM logistica l LEFT JOIN insumos i ON i.id_insumo=l.id_insumo_origem LEFT JOIN equipamentos e ON e.id_equipamento=l.id_equipamento_origem WHERE l.id_local_destino=? AND l.status IN ('ENVIADO','EM_TRANSITO') AND l.id_solicitacao IS NOT NULL ORDER BY l.id_logistica",[localId]),
        session: (id,c=database) => one(c,'SELECT s.id_sessao,s.status,l.id_local,l.status AS local_status FROM sessoes s JOIN salas a ON a.id_sala=s.id_sala JOIN locais l ON l.id_local=a.id_local WHERE s.id_sessao = ?',[id]),
        member: (userId,sessionId,c=database) => one(c,"SELECT e.id_equipe FROM equipes e JOIN equipe_membros m ON m.id_equipe=e.id_equipe AND m.id_usuario=? AND m.status='ATIVO' WHERE e.id_sessao=? AND e.status IN ('ATIVA','FINALIZADA') LIMIT 1",[userId,sessionId]),
        supplierByUser: (id,c=database) => one(c,'SELECT id_fornecedor,status FROM fornecedores WHERE id_usuario = ?',[id]),
        grant: (supplierId,localId,c=database) => one(c,"SELECT f.status AS supplier_status,u.status AS user_status,u.tipo_usuario,fl.status AS grant_status,l.status AS local_status FROM fornecedores f JOIN usuarios u ON u.id_usuario=f.id_usuario JOIN locais l ON l.id_local=? LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor=f.id_fornecedor AND fl.id_local=l.id_local WHERE f.id_fornecedor=?",[localId,supplierId]),
        item(kind,id,c=database,lock=false) { const [table,key]=itemSpec(kind); return one(c,`SELECT ${key},id_fornecedor,id_local,nome,descricao,categoria,quantidade,${kind==='input'?'quantidade_reservada,quantidade_minima,preco,':'numero_patrimonio,'}status FROM ${table} WHERE ${key}=?${lock?' FOR UPDATE':''}`,[id]); },
        request: (id,c=database,lock=false) => lock
            ? one(c,'SELECT * FROM solicitacoes_estoque WHERE id_solicitacao=? FOR UPDATE',[id])
            : one(c,`SELECT ${requestProjection} ${requestJoins} WHERE r.id_solicitacao=?`,[id]),
        listRequests(q, c = database) {
            const where = ['r.id_solicitacao > ?'], args = [q.cursor ?? '0'];
            if (q.localId) { where.push('r.id_local=?'); args.push(q.localId); }
            if (q.sessionId) { where.push('r.id_sessao=?'); args.push(q.sessionId); }
            if (q.userId) { where.push('r.id_usuario=?'); args.push(q.userId); }
            if (q.supplierId) {
                where.push('COALESCE(i.id_fornecedor,e.id_fornecedor)=?', "(r.status_supervisao IS NULL OR r.status_supervisao='APROVADA')");
                args.push(q.supplierId);
            }
            if (q.status) { where.push('r.status=?'); args.push(q.status); }
            return rows(c, `SELECT ${requestProjection} ${requestJoins} WHERE ${where.join(' AND ')} ORDER BY r.id_solicitacao LIMIT ${q.limit + 1}`, args);
        },
        async createRequest(c,d) { const [r]=await c.execute("INSERT INTO solicitacoes_estoque(id_usuario,id_local,id_sessao,id_insumo,id_equipamento,quantidade,status,observacao,status_supervisao) VALUES(?,?,?,?,?,?,'PENDENTE',?,?)",[d.actorId,d.localId,d.sessionId??null,d.inputId??null,d.equipmentId??null,d.quantity,d.note??null,d.statusSupervisao??null]);return idString(r.insertId); },
        setSupervisorReview: (c,id,review,actorId) => c.execute(
            "UPDATE solicitacoes_estoque SET status_supervisao=?,id_supervisor_decisao=?,data_decisao_supervisao=UTC_TIMESTAMP(3),status=IF(?='RECUSADA','RECUSADA',status) WHERE id_solicitacao=? AND status_supervisao='PENDENTE' AND status='PENDENTE'",
            [review,actorId,review,id]),
        setRequest: (c,id,status) => c.execute('UPDATE solicitacoes_estoque SET status=? WHERE id_solicitacao=?',[status,id]),
        shipment: (id,c=database,lock=false) => lock
            ? one(c,'SELECT * FROM logistica WHERE id_logistica=? FOR UPDATE',[id])
            : one(c,`SELECT ${shipmentProjection} ${shipmentJoins} WHERE l.id_logistica=?`,[id]),
        shipmentByRequest: (id,c=database) => one(c,'SELECT id_logistica,status FROM logistica WHERE id_solicitacao=?',[id]),
        listShipments(q,c=database) {
            const where=['l.id_logistica > ?'],args=[q.cursor??'0'];
            if(q.supplierId){where.push('l.id_fornecedor=?');args.push(q.supplierId);}
            if(q.localId){where.push('l.id_local_destino=?');args.push(q.localId);}
            if(q.sessionId){where.push('r.id_sessao=?');args.push(q.sessionId);}
            return rows(c,`SELECT ${shipmentProjection} ${shipmentJoins}
                WHERE ${where.join(' AND ')} ORDER BY l.id_logistica LIMIT ?`,[...args,q.limit+1]);
        },
        async createShipment(c,d) { const [r]=await c.execute("INSERT INTO logistica(id_fornecedor,id_local_origem,id_local_destino,id_solicitacao,id_insumo_origem,id_equipamento_origem,quantidade,status,observacao) VALUES(?,?,?,?,?,?,?,'PENDENTE',?)",[d.supplierId,d.originId,d.destinationId,d.requestId,d.inputId??null,d.equipmentId??null,d.quantity,d.note??null]);return idString(r.insertId);},
        transport: (c, id, supplierId) => one(c, 'SELECT status FROM fornecedor_transportes WHERE id_transporte=? AND id_fornecedor=? FOR UPDATE', [id,supplierId]),
        transportInUse: (c, id) => one(c, 'SELECT id_logistica FROM logistica WHERE transporte_em_uso=? FOR UPDATE', [id]),
        shipmentEvent: (c,id,userId,type,status,description=null) => c.execute(
            'INSERT INTO logistica_eventos(id_logistica,id_usuario,tipo,status,descricao) VALUES(?,?,?,?,?)', [id,userId,type,status,description]),
        shipmentEvents: (c,id,q) => rows(c,`SELECT id_evento,id_usuario,tipo,status,descricao,criado_em
            FROM logistica_eventos WHERE id_logistica=? AND id_evento>? ORDER BY id_evento LIMIT ?`,[id,q.cursor??'0',q.limit+1]),
        setShipment(c,id,status,receiver=null,transportId=null) {
            if(status==='ENVIADO')return c.execute(`UPDATE logistica l
                LEFT JOIN rotas_logistica rota ON rota.id_local_origem=l.id_local_origem
                    AND rota.id_local_destino=l.id_local_destino AND rota.status='ATIVO'
                SET l.status='ENVIADO',l.id_transporte=?,l.data_envio=NOW(),
                    l.data_prevista=COALESCE(TIMESTAMPADD(MINUTE,rota.tempo_estimado_min,NOW()),l.data_prevista)
                WHERE l.id_logistica=?`,[transportId,id]);
            if(status==='RECEBIDO')return c.execute(
                'UPDATE logistica SET status=?,data_recebimento=NOW(),id_usuario_recebimento=? WHERE id_logistica=?',
                [status,receiver,id]);
            return c.execute('UPDATE logistica SET status=? WHERE id_logistica=?',[status,id]);
        },
        setDestinationItem: (c,id,itemId) => c.execute('UPDATE logistica SET id_insumo_destino=? WHERE id_logistica=?',[itemId,id]),
        setReturned: (c,id,actorId) => c.execute("UPDATE logistica SET status='DEVOLVIDO',data_devolucao=NOW(),id_usuario_devolucao=? WHERE id_logistica=? AND status='RECEBIDO'",[actorId,id]),
        async cloneInput(c,source,destinationId) { const [r]=await c.execute("INSERT INTO insumos(id_fornecedor,id_local,nome,descricao,categoria,quantidade,quantidade_reservada,quantidade_minima,preco,status) VALUES(?,?,?,?,?,0,0,?,?, 'DISPONIVEL')",[source.id_fornecedor,destinationId,source.nome,source.descricao,source.categoria,source.quantidade_minima,source.preco]);return idString(r.insertId);},
        changeInput: (c,id,delta) => c.execute('UPDATE insumos SET quantidade=quantidade+? WHERE id_insumo=? AND quantidade+? BETWEEN quantidade_reservada AND 2147483647',[delta,id,delta]),
        changeEquipment: (c,id,destinationId) => c.execute('UPDATE equipamentos SET id_local=? WHERE id_equipamento=?',[destinationId,id]),
        async movement(c,d) { const [r]=await c.execute('INSERT INTO movimentacoes_estoque(id_insumo,id_equipamento,id_reserva,id_logistica,id_usuario,tipo,quantidade,motivo) VALUES(?,?,NULL,?,?,?,?,?)',[d.inputId??null,d.equipmentId??null,d.shipmentId,d.actorId,d.type,d.quantity,d.reason]);return idString(r.insertId); },
        equipmentInTransit: (id,c) => one(c,`SELECT id_logistica FROM logistica WHERE id_equipamento_origem=? AND ${outstandingEquipment} LIMIT 1 FOR SHARE`,[id])
    };
}
