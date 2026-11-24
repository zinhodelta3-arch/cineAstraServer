import test from 'node:test';
import assert from 'node:assert/strict';
import {createTicketService} from '../src/services/ticketService.js';
import {ticketValidationBody,ticketConsumeBody} from '../src/validators/ticketValidators.js';

function fixture(items){
    const state={status:'PAGO',approved:true,scope:true,allowedSession:'5',role:'COLABORADOR',tickets:[],passages:[],audits:[],seats:[]};
    const model={order:async()=>({status:state.status}),approvedPayment:async()=>state.approved?{id_pagamento:'9'}:null,
        orderItems:async()=>items,existingUnit:async(c,itemId,type,unit)=>state.tickets.find(x=>x.id_item===itemId&&x.tipo===type&&x.unidade===unit)??null,
        insertUnit:async(c,p)=>{const id=String(state.tickets.length+1);state.tickets.push({id_ticket:id,id_item:p.itemId,id_pedido:'99',codigo:p.code,tipo:p.type,status:'GERADO',unidade:p.unit,expira_em:p.expiresAt,data_utilizacao:null,saida_em:null,id_sessao:p.type==='INGRESSO_SESSAO'?'5':null,sessao_vinculada:p.sessionId??(p.type==='INGRESSO_SESSAO'?'5':null),id_local:'7',id_usuario:'11',pedido_status:'PAGO',tipo_ingresso:'INTEIRA'});return id;},
        byCode:async(c,code)=>{const row=state.tickets.find(x=>x.codigo===code);return row?{...row,ultima_passagem:state.passages.filter(x=>x.id_ticket===row.id_ticket).at(-1)?.tipo??null}:null;},
        byAttendanceId:async(c,sessionId,ticketId)=>state.tickets.find(t=>t.id_ticket===ticketId&&t.id_sessao===sessionId),
        customerAttendanceTickets:async(c,sessionId)=>state.tickets.filter(t=>t.id_sessao===sessionId),
        staffScope:async(c,actor,role,sessionId)=>state.scope&&(!sessionId||String(sessionId)===state.allowedSession)?{id_equipe:'3'}:null,
        consume:async(c,id,actor,evidence)=>{const t=state.tickets.find(x=>x.id_ticket===id);if(t.status!=='GERADO')return false;t.status='UTILIZADO';t.data_utilizacao=new Date().toISOString();t.meia_comprovacao=evidence;return true;},
        exit:async(c,id)=>{const t=state.tickets.find(x=>x.id_ticket===id);if(t.status!=='UTILIZADO')return false;t.saida_em=new Date().toISOString();return true;},
        lastPassage:async(c,id)=>state.passages.filter(x=>x.id_ticket===id).at(-1)??null,
        appendPassage:async(c,id,type,actor,evidence)=>state.passages.push({id_passagem:String(state.passages.length+1),id_ticket:id,tipo:type,ocorrido_em:new Date().toISOString(),id_usuario_staff:actor,meia_comprovacao:evidence}),
        attendanceSummary:async()=>({total:1,entered:1,inside:0,exited:1,late:0}),
        attendance:async(c,sessionId,limit,cursor)=>state.passages.filter(x=>Number(x.id_passagem)>Number(cursor)&&state.tickets.find(t=>t.id_ticket===x.id_ticket)?.sessao_vinculada===sessionId).slice(0,limit+1),
        ownOrder:async(c,orderId,userId)=>userId==='11'?{id_pedido:orderId}:null,
        ownerTickets:async()=>state.tickets,sessionLocal:async()=>({id_local:'7'}),sessionTickets:async()=>state.tickets,
        sessionSeatMap:async()=>state.seats};
    const identity={transaction:async fn=>fn({execute:async()=>[]}),activeActor:async()=>({id_usuario:state.role==='CLIENTE'?'11':'12',tipo_usuario:state.role}),audit:async(c,type)=>state.audits.push(type)};
    return {state,service:createTicketService({model,identity})};
}

test('o mapa de sessão permite a equipe vinculada e limita os dados do comprador',async()=>{
    const f=fixture([]),context={actor:{id:'12'}};
    f.state.seats=[{id_assento:'1',fileira:'A',numero:2,posicao_visual:4,tipo:'PCD',status:'ATIVA',
        estado:'CONFIRMADA',id_pedido:'99',pedido_status:'PAGO',nome_comprador:'Lia Rocha',codigo:'privado',email:'exemplo@local.test'}];
    const {seats}=await f.service.seatMap('5',context);
    assert.deepEqual(seats[0],{seatId:'1',row:'A',number:2,position:4,type:'PCD',availability:'VENDIDO',
        customerName:'Lia Rocha',orderId:'99',orderStatus:'PAGO',reservedUntil:null});
    await assert.rejects(f.service.seatMap('6',context),{statusCode:403});
    f.state.role='CLIENTE';
    await assert.rejects(f.service.seatMap('5',context),{statusCode:403});
});

test('sessões interrompidas, canceladas ou já encerradas bloqueiam entrada e reentrada',async()=>{
    const f=fixture([{id_item:'1',id_sessao:'5',quantidade:1,data:'2099-01-01',horario_inicio:'12:00:00',
        horario_fim:'14:00:00',sessao_status:'AGENDADA'}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const ticket=f.state.tickets[0],context={actor:{id:'12'}};
    for(const status of ['INTERROMPIDA','CANCELADA','ENCERRADA']){
        ticket.sessao_status=status;
        assert.equal((await f.service.validate(ticket.codigo,context,'5')).valid,false);
        await assert.rejects(f.service.consume(ticket.codigo,undefined,context,'5'),{statusCode:409});
        await assert.rejects(f.service.entry(ticket.codigo,undefined,context,'5'),{statusCode:409});
    }
    assert.equal(f.state.passages.length,0);
});

test('supervisor vê ingressos de homônimos sem códigos, seleciona o assento certo e registra presença',async()=>{
    const f=fixture(['1','2'].map(id_item=>({id_item,id_sessao:'5',quantidade:1,data:'2099-01-01',
        horario_inicio:'12:00:00',horario_fim:'14:00:00',sessao_status:'AGENDADA'})));
    await f.service.issue({execute(){}},{orderId:'99'});
    const [first,second]=f.state.tickets,context={actor:{id:'12'}},query={q:'Ana Rocha',limit:12};
    Object.assign(first,{nome:'Ana Rocha',email:'ana.rocha@example.test',fileira:'A',numero:3});
    Object.assign(second,{nome:'Ana Rocha',email:'anarocha@example.test',fileira:'F',numero:7});
    await assert.rejects(f.service.customerTickets('5',query,context),{statusCode:403});
    f.state.role='SUPERVISOR';
    await assert.rejects(f.service.customerTickets('6',query,context),{statusCode:403});
    const {items}=await f.service.customerTickets('5',query,context);
    assert.deepEqual(items.map(item=>[item.id,item.name,item.seat]),[['1','Ana Rocha','A3'],['2','Ana Rocha','F7']]);
    assert.ok(items.every(item=>item.emailHint==='an•••@example.test'&&!('code' in item)));
    await f.service.customerPassage('5',{ticketId:second.id_ticket,direction:'ENTRADA'},context);
    await f.service.customerPassage('5',{ticketId:second.id_ticket,direction:'SAIDA'},context);
    assert.equal(first.status,'GERADO');
    assert.deepEqual(f.state.passages.map(p=>[p.id_ticket,p.tipo]),[['2','ENTRADA'],['2','SAIDA']]);
});

test('só emite após pagamento e gera uma unidade opaca para cada quantidade, sem duplicar',async()=>{
    const f=fixture([{id_item:'1',id_insumo:'2',quantidade:3}]);
    f.state.status='AGUARDANDO_PAGAMENTO';
    await assert.rejects(f.service.issue({execute(){}},{orderId:'99'}),{statusCode:409});
    f.state.status='PAGO';f.state.approved=false;
    await assert.rejects(f.service.issue({execute(){}},{orderId:'99'}),{statusCode:409});
    f.state.approved=true;
    assert.deepEqual(await f.service.issue({execute(){}},{orderId:'99'}),{created:3});
    assert.deepEqual(await f.service.issue({execute(){}},{orderId:'99'}),{created:0});
    assert.deepEqual(f.state.tickets.map(x=>x.unidade),[1,2,3]);
    assert.equal(new Set(f.state.tickets.map(x=>x.codigo)).size,3);
    assert.ok(f.state.tickets.every(x=>/^[A-Za-z0-9_-]{43}$/.test(x.codigo)));
});

test('validar não consome; equipe vinculada consome uma vez e permite retirada parcial',async()=>{
    const f=fixture([{id_item:'1',id_insumo:'2',quantidade:2}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const [first,second]=f.state.tickets,context={actor:{id:'12'}};
    const preview=await f.service.validate(first.codigo,context);
    assert.equal(preview.valid,true);assert.equal(first.status,'GERADO');
    const consumed=await f.service.consume(first.codigo,undefined,context);
    assert.equal(consumed.status,'UTILIZADO');assert.equal(second.status,'GERADO');
    await assert.rejects(f.service.consume(first.codigo,undefined,context),{statusCode:409});
    f.state.scope=false;
    await assert.rejects(f.service.validate(second.codigo,context),{statusCode:403});
    assert.deepEqual(f.state.audits,['TICKET.CONSUMED']);
});

test('combo cruza meia-noite, expira 30 minutos depois e impede emissão tardia',async()=>{
    const current=fixture([{id_item:'2',id_combo:'3',id_sessao_retirada:'5',quantidade:2,data:'2099-12-30',horario_inicio:'23:00:00',horario_fim:'01:00:00',sessao_status:'AGENDADA'}]);
    assert.equal(await current.service.canIssue({execute(){}},'99'),true);
    await current.service.issue({execute(){}},{orderId:'99'});
    assert.equal(current.state.tickets[0].expira_em,'2099-12-31 01:30:00.000');
    const old=fixture([{id_item:'2',id_combo:'3',id_sessao_retirada:'5',quantidade:1,data:'2020-01-01',horario_inicio:'23:00:00',horario_fim:'01:00:00',sessao_status:'ENCERRADA'}]);
    assert.equal(await old.service.canIssue({execute(){}},'99'),false);
    await assert.rejects(old.service.issue({execute(){}},{orderId:'99'}),{statusCode:409});
});

test('combo vendido sem sessão emite código de retirada na unidade',async()=>{
    const f=fixture([{id_item:'1',id_combo:'3',quantidade:1}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const ticket=f.state.tickets[0];
    assert.equal(ticket.tipo,'RETIRADA_INSUMO');
    assert.equal(ticket.expira_em,null);
    assert.equal(ticket.sessao_vinculada,null);
    const result=await f.service.consume(ticket.codigo,undefined,{actor:{id:'12'}});
    assert.equal(result.status,'UTILIZADO');
    assert.equal(f.state.passages.length,0);
});

test('meia exige conferência presencial e registra tipo mínimo, sem aceitar campos arbitrários',async()=>{
    const f=fixture([{id_item:'1',id_sessao:'5',quantidade:1,data:'2099-01-01',horario_inicio:'12:00:00',horario_fim:'14:00:00',sessao_status:'AGENDADA'}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const ticket=f.state.tickets[0],context={actor:{id:'12'}};
    ticket.tipo_ingresso='MEIA';
    assert.equal((await f.service.validate(ticket.codigo,context)).halfEvidenceRequired,true);
    await assert.rejects(f.service.consume(ticket.codigo,undefined,context),{statusCode:422});
    assert.equal((await f.service.consume(ticket.codigo,'CIE',context)).halfEvidenceChecked,true);
    assert.equal(ticket.meia_comprovacao,'CIE');
    assert.equal(ticketValidationBody.safeParse({code:ticket.codigo,status:'GERADO'}).success,false);
    assert.equal(ticketConsumeBody.safeParse({code:ticket.codigo,halfEvidenceType:'CIE',documentNumber:'123'}).success,false);
});

test('cliente vê somente tickets do próprio pedido; ticket expirado não consome',async()=>{
    const f=fixture([{id_item:'1',id_insumo:'2',quantidade:1}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const ticket=f.state.tickets[0];
    f.state.role='CLIENTE';
    const own=await f.service.ownerTickets('99',{limit:50,cursor:'0'},{actor:{id:'11'}});
    assert.equal(own.items[0].code,ticket.codigo);
    f.state.role='COLABORADOR';ticket.expira_em='2020-01-01 00:00:00.000';
    assert.equal((await f.service.validate(ticket.codigo,{actor:{id:'12'}})).valid,false);
    await assert.rejects(f.service.consume(ticket.codigo,undefined,{actor:{id:'12'}}),{statusCode:409});
});

test('saída exige ingresso já consumido e só registra uma vez',async()=>{
    const f=fixture([{id_item:'1',id_sessao:'5',quantidade:1,data:'2099-01-01',horario_inicio:'12:00:00',horario_fim:'14:00:00',sessao_status:'AGENDADA'}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const code=f.state.tickets[0].codigo,context={actor:{id:'12'}};
    await assert.rejects(f.service.validate(code,context,'6'),{statusCode:409});
    await assert.rejects(f.service.consume(code,undefined,context,'6'),{statusCode:409});
    await assert.rejects(f.service.exit(code,context),{statusCode:409});
    await f.service.consume(code,undefined,context,'5');
    await assert.rejects(f.service.exit(code,context,'6'),{statusCode:409});
    assert.ok((await f.service.exit(code,context)).exitedAt);
    await assert.rejects(f.service.exit(code,context),{statusCode:409});
});

test('reentrada mantém ticket utilizado e registra passagens, dupla entrada/saída é inválida',async()=>{
    const f=fixture([{id_item:'1',id_sessao:'5',quantidade:1,data:'2099-01-01',horario_inicio:'12:00:00',horario_fim:'14:00:00',sessao_status:'AGENDADA'}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const code=f.state.tickets[0].codigo,ctx={actor:{id:'12'}};
    await assert.rejects(f.service.entry(code,undefined,ctx),{statusCode:409});
    await f.service.consume(code,undefined,ctx);
    await assert.rejects(f.service.entry(code,undefined,ctx),{statusCode:409});
    await f.service.exit(code,ctx);
    assert.equal((await f.service.validate(code,ctx)).reentryAllowed,true);
    await assert.rejects(f.service.entry(code,undefined,ctx,'6'),{statusCode:409});
    assert.equal((await f.service.entry(code,undefined,ctx)).presence,'DENTRO');
    await assert.rejects(f.service.entry(code,undefined,ctx),{statusCode:409});
    await f.service.exit(code,ctx);
    assert.equal(f.state.tickets[0].status,'UTILIZADO');
    assert.deepEqual(f.state.passages.map(x=>x.tipo),['ENTRADA','SAIDA','ENTRADA','SAIDA']);
    const attendance=await f.service.attendance('5',{limit:50,cursor:'0'},ctx);
    assert.equal(attendance.items.length,4);
    assert.equal(attendance.summary.entered,1);
    f.state.tickets[0].expira_em='2020-01-01 00:00:00.000';
    assert.equal((await f.service.validate(code,ctx)).reentryAllowed,false);
    await assert.rejects(f.service.entry(code,undefined,ctx),{statusCode:409});
});

test('staff de outra sessão não lê histórico nem registra passagem; reentrada de meia exige nova conferência',async()=>{
    const f=fixture([{id_item:'1',id_sessao:'5',quantidade:1,data:'2099-01-01',horario_inicio:'12:00:00',horario_fim:'14:00:00',sessao_status:'AGENDADA'}]);
    await f.service.issue({execute(){}},{orderId:'99'});
    const code=f.state.tickets[0].codigo,ctx={actor:{id:'12'}};
    f.state.tickets[0].tipo_ingresso='MEIA';
    await f.service.consume(code,'CIE',ctx);
    await f.service.exit(code,ctx);
    await assert.rejects(f.service.entry(code,undefined,ctx),{statusCode:422});
    f.state.allowedSession='6';
    await assert.rejects(f.service.entry(code,'CIE',ctx),{statusCode:403});
    await assert.rejects(f.service.attendance('5',{limit:50,cursor:'0'},ctx),{statusCode:403});
    f.state.allowedSession='5';
    await f.service.entry(code,'CIE',ctx);
    assert.equal(f.state.passages.at(-1).meia_comprovacao,'CIE');
});
