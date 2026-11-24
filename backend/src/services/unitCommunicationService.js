import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const sessionStart='TIMESTAMP(s.data,s.horario_inicio)';
const sessionEnd='TIMESTAMP(DATE_ADD(s.data, INTERVAL (s.horario_fim<s.horario_inicio) DAY),s.horario_fim)';
const sessionLocation='FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala';
const memberScope=(lock=false)=>`FROM usuarios u WHERE u.tipo_usuario='COLABORADOR' AND u.status='ATIVO'
    AND EXISTS (SELECT 1 FROM equipe_membros m JOIN equipes e ON e.id_equipe=m.id_equipe
        JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
        WHERE m.id_usuario=u.id_usuario AND m.status='ATIVO' AND e.status='ATIVA'
        AND sa.id_local=? AND sa.status='ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ') AND ${sessionEnd}>UTC_TIMESTAMP()${lock?' FOR SHARE':''})`;

export function createUnitCommunicationService({identity,notifications}) {
    async function inUnit(context,work,lock=false) {
        return identity.transaction(async c=>{
            const actor=await identity.activeActor(c,context);
            if(actor.tipo_usuario!=='SUPERVISOR')throw ApiError.acessoNegado();
            const [[local]]=await c.execute(`SELECT l.id_local,l.nome FROM supervisor_locais sl JOIN locais l ON l.id_local=sl.id_local
                WHERE sl.id_supervisor=? AND l.status='ATIVO'${lock?' FOR SHARE':''}`,[actor.id_usuario]);
            if(!local)throw new ApiError('Vincule um cinema ativo para acessar os comunicados.',403,null,'UNIT_COMMUNICATION_SCOPE');
            return work(c,local,idString(actor.id_usuario));
        },context);
    }

    return {
        recipients(q,context) {
            return inUnit(context,async(c,local)=>{
                const [rows]=await c.execute(`SELECT u.id_usuario,u.nome ${memberScope()} AND u.id_usuario>?
                    ${q.q?'AND LOCATE(?,u.nome)>0':''} ORDER BY u.id_usuario LIMIT ?`,
                    [local.id_local,q.cursor??'0',...(q.q?[q.q]:[]),q.limit+1]);
                const items=rows.slice(0,q.limit).map(row=>({id:idString(row.id_usuario),name:row.nome}));
                return {items,pagination:{limit:q.limit,nextCursor:rows.length>q.limit?items.at(-1).id:null}};
            });
        },
        send(input,context) {
            return inUnit(context,async(c,local,supervisorId)=>{
                const ids=input.recipientIds??[];
                const [members]=await c.execute(`SELECT u.id_usuario ${memberScope(true)}
                    ${ids.length?`AND u.id_usuario IN (${ids.map(()=>'?').join(',')})`:''} ORDER BY u.id_usuario FOR SHARE`,
                    [local.id_local,...ids]);
                if(!members.length||ids.length&&members.length!==ids.length) {
                    throw new ApiError('Revise os destinatários. Pelo menos um vínculo está indisponível nesta unidade.',409,null,'UNIT_RECIPIENTS_CHANGED');
                }
                const localId=idString(local.id_local);
                const delivered=await notifications.emitUnitCommunication(c,members.map(row=>idString(row.id_usuario)),{
                    title:input.title,message:input.message,localId,
                    dedupeKey:`unit-communication:${supervisorId}:${input.requestId}`
                });
                if(delivered)await identity.audit(c,'UNIT.COMMUNICATION_SENT',localId,context);
                return {recipients:members.length,delivered};
            },true);
        },
        alerts(context) {
            return inUnit(context,async(c,local)=>{
                const localId=idString(local.id_local);
                const [[counts]]=await c.execute(`SELECT
                    (SELECT COUNT(*) FROM insumos WHERE id_local=? AND status='DISPONIVEL' AND quantidade-quantidade_reservada<=quantidade_minima) AS stock,
                    (SELECT COUNT(*) FROM solicitacoes_estoque WHERE id_local=? AND status='PENDENTE') AS supply,
                    (SELECT COUNT(*) FROM pedidos_presenciais pp JOIN pedidos p ON p.id_pedido=pp.id_pedido
                      JOIN sessoes s ON s.id_sessao=pp.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
                      WHERE sa.id_local=? AND p.status IN ('EM_ANDAMENTO','AGUARDANDO_PAGAMENTO') AND ${sessionEnd}>UTC_TIMESTAMP()) AS orders,
                    (SELECT COUNT(*) ${sessionLocation} WHERE sa.id_local=? AND s.arquivada_em IS NULL AND s.status='AGENDADA'
                      AND TIMESTAMPADD(MINUTE,15,${sessionStart})<=UTC_TIMESTAMP() AND ${sessionEnd}>UTC_TIMESTAMP()) AS sessions,
                    (SELECT COUNT(*) FROM tickets t JOIN itens_pedido i ON i.id_item=t.id_item
                      JOIN sessoes s ON s.id_sessao=i.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
                      WHERE sa.id_local=? AND s.status IN ('ENCERRADA','EM_CARTAZ') AND ${sessionEnd} BETWEEN DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY) AND UTC_TIMESTAMP()
                      AND t.tipo='INGRESSO_SESSAO' AND t.status<>'CANCELADO' AND t.data_utilizacao IS NULL AND t.saida_em IS NULL
                      AND NOT EXISTS (SELECT 1 FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket)) AS absences,
                    (SELECT COUNT(*) FROM equipamentos WHERE id_local=? AND status IN ('MANUTENCAO','INDISPONIVEL')) AS equipment`,
                Array(6).fill(localId));
                return {location:{id:localId,name:local.nome},counts:Object.fromEntries(Object.entries(counts).map(([key,value])=>[key,Number(value)]))};
            });
        }
    };
}
