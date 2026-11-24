import { idString } from '../utils/dto.js';

const fields = 'id_fornecedor,id_usuario,id_empresa,razao_social,nome_cine,cnpj,status,data_cadastro';
export function createSupplierModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    const withAccount = `SELECT ${fields.split(',').map(field=>`f.${field}`).join(',')}, u.email
        FROM fornecedores f JOIN usuarios u ON u.id_usuario=f.id_usuario`;
    return {
        supplier: (id, c = database, lock = false) => one(c, lock
            ? `SELECT ${fields} FROM fornecedores WHERE id_fornecedor=? FOR UPDATE`
            : `${withAccount} WHERE f.id_fornecedor=?`, [id]),
        byUser: (userId, c = database) => one(c, `SELECT ${fields} FROM fornecedores WHERE id_usuario = ?`, [userId]),
        user: (id, c, lock = false) => one(c, `SELECT id_usuario,tipo_usuario,status FROM usuarios WHERE id_usuario = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        list(q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['f.id_fornecedor > ?'], args = [q.cursor ?? '0'];
            if (q.status) { where.push('f.status = ?'); args.push(q.status); }
            if (q.companyId) { where.push('f.id_empresa=?'); args.push(q.companyId); }
            return rows(database, `${withAccount} WHERE ${where.join(' AND ')} ORDER BY f.id_fornecedor LIMIT ${q.limit + 1}`, args);
        },
        company:(c,id,lock=false)=>one(c,`SELECT id_empresa,razao_social,nome_cine,cnpj FROM empresas_fornecedoras WHERE id_empresa=?${lock?' FOR UPDATE':''}`,[id]),
        companies(c,q) {
            const cnpjSearch = q.q?.replace(/[.\/-]/g, '');
            return rows(c,`SELECT id_empresa,razao_social,nome_cine,cnpj FROM empresas_fornecedoras WHERE id_empresa>?
                ${q.q?'AND (LOCATE(?,CONCAT_WS(\' \',razao_social,nome_cine))>0 OR LOCATE(?,cnpj)>0)':''} ORDER BY id_empresa LIMIT ?`,
                [q.cursor??'0',...(q.q?[q.q,cnpjSearch || q.q]:[]),q.limit+1]);
        },
        async createCompany(c,{razao_social,nome_cine,cnpj}) {
            const [result]=await c.execute('INSERT INTO empresas_fornecedoras(razao_social,nome_cine,cnpj) VALUES(?,?,?)',[razao_social,nome_cine??null,cnpj]);
            return idString(result.insertId);
        },
        async updateCompany(c,id,{razao_social,nome_cine}) {
            await c.execute('UPDATE empresas_fornecedoras SET razao_social=?,nome_cine=? WHERE id_empresa=?',[razao_social,nome_cine,id]);
            await c.execute('UPDATE fornecedores SET razao_social=?,nome_cine=? WHERE id_empresa=?',[razao_social,nome_cine,id]);
        },
        async create(c, userId, company) {
            const [result] = await c.execute("INSERT INTO fornecedores (id_usuario,id_empresa,razao_social,nome_cine,cnpj,status) VALUES (?,?,?,?,?,'ATIVO')",
                [userId,company.id_empresa,company.razao_social,company.nome_cine??null,company.cnpj]);
            return idString(result.insertId);
        },
        update(c, id, data) {
            const keys = Object.keys(data);
            if (!keys.length || keys.some(k => !['id_empresa','razao_social','nome_cine','cnpj','status'].includes(k))) throw new TypeError('Campos inválidos');
            return c.execute(`UPDATE fornecedores SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_fornecedor = ?`, [...keys.map(k => data[k]), id]);
        }
    };
}
