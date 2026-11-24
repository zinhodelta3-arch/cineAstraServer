import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { interval } from './sessionService.js';
import { instant } from './identityService.js';
import { hashPassword,passwordPolicy } from '../utils/identityCrypto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'TEAM_CONFLICT');
const entryMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
const activeSession = row => ['AGENDADA','EM_CARTAZ'].includes(row?.sessao_status ?? row?.status)
    && (row.room_status==null||row.room_status==='ATIVA') && (row.location_status==null||row.location_status==='ATIVO')
    && (!row.data || interval(row).end>Date.now());
export const teamDto = row => ({
    id_equipe: idString(row.id_equipe), id_supervisor: idString(row.id_supervisor), id_sessao: idString(row.id_sessao),
    supervisorName:row.supervisor_nome??null,
    nome: row.nome, status: row.status, sessionStatus: row.sessao_status ?? null, sessionOpen:activeSession(row),
    location:row.id_local==null||!row.cinema?null:{id:idString(row.id_local),name:row.cinema},
    schedule:row.data?{date:row.data,start:row.horario_inicio,end:row.horario_fim}:null,
    ...(Object.hasOwn(row, 'minha_funcao') ? { myFunction: row.minha_funcao ?? null } : {})
});
export const memberDto = row => ({ id_equipe_membro: idString(row.id_equipe_membro), id_equipe: idString(row.id_equipe), id_usuario: idString(row.id_usuario),
    name:row.member_name??null,funcao:row.funcao??null,data_entrada:row.data_entrada,status:row.status });
export const entryDto = row => ({ id_entrada: idString(row.id_entrada), id_equipe: idString(row.id_equipe), id_usuario: idString(row.id_usuario), id_emissor: idString(row.id_emissor), tipo: row.tipo, funcao_proposta: row.funcao_proposta ?? null, status: row.status, criado_em: row.criado_em, decidido_em: row.decidido_em ?? null,
    ...(Object.hasOwn(row,'expiresAt')&&{expiresAt:row.expiresAt}) });
const staffDto=row=>({id:idString(row.id_usuario),name:row.nome,email:row.email,phone:row.telefone??null,status:row.status});
export function createTeamService({ model, identity, notifications, bcryptCost }) {
    if (!notifications?.emit) throw new TypeError('Serviço interno de notificações obrigatório');
    async function actor(c, context) {
        const u = await identity.activeActor(c, context);
        if (!['ADMIN','SUPERVISOR','COLABORADOR'].includes(u.tipo_usuario)) throw ApiError.acessoNegado();
        return { id: idString(u.id_usuario), tipo: u.tipo_usuario };
    }
    async function unitSupervisor(u, team, c) {
        if (u.tipo === 'ADMIN') return true;
        if (u.tipo !== 'SUPERVISOR') return false;
        const location = await model.supervisorLocation(u.id, c);
        return Boolean(location && idString(location.id_local) === idString(team.id_local));
    }
    function manager(u,team,c){
        return u.tipo==='ADMIN'||(u.id===idString(team.id_supervisor)&&unitSupervisor(u,team,c));
    }
    async function supervisorLocal(c,u){
        if(u.tipo!=='SUPERVISOR')throw ApiError.acessoNegado();
        const location=await model.supervisorLocation(u.id,c,true);
        if(!location)throw ApiError.acessoNegado();
        return idString(location.id_local);
    }
    async function localAccount(c,u,userId){
        const localId=await supervisorLocal(c,u);
        const account=await identity.model.user(userId,c,true);
        if(account?.tipo_usuario!=='COLABORADOR'||account.status!=='ATIVO'||!await model.activeMemberInLocal(userId,localId,c)){
            throw ApiError.naoEncontrado();
        }
        return {localId,account};
    }
    async function notifyInvitation(c,userId,team,entryId){
        await notifications.emit(c,{recipientId:idString(userId),title:'Convite para equipe',
            message:`Você recebeu um convite para ${team.nome}. Abra Equipes no portal da unidade para responder.`,
            type:'TEAM_INVITATION',dedupeKey:`team-invitation:${entryId}`,target:{kind:'team',id:idString(team.id_equipe),detailId:entryId}});
    }
    async function lockedTeam(c, id) { return found(await model.lockTeam(id, c)); }
    async function eligibleUser(c, id, role, lock = false) {
        const u = found(await model.user(id, c, lock));
        if (u.status !== 'ATIVO' || u.tipo_usuario !== role) throw conflict(`Usuário deve ser ${role} ativo`);
        return u;
    }
    async function writableTeam(c, team) {
        if (team.status !== 'ATIVA' || !activeSession(await model.session(team.id_sessao, c))) throw conflict('Equipe ou sessão não aceita novas alterações operacionais');
    }
    async function noActiveMember(c, teamId, userId) {
        const member = await model.memberByUser(teamId, userId, c);
        if (member?.status === 'ATIVO') throw conflict('Usuário já participa da equipe');
        return member;
    }
    async function eligibleLocation(c,userId,localId){
        return !await model.activeMembership(userId,c)||Boolean(await model.activeMemberInLocal(userId,localId,c));
    }
    async function hasResponsible(c,team){
        const supervisor=await model.user(team.id_supervisor,c);
        if(supervisor?.tipo_usuario!=='SUPERVISOR'||supervisor.status!=='ATIVO')return false;
        const assignment=await model.supervisorLocation(team.id_supervisor,c);
        return Boolean(assignment&&idString(assignment.id_local)===idString(team.id_local));
    }
    async function entryIssue(c,team,entry){
        if(team.status!=='ATIVA'||!activeSession(await model.session(team.id_sessao,c)))return 'A equipe ou a sessão deixou de aceitar entradas.';
        if(instant(entry.criado_em)+entryMaxAgeMs<=Date.now())return 'O prazo de sete dias para decidir esta entrada terminou.';
        if(!await hasResponsible(c,team))return 'A equipe está sem supervisor ativo vinculado ao cinema.';
        const collaborator=await model.user(entry.id_usuario,c,true);
        if(collaborator?.tipo_usuario!=='COLABORADOR'||collaborator.status!=='ATIVO')return 'A conta deixou de ser elegível para participar da equipe.';
        const userId=idString(entry.id_usuario);
        if(!await eligibleLocation(c,userId,team.id_local))return 'O colaborador possui equipe vigente em outro cinema.';
        if((await model.memberByUser(team.id_equipe,userId,c))?.status==='ATIVO')return 'O colaborador já participa desta equipe.';
        return null;
    }
    async function invalidate(c,teamId,entryId,context={}){
        await model.decideEntry(c,teamId,entryId,'CANCELADA');
        await identity.audit(c,'TEAM.ENTRY_INVALIDATED',entryId,context);
    }
    function page(rows, q, dto, key) { const items = rows.slice(0, q.limit); return { items: items.map(dto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[key]) : null } }; }
    async function transaction(operation, context) {
        try { return await identity.transaction(async c => operation(c, await actor(c, context)), context); }
        catch (error) { if (error.code === 'ER_DUP_ENTRY') throw conflict('Solicitação, convite ou vínculo já existe'); throw error; }
    }
    return {
        async localCollaborators(q,context){
            return transaction(async(c,u)=>{
                const localId=await supervisorLocal(c,u);
                return page(await model.localCollaborators(c,localId,q),q,staffDto,'id_usuario');
            },context);
        },
        async createCollaborator(id,input,context){
            if(context.actor.tipo!=='SUPERVISOR')throw ApiError.acessoNegado();
            passwordPolicy(input.password,input.passwordConfirmation);
            const hash=await hashPassword(input.password,bcryptCost);
            return transaction(async(c,u)=>{
                const team=await lockedTeam(c,id);
                if(u.tipo!=='SUPERVISOR'||!await manager(u,team,c))throw ApiError.acessoNegado();
                await writableTeam(c,team);
                const {name,email,cpf,dateOfBirth}=input;
                const userId=await identity.model.createUser(c,{name,email,cpf,dateOfBirth,hash,role:'COLABORADOR',status:'ATIVO'});
                await identity.notifyAccountCreated?.(c,userId);
                const entryId=await model.createEntry(c,{teamId:id,userId,actorId:u.id,type:'CONVITE',functionName:input.funcao});
                await notifyInvitation(c,userId,team,entryId);
                await identity.audit(c,'IDENTITY.COLLABORATOR_CREATED_BY_SUPERVISOR',userId,context);
                await identity.audit(c,'TEAM.ENTRY_PROPOSED',entryId,context);
                return {id:userId,name,entryId};
            },context);
        },
        async editCollaborator(userId,input,context){
            return transaction(async(c,u)=>{
                const {account}=await localAccount(c,u,userId);
                const patch={...(input.name!==undefined&&{nome:input.name}),...(input.phone!==undefined&&{telefone:input.phone})};
                await identity.model.updateUser(c,userId,patch);
                await identity.audit(c,'IDENTITY.COLLABORATOR_UPDATED_BY_SUPERVISOR',userId,context);
                return staffDto({...account,...patch});
            },context);
        },
        async deactivateCollaborator(userId,context){
            return transaction(async(c,u)=>{
                const {localId}=await localAccount(c,u,userId);
                if(await model.hasOtherLocation(c,userId,localId))throw conflict('O colaborador tem vínculo vigente em outro cinema. A desativação precisa ser feita pelo Admin.');
                await identity.model.updateUser(c,userId,{status:'INATIVO'});
                await identity.model.revoke(c,userId);
                await identity.model.invalidateChallenges(c,userId);
                await identity.model.invalidateRecovery(c,userId);
                await model.deactivateLocalMemberships(c,userId,localId);
                await model.cancelUserEntries(c,userId);
                await identity.audit(c,'IDENTITY.COLLABORATOR_DEACTIVATED_BY_SUPERVISOR',userId,context);
            },context);
        },
        async expireEntries(limit=25){
            const candidates=await model.invalidEntries(limit);
            let expired=0;
            for(const candidate of candidates){
                const teamId=idString(candidate.id_equipe),entryId=idString(candidate.id_entrada);
                expired+=await identity.transaction(async c=>{
                    const team=await model.lockTeam(teamId,c);
                    const entry=team&&await model.entry(teamId,entryId,c,true);
                    if(entry?.status!=='PENDENTE'||!await entryIssue(c,team,entry))return 0;
                    await invalidate(c,teamId,entryId);
                    return 1;
                });
            }
            return {expired};
        },
        async eligibleSessions(q,context){
            if(context.actor.tipo!=='SUPERVISOR')throw ApiError.acessoNegado();
            return page(await model.eligibleSessions(context.actor.id,q),q,row=>({...row,id_sessao:idString(row.id_sessao)}),'id_sessao');
        },
        async available(q, context) {
            return transaction(async (c, u) => {
                if (u.tipo !== 'COLABORADOR') throw ApiError.acessoNegado();
                const hasTeam = Boolean(await model.activeMembership(u.id, c));
                const rows = await model.availableTeams(u.id,q,c);
                return { hasTeam, ...page(rows, q, row => ({ ...row, id_equipe: idString(row.id_equipe) }), 'id_equipe') };
            }, context);
        },
        async ownRequests(q, context) {
            if (context.actor.tipo !== 'COLABORADOR') throw ApiError.acessoNegado();
            return page(await model.ownRequests(context.actor.id, q), q, row => ({
                ...row, id_entrada: idString(row.id_entrada), id_equipe: idString(row.id_equipe)
            }), 'id_entrada');
        },
        async ownInvitations(q,context){
            if(context.actor.tipo!=='COLABORADOR')throw ApiError.acessoNegado();
            return page(await model.ownInvitations(context.actor.id,q),q,row=>({
                ...row,id_entrada:idString(row.id_entrada),id_equipe:idString(row.id_equipe),
            }),'id_entrada');
        },
        async context(context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo };
            if (!['SUPERVISOR','COLABORADOR'].includes(u.tipo)) throw ApiError.acessoNegado();
            const locations = await model.actorLocations(u);
            return { locations: locations.map(row => ({ id_local: idString(row.id_local), nome: row.nome })) };
        },
        async collaborator(email, context) {
            if (context.actor.tipo !== 'SUPERVISOR' || !await model.supervisorLocation(context.actor.id)) throw ApiError.acessoNegado();
            const user = found(await model.collaboratorByEmail(email));
            return { id: idString(user.id_usuario), name: user.nome };
        },
        async listTeams(q, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo };
            if (!['ADMIN','SUPERVISOR','COLABORADOR'].includes(u.tipo)) throw ApiError.acessoNegado();
            return page(await model.listTeams(u, q), q, teamDto, 'id_equipe');
        },
        async team(id, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo }, team = found(await model.team(id));
            if (!await unitSupervisor(u, team)) {
                const member = await model.memberByUser(id, u.id);
                const invitation = u.tipo === 'COLABORADOR' && await model.visibleInvitation(id,u.id);
                if (!(u.tipo === 'COLABORADOR' && (member?.status === 'ATIVO' || invitation))) throw ApiError.acessoNegado();
                return teamDto({ ...team, minha_funcao: member?.status === 'ATIVO' ? member.funcao : null });
            }
            return teamDto(team);
        },
        async create(input, context) {
            return transaction(async (c, u) => {
                if (!['ADMIN','SUPERVISOR'].includes(u.tipo)) throw ApiError.acessoNegado();
                const supervisorId = u.tipo === 'SUPERVISOR' ? u.id : input.supervisorId;
                if (!supervisorId || u.tipo === 'SUPERVISOR' && input.supervisorId && input.supervisorId !== u.id) throw ApiError.acessoNegado();
                // Sessão antes da equipe: cria e serializa uma equipe ativa por sessão.
                const session = found(await model.session(input.sessionId, c, true));
                if (!activeSession(session)) throw conflict('Sessão não admite equipe ativa');
                await eligibleUser(c, supervisorId, 'SUPERVISOR', true);
                const location = await model.supervisorLocation(supervisorId, c, true);
                if (!location || idString(location.id_local) !== idString(session.id_local)) throw conflict('Supervisor não está vinculado ao cinema desta sessão');
                if (await model.activeTeamForSession(input.sessionId, c)) throw conflict('Sessão já tem equipe ativa');
                const id = await model.create(c, { sessionId: input.sessionId, supervisorId, nome: input.nome });
                await identity.audit(c, 'TEAM.CREATED', id, context);
                return teamDto(found(await model.team(id, c)));
            }, context);
        },
        async patch(id, input, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!await manager(u, team, c)) throw ApiError.acessoNegado();
                if (team.status !== 'ATIVA') throw conflict('Equipe encerrada');
                if (input.supervisorId && u.tipo !== 'ADMIN') throw ApiError.acessoNegado();
                if (input.supervisorId) {
                    await eligibleUser(c, input.supervisorId, 'SUPERVISOR', true);
                    const session = found(await model.session(team.id_sessao, c));
                    const location = await model.supervisorLocation(input.supervisorId, c, true);
                    if (!location || idString(location.id_local) !== idString(session.id_local)) throw conflict('Supervisor não está vinculado ao cinema desta sessão');
                }
                if (!input.status || input.nome || input.supervisorId) await writableTeam(c, team);
                const data = { ...input };
                if (input.supervisorId) { data.id_supervisor = input.supervisorId; delete data.supervisorId; await model.cancelPending(c, id); }
                if (input.status) await model.cancelPending(c, id);
                await model.update(c, id, data);
                await identity.audit(c, 'TEAM.CHANGED', id, context);
                return teamDto(found(await model.team(id, c)));
            }, context);
        },
        async archive(id, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!await manager(u, team, c)) throw ApiError.acessoNegado();
                if (team.status === 'CANCELADA') return;
                if (team.status !== 'ATIVA') throw conflict('Equipe finalizada');
                await model.cancelPending(c, id);
                await model.update(c, id, { status: 'CANCELADA' });
                await identity.audit(c, 'TEAM.CANCELLED', id, context);
            }, context);
        },
        async members(id, q, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo }, team = found(await model.team(id));
            if (!await unitSupervisor(u, team) && !(u.tipo === 'COLABORADOR' && (await model.memberByUser(id, u.id))?.status === 'ATIVO')) throw ApiError.acessoNegado();
            return page(await model.listMembers(id, q), q, memberDto, 'id_equipe_membro');
        },
        async changeMember(id, memberId, input, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!await manager(u, team, c)) throw ApiError.acessoNegado();
                await writableTeam(c, team);
                const member = found(await model.member(id, memberId, c));
                if (member.status !== 'ATIVO') throw conflict('Membro inativo exige novo convite ou solicitação');
                await model.updateMember(c, id, memberId, input);
                await identity.audit(c, 'TEAM.MEMBER_CHANGED', memberId, context);
                return memberDto(found(await model.member(id, memberId, c)));
            }, context);
        },
        async removeMember(id, memberId, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                if (!await manager(u, team, c)) throw ApiError.acessoNegado();
                await writableTeam(c, team);
                const member = found(await model.member(id, memberId, c));
                if (member.status === 'INATIVO') return;
                await model.updateMember(c, id, memberId, { status: 'INATIVO' });
                await identity.audit(c, 'TEAM.MEMBER_REMOVED', memberId, context);
            }, context);
        },
        async entries(id, q, context) {
            const u = { id: context.actor.id, tipo: context.actor.tipo }, team = found(await model.team(id));
            const canViewAll = await unitSupervisor(u, team);
            if (!canViewAll) {
                const member = u.tipo === 'COLABORADOR' && await model.memberByUser(id, u.id);
                const invitation = u.tipo === 'COLABORADOR' && await model.visibleInvitation(id,u.id);
                if (member?.status !== 'ATIVO' && !invitation) throw ApiError.acessoNegado();
            }
            return page(await model.listEntries(id, q, canViewAll ? null : u.id), q, entryDto, 'id_entrada');
        },
        async propose(id, input, type, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                await writableTeam(c, team);
                const request = type === 'SOLICITACAO';
                if (request && u.tipo !== 'COLABORADOR' || !request && !await manager(u, team, c)) throw ApiError.acessoNegado();
                const collaborator=!request&&input.email?await model.collaboratorByEmail(input.email,c):null;
                if(!request&&input.email&&!collaborator)throw conflict('Nenhum colaborador ativo foi encontrado com esse e-mail.');
                const userId=request?u.id:input.userId??idString(collaborator.id_usuario);
                await eligibleUser(c, userId, 'COLABORADOR', true);
                if (!await eligibleLocation(c,userId,team.id_local)) throw conflict('O colaborador já possui equipe vigente em outro cinema.');
                if(!await hasResponsible(c,team))throw conflict('A equipe está sem supervisor ativo vinculado a este cinema.');
                await noActiveMember(c, id, userId);
                const old=await model.pendingEntry(id,userId,c);
                if(old){
                    if(instant(old.criado_em)+entryMaxAgeMs>Date.now())throw conflict('Já existe convite ou solicitação pendente para este colaborador.');
                    await invalidate(c,id,idString(old.id_entrada),context);
                }
                const entryId = await model.createEntry(c, { teamId: id, userId, actorId: u.id, type, functionName: request ? null : input.funcao });
                if (!request) await notifyInvitation(c,userId,team,entryId);
                else await notifications.emit(c, { recipientId: idString(team.id_supervisor), title: 'Solicitação de ingresso', message: `A equipe ${team.nome} recebeu uma solicitação de ingresso.`, type: 'TEAM_JOIN_REQUEST', dedupeKey: `team-join-request:${entryId}`,target:{kind:'team',id,detailId:entryId} });
                await identity.audit(c, 'TEAM.ENTRY_PROPOSED', entryId, context);
                return entryDto(found(await model.entry(id, entryId, c)));
            }, context);
        },
        async editEntry(id,entryId,input,context){
            const result=await transaction(async(c,u)=>{
                if(u.tipo!=='ADMIN')throw ApiError.acessoNegado();
                const team=await lockedTeam(c,id),entry=found(await model.entry(id,entryId,c,true));
                if(entry.status!=='PENDENTE')throw conflict('Somente entradas pendentes podem ser editadas.');
                const issue=await entryIssue(c,team,entry);
                if(issue){await invalidate(c,id,entryId,context);return {issue};}
                await model.updateEntryFunction(c,id,entryId,input.funcao);
                await identity.audit(c,'TEAM.ENTRY_FUNCTION_CHANGED',entryId,context);
                return {entry:entryDto(found(await model.entry(id,entryId,c)))};
            },context);
            if(result.issue)throw conflict(result.issue);
            return result.entry;
        },
        async decide(id, entryId, input, context) {
            const result=await transaction(async (c, u) => {
                const team = await lockedTeam(c, id);
                const entry = found(await model.entry(id, entryId, c, true));
                const request = entry.tipo === 'SOLICITACAO';
                if (request) {
                    if (!await manager(u, team, c)) throw ApiError.acessoNegado();
                } else if (u.id !== idString(entry.id_usuario) || u.tipo !== 'COLABORADOR') throw ApiError.acessoNegado();
                if(entry.status!=='PENDENTE')throw conflict('A entrada foi encerrada ou perdeu a validade.');
                const issue=await entryIssue(c,team,entry);
                if(issue){await invalidate(c,id,entryId,context);return {issue};}
                const functionName=input.funcao??entry.funcao_proposta;
                if (request && input.decision === 'ACEITAR' && !functionName || input.funcao && !(request && input.decision === 'ACEITAR')) throw ApiError.validacao('Função inválida para esta decisão');
                if (input.decision === 'ACEITAR') {
                    const previous = await model.memberByUser(id,entry.id_usuario,c);
                    await model.activateMember(c,id,entry.id_usuario,functionName,previous);
                }
                await model.decideEntry(c, id, entryId, input.decision === 'ACEITAR' ? 'ACEITA' : 'RECUSADA');
                if (request) {
                    const accepted = input.decision === 'ACEITAR';
                    await notifications.emit(c, { recipientId: idString(entry.id_usuario),
                        title: accepted ? 'Solicitação de ingresso aprovada' : 'Solicitação de ingresso recusada',
                        message: `Sua solicitação para a equipe ${team.nome} foi ${accepted ? 'aprovada' : 'recusada'}.`,
                        type: 'TEAM_JOIN_DECISION', dedupeKey: `team-join-decision:${entryId}`,target:{kind:'team',id,detailId:entryId} });
                }
                await identity.audit(c, 'TEAM.ENTRY_DECIDED', entryId, context);
                return {entry:entryDto(found(await model.entry(id, entryId, c)))};
            }, context);
            if(result.issue)throw conflict(result.issue);
            return result.entry;
        },
        async cancelEntry(id, entryId, context) {
            return transaction(async (c, u) => {
                const team = await lockedTeam(c, id), entry = found(await model.entry(id, entryId, c, true));
                if (!await manager(u, team, c) && !(u.tipo==='COLABORADOR'&&u.id===idString(entry.id_emissor))) throw ApiError.acessoNegado();
                if (entry.status !== 'PENDENTE') throw conflict('Entrada já decidida');
                await model.decideEntry(c, id, entryId, 'CANCELADA');
                await identity.audit(c, 'TEAM.ENTRY_CANCELLED', entryId, context);
            }, context);
        }
    };
}
