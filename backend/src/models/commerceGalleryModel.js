import { idString } from '../utils/dto.js';
import { createComboModel } from './comboModel.js';

const config = {
    inputs: { table: 'insumos_imagens', parent: 'insumos', id: 'id_insumo' },
    combos: { table: 'combos_imagens', parent: 'combos', id: 'id_combo' }
};
const spec = type => { if (!config[type]) throw new TypeError('Galeria inválida'); return config[type]; };
export function createCommerceGalleryModel(database) {
    const one = async (c, sql, args) => (await c.execute(sql, args))[0][0] ?? null;
    const comboModel = createComboModel(database);
    const publicInput = `SELECT i.id_insumo FROM insumos i
        JOIN fornecedores f ON f.id_fornecedor = i.id_fornecedor
        JOIN usuarios u ON u.id_usuario = f.id_usuario
        JOIN locais l ON l.id_local = i.id_local
        JOIN fornecedor_locais fl ON fl.id_fornecedor = i.id_fornecedor AND fl.id_local = i.id_local`;
    const visibleInput = "i.status = 'DISPONIVEL' AND i.venda_avulsa = TRUE AND f.status = 'ATIVO' AND u.status = 'ATIVO' AND u.tipo_usuario = 'FORNECEDOR' AND l.status = 'ATIVO' AND fl.status = 'ATIVO'";
    return {
        parent(type, id) { const s = spec(type); return one(database, `SELECT ${s.id} FROM ${s.parent} WHERE ${s.id} = ?`, [id]); },
        lockParent(type, c, id) { const s = spec(type); return one(c, `SELECT ${s.id}${type === 'inputs' ? ',id_fornecedor,id_local,status' : ',id_local,ativo'} FROM ${s.parent} WHERE ${s.id} = ? FOR UPDATE`, [id]); },
        async publicParent(type, id) {
            if (type === 'inputs') return one(database, `${publicInput} WHERE i.id_insumo = ? AND ${visibleInput}`, [id]);
            const row = await comboModel.combo(id);
            if (!row?.ativo || row.id_local === null) return null;
            const visible = await comboModel.list({ localId: idString(row.id_local), cursor: String(BigInt(id) - 1n), limit: 1 });
            return visible[0] && idString(visible[0].id_combo) === idString(id) ? row : null;
        },
        ownership: (c, id) => one(c, 'SELECT f.id_usuario,f.status AS fornecedor_status,u.status AS usuario_status,u.tipo_usuario,l.status AS local_status,fl.status AS vinculo_status FROM insumos i JOIN fornecedores f ON f.id_fornecedor = i.id_fornecedor JOIN usuarios u ON u.id_usuario = f.id_usuario JOIN locais l ON l.id_local = i.id_local LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor = i.id_fornecedor AND fl.id_local = i.id_local WHERE i.id_insumo = ?', [id]),
        image(type, c, parentId, imageId) { const s = spec(type); return one(c, `SELECT id_imagem,${s.id},tipo,url,texto_alternativo,ordem FROM ${s.table} WHERE ${s.id} = ? AND id_imagem = ?`, [parentId,imageId]); },
        async list(type, parentId, q, c = database) {
            const s = spec(type);
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const [order, imageId] = q.cursor && q.cursor !== '0' ? q.cursor.split(':') : ['0','0'];
            const args = [parentId,order,order,imageId]; if (q.tipo) args.push(q.tipo);
            return (await c.execute(`SELECT id_imagem,${s.id},tipo,url,texto_alternativo,ordem FROM ${s.table} WHERE ${s.id} = ? AND (ordem > ? OR (ordem = ? AND id_imagem > ?))${q.tipo ? ' AND tipo = ?' : ''} ORDER BY ordem,id_imagem LIMIT ${q.limit + 1}`, args))[0];
        },
        clearPrincipal(type, c, parentId) { const s = spec(type); return c.execute(`UPDATE ${s.table} SET tipo = 'ALTERNATIVA' WHERE ${s.id} = ? AND tipo = 'PRINCIPAL'`, [parentId]); },
        async lockMatchingProducts(type, c, id) {
            const { parent, id: column } = spec(type);
            const group = type === 'inputs' ? 'categoria' : 'id_evento';
            const [rows] = await c.execute(`SELECT target.${column} AS id FROM ${parent} source
                JOIN ${parent} target ON target.nome = source.nome AND target.${group} <=> source.${group}
                WHERE source.${column} = ? AND (target.id_local IS NOT NULL OR target.${column} = ?)
                ORDER BY target.${column} FOR UPDATE OF target`, [id,id]);
            return rows.map(row => idString(row.id));
        },
        async setSharedPrincipal(type, c, ids, data) {
            const { table, id: column } = spec(type);
            for (let offset = 0; offset < ids.length; offset += 500) {
                const batch = ids.slice(offset, offset + 500);
                await c.execute(`UPDATE ${table} SET tipo = 'ALTERNATIVA'
                    WHERE tipo = 'PRINCIPAL' AND ${column} IN (${batch.map(() => '?').join(',')})`, batch);
                await c.execute(`INSERT INTO ${table} (${column},tipo,url,texto_alternativo,ordem)
                    VALUES ${batch.map(() => "(?,'PRINCIPAL',?,?,?)").join(',')}`,
                batch.flatMap(id => [id,data.url,data.texto_alternativo ?? null,data.ordem]));
            }
        },
        async insert(type, c, parentId, data) { const s = spec(type); const [r] = await c.execute(`INSERT INTO ${s.table} (${s.id},tipo,url,texto_alternativo,ordem) VALUES (?,?,?,?,?)`, [parentId,data.tipo,data.url,data.texto_alternativo ?? null,data.ordem]); return idString(r.insertId); },
        patch(type, c, parentId, imageId, data) { const s = spec(type), keys = Object.keys(data); if (!keys.length || keys.some(k => !['tipo','texto_alternativo','ordem'].includes(k))) throw new TypeError('Campos inválidos'); return c.execute(`UPDATE ${s.table} SET ${keys.map(k => `${k} = ?`).join(',')} WHERE ${s.id} = ? AND id_imagem = ?`, [...keys.map(k => data[k]),parentId,imageId]); },
        remove(type, c, parentId, imageId) { const s = spec(type); return c.execute(`DELETE FROM ${s.table} WHERE ${s.id} = ? AND id_imagem = ?`, [parentId,imageId]); },
        reference(type, c, url) { const s = spec(type); return one(c, `SELECT id_imagem FROM ${s.table} WHERE url = ? LIMIT 1`, [url]); },
        async publicReference(type, url) {
            if (type === 'inputs') return one(database, `${publicInput}
                JOIN insumos_imagens im ON im.id_insumo = i.id_insumo
                WHERE im.url = ? AND ${visibleInput} LIMIT 1`, [url]);
            const [rows] = await database.execute(`SELECT DISTINCT c.id_combo FROM combos_imagens im
                JOIN combos c ON c.id_combo = im.id_combo
                JOIN locais l ON l.id_local = c.id_local
                WHERE im.url = ? AND c.ativo = TRUE AND c.oferta_local = TRUE AND l.status = 'ATIVO'`, [url]);
            for (const row of rows) {
                const visible = await this.publicParent(type, row.id_combo);
                if (visible) return visible;
            }
            return null;
        }
    };
}
