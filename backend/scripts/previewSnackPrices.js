// Prévia somente: lista produtos e consulta cotações; nunca chama publicação.
// Uso: node backend/scripts/previewSnackPrices.js https://servidor/api
// Forneça o token ADMIN pela entrada padrão, sem incluí-lo na linha de comando.
let token;
try {
    const base=new URL(process.argv[2]);
    if(process.argv.length!==3||base.username||base.password||base.search||base.hash||
        !['http:','https:'].includes(base.protocol)||
        (base.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(base.hostname)))throw new Error('Informe somente a URL base da API; use HTTPS fora do ambiente local.');
    if(process.stdin.isTTY)throw new Error('Forneça um token ADMIN pela entrada padrão.');
    token='';
    for await(const chunk of process.stdin){token+=chunk.toString();if(token.length>8192)throw new Error('Token inválido.');}
    token=token.trim();
    if(!token||/\s/.test(token))throw new Error('Token inválido.');
    const origin=base.href.replace(/\/$/,'');
    async function request(path,body){
        const response=await fetch(`${origin}${path}`,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(15000),
            headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
            ...(body?{body:JSON.stringify(body)}:{})});
        const payload=await response.json().catch(()=>null);
        if(!response.ok){
            const error=new Error(`Consulta recusada pela API (HTTP ${response.status}).`);
            error.status=response.status;
            error.code=typeof payload?.code==='string'&&/^[A-Z_]{1,80}$/.test(payload.code)?payload.code:'API_ERROR';
            throw error;
        }
        if(payload?.success!==true||payload.data==null)throw new Error('Resposta inválida da API.');
        return payload.data;
    }
    const report=[],availableInputs=new Map();
    for(const spec of [{category:'INPUT',path:'/inputs?status=DISPONIVEL&limit=100',key:'id_insumo'},
        {category:'COMBO',path:'/admin/combos?active=true&limit=100',key:'id_combo'}]){
        let cursor=null;
        const seen=new Set();
        do{
            const page=await request(`${spec.path}${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`);
            if(!Array.isArray(page.items)||!page.pagination)throw new Error('Lista de produtos inválida.');
            for(const row of page.items){
                const id=String(row[spec.key]);
                if(!/^[1-9]\d{0,19}$/.test(id))throw new Error('Identificador inválido na lista.');
                const entry={category:spec.category,id,localId:row.id_local,name:row.nome};
                if(spec.category==='INPUT')availableInputs.set(id,row);
                try{
                    if(spec.category==='COMBO'){
                        const detail=await request(`/admin/combos/${id}`);
                        if(!Array.isArray(detail.items))throw new Error('Composição inválida na resposta.');
                        if(!detail.items.length||String(detail.id_local)!==String(row.id_local)||detail.items.some(part=>{
                            const input=availableInputs.get(String(part.id_insumo));
                            return !input||String(input.id_local)!==String(row.id_local)||!Number.isSafeInteger(part.quantidade)||part.quantidade<1;
                        })){
                            report.push({...entry,status:'BLOQUEADO',reason:'INVALID_COMPOSITION'});
                            continue;
                        }
                    }
                    const quote=await request('/admin/pricing/quote',{lines:[{category:spec.category,id,quantity:1}]});
                    const line=quote.lines?.[0];
                    if(quote.lines?.length!==1||line?.id!==id||line.category!==spec.category||
                        !/^(0|[1-9]\d{0,7})\.\d{2}$/.test(line.base)||
                        !/^(0|[1-9]\d{0,7})\.\d{2}$/.test(line.publishedPrice))throw new Error('Cotação inválida.');
                    if(typeof line.suggestedPrice!=='string'||!/^(0|[1-9]\d{0,7})\.\d{2}$/.test(line.suggestedPrice))throw new Error('API sem o contrato atualizado de preços cadastrados.');
                    if(line.suggestedPrice!==line.publishedPrice)report.push({...entry,status:'SUGESTAO',currentPrice:line.publishedPrice,
                        suggestedPrice:line.suggestedPrice,currency:'BRL',requiresPublication:false});
                }catch(error){
                    if([401,403,429].includes(error.status)||error.status>=500||typeof error.code!=='string')throw error;
                    report.push({...entry,status:'BLOQUEADO',reason:error.code});
                }
            }
            cursor=page.pagination.nextCursor;
            if(cursor!=null){if(typeof cursor!=='string'||!/^[1-9]\d{0,19}$/.test(cursor)||seen.has(cursor))throw new Error('Paginação inválida.');seen.add(cursor);}
        }while(cursor!=null);
    }
    console.info(JSON.stringify({generatedAt:new Date().toISOString(),readOnly:true,scope:'INPUT_COMBO',
        note:'Diferenças entre preço cadastrado e sugestão por markup são informativas e não exigem republicação. Descontos, estoque e elegibilidade seguem as regras do checkout.',items:report},null,2));
}catch(error){
    console.error(['Token inválido.','Forneça um token ADMIN pela entrada padrão.',
        'Informe somente a URL base da API; use HTTPS fora do ambiente local.'].includes(error.message)?error.message:
        `Prévia interrompida${error.status?` (HTTP ${error.status})`:''}; confira URL, autenticação, conexão e resposta da API. Nenhum preço foi publicado.`);
    process.exitCode=1;
}finally{token=null;}
