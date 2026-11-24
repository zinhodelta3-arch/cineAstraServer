import {ApiError} from '../utils/ApiError.js';
import {unavailableAssistantProvider} from '../providers/assistantProvider.js';
import {actionRequest,normalizeQuestion,restrictedQuestion,roleGuidance,sensitiveText} from './assistantKnowledge.js';
import {streamingHelp} from './streamingHelp.js';

export function createAssistantService({identity,support,provider=unavailableAssistantProvider}){
    const authenticatedRole=context=>identity.transaction(async c=>(await identity.activeActor(c,context)).tipo_usuario,context);
    return {
        async message(input,context){
            const role=await authenticatedRole(context);
            if(!['CLIENTE','COLABORADOR','SUPERVISOR','FORNECEDOR','ADMIN'].includes(role))throw ApiError.acessoNegado();
            const handoffPath=role==='CLIENTE'?'/api/assistant/handoff':null;
            const local=message=>({identity:'IA',available:true,message,handoffPath});
            const question=normalizeQuestion(input.message);
            if(sensitiveText.test(input.message)||sensitiveText.test(question))return local('Retire dados pessoais ou credenciais e envie somente a dúvida sobre o CineAstra.');
            if(restrictedQuestion.test(question))return local('Informações internas e dados privados são restritos. Posso orientar sobre as funções disponíveis para a sua conta.');
            if(actionRequest.test(question))return {...local('Posso explicar como fazer isso na sua área do CineAstra. Para executar a operação, use as opções do seu painel.'),available:false};
            if(role!=='CLIENTE')return local(roleGuidance(role,question));
            const streamingTopic=input.area==='streaming'&&streamingHelp.find(item=>item.pattern.test(question));
            if(streamingTopic)return local(streamingTopic.answer);
            const fallback=()=>{
                const guidance=roleGuidance(role,question,{matchedOnly:true});
                return guidance ? local(guidance) : {...local(roleGuidance(role,question)),available:false};
            };
            if(provider.available!==true)return fallback();
            // O provedor recebe a dúvida, sem acesso à identidade ou à sessão do cliente.
            try{const answer=await provider.answer({message:input.message,signal:context.signal});
                const message=typeof answer==='string'?answer:answer?.message;
                if(typeof message!=='string'||!message.trim()||message.length>4000)throw new Error('Resposta inválida');
                if(answer?.available===false)return fallback();
                const sessions=Array.isArray(answer?.sessions)?answer.sessions.filter(item=>typeof item?.id==='string'&&/^[1-9]\d{0,19}$/.test(item.id)&&typeof item.label==='string').slice(0,6):[];
                return {identity:'IA',available:answer?.available!==false,message,handoffPath,...(sessions.length?{sessions}:{})};
            }catch{return fallback();}
        },
        handoff:(input,context)=>{
            if(sensitiveText.test(input.message)||sensitiveText.test(normalizeQuestion(input.message)))throw ApiError.validacao('Retire dados pessoais ou credenciais antes de encaminhar a dúvida.');
            return support.create({subject:'Encaminhamento da IA',message:input.message},context);
        }
    };
}
