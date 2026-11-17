import { idString } from '../utils/dto.js';

const fields='id_transporte,id_fornecedor,nome,tipo,identificacao,observacao,status,criado_em,atualizado_em';
const transportFields=fields.split(',').map(field=>`t.${field}`).join(',');
const activeDelivery=`SELECT ${transportFields},l.id_logistica AS id_entrega_ativa,l.status AS status_entrega_ativa
    FROM fornecedor_transportes t LEFT JOIN logistica l
      ON l.transporte_em_uso=t.id_transporte AND l.id_fornecedor=t.id_fornecedor`;
export function createSupplierTransportModel() {
    const rows=async(c,sql,args=[])=>(await c.execute(sql,args))[0];
    const one=async(c,sql,args=[])=>(await rows(c,sql,args))[0]??null;
    return {
        supplier:(c,userId,lock=false)=>one(c,`SELECT id_fornecedor,status FROM fornecedores WHERE id_usuario=?${lock?' FOR UPDATE':''}`,[userId]),
        get:(c,supplierId,id,lock=false)=>lock
            ? one(c,`SELECT ${fields} FROM fornecedor_transportes WHERE id_fornecedor=? AND id_transporte=? FOR UPDATE`,[supplierId,id])
            : one(c,`${activeDelivery} WHERE t.id_fornecedor=? AND t.id_transporte=?`,[supplierId,id]),
        list(c,supplierId,q) {
            const where=['t.id_fornecedor=?','t.id_transporte>?'],args=[supplierId,q.cursor??'0'];
            if(q.status){where.push('t.status=?');args.push(q.status);}
            if(q.available){where.push("t.status='ATIVO' AND l.id_logistica IS NULL");}
            if(q.q){where.push("(t.nome LIKE ? ESCAPE '!' OR t.tipo LIKE ? ESCAPE '!' OR t.identificacao LIKE ? ESCAPE '!')");const term='%'+q.q.replace(/[!%_]/g,v=>'!'+v)+'%';args.push(term,term,term);}
            args.push(q.limit+1);
            return rows(c,`${activeDelivery} WHERE ${where.join(' AND ')} ORDER BY t.id_transporte LIMIT ?`,args);
        },
        async create(c,supplierId,input) {
            const [result]=await c.execute('INSERT INTO fornecedor_transportes(id_fornecedor,nome,tipo,identificacao,observacao) VALUES(?,?,?,?,?)',[supplierId,input.nome,input.tipo,input.identificacao??null,input.observacao??null]);
            return idString(result.insertId);
        },
        update(c,supplierId,id,input) {
            const keys=Object.keys(input);
            if(!keys.length||keys.some(key=>!['nome','tipo','identificacao','observacao','status'].includes(key)))throw new TypeError('Campos inválidos');
            return c.execute(`UPDATE fornecedor_transportes SET ${keys.map(key=>`${key}=?`).join(',')} WHERE id_fornecedor=? AND id_transporte=?`,[...keys.map(key=>input[key]),supplierId,id]);
        }
    };
}
