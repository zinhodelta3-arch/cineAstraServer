const projection=`i.id_insumo,i.id_local,i.nome,i.descricao,i.categoria,i.preco,
    (i.quantidade-i.quantidade_reservada>0) AS em_estoque,
    (SELECT im.url FROM insumos_imagens im WHERE im.id_insumo=i.id_insumo AND im.tipo='PRINCIPAL' ORDER BY im.ordem,im.id_imagem LIMIT 1) AS imagem`;
const from=` FROM insumos i JOIN locais l ON l.id_local=i.id_local
    JOIN fornecedores f ON f.id_fornecedor=i.id_fornecedor JOIN usuarios u ON u.id_usuario=f.id_usuario
    JOIN fornecedor_locais fl ON fl.id_fornecedor=i.id_fornecedor AND fl.id_local=i.id_local`;
const visible="i.id_local=? AND i.status='DISPONIVEL' AND i.venda_avulsa=TRUE AND l.status='ATIVO' AND f.status='ATIVO' AND u.status='ATIVO' AND u.tipo_usuario='FORNECEDOR' AND fl.status='ATIVO'";
export function createSnackCatalogModel(database){return {
    async list(localId,q){
        const where=[visible],args=[localId];
        if(q.cursor){where.push('i.id_insumo>?');args.push(q.cursor);}
        if(q.category){where.push('i.categoria=?');args.push(q.category);}
        if(q.q){where.push("i.nome LIKE ? ESCAPE '!'");args.push('%'+q.q.replace(/[!%_]/g,c=>'!'+c)+'%');}
        if(q.inStock!==undefined){where.push('(i.quantidade-i.quantidade_reservada>0)=?');args.push(q.inStock?1:0);}
        args.push(q.limit+1);
        return (await database.execute(`SELECT ${projection}${from} WHERE ${where.join(' AND ')} ORDER BY i.id_insumo LIMIT ?`,args))[0];
    },
    async get(localId,id){return (await database.execute(`SELECT ${projection}${from} WHERE ${visible} AND i.id_insumo=?`,[localId,id]))[0][0]??null;}
};}
