import { idString } from '../utils/dto.js';

const fields='id_transporte,id_fornecedor,nome,tipo,identificacao,observacao,status,criado_em,atualizado_em';
const inUse='EXISTS (SELECT 1 FROM logistica l WHERE l.transporte_em_uso=fornecedor_transportes.id_transporte)';
export function createSupplierTransportModel() {
    const rows=async(c,sql,args=[])=>(await c.execute(sql,args))[0];
    const one=async(c,sql,args=[])=>(await rows(c,sql,args))[0]??null;
    return {
        supplier:(c,userId,lock=false)=>one(c,`SELECT id_fornecedor,status FROM fornecedores WHERE id_usuario=?${lock?' FOR UPDATE':''}`,[userId]),
        get:(c,supplierId,id,lock=false)=>one(c,`SELECT ${fields},${inUse} AS em_uso FROM fornecedor_transportes WHERE id_fornecedor=? AND id_transporte=?${lock?' FOR UPDATE':''}`,[supplierId,id]),
        list(c,supplierId,q) {
            const where=['id_fornecedor=?','id_transporte>?'],args=[supplierId,q.cursor??'0'];
            if(q.status){where.push('status=?');args.push(q.status);}
            if(q.available){where.push(`status='ATIVO' AND NOT ${inUse}`);}
            if(q.q){where.push("(nome LIKE ? ESCAPE '!' OR tipo LIKE ? ESCAPE '!' OR identificacao LIKE ? ESCAPE '!')");const term='%'+q.q.replace(/[!%_]/g,v=>'!'+v)+'%';args.push(term,term,term);}
            args.push(q.limit+1);
            return rows(c,`SELECT ${fields},${inUse} AS em_uso FROM fornecedor_transportes WHERE ${where.join(' AND ')} ORDER BY id_transporte LIMIT ?`,args);
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
