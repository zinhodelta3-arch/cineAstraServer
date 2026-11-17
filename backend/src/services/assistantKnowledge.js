export const normalizeQuestion = value => value.normalize('NFD').replace(/\p{M}/gu,'')
    .toLocaleLowerCase('pt-BR').trim().replace(/[?!.]+$/, '').trimEnd();

export const restrictedQuestion = /\b(?:banco de dados|sql|schema|tabelas? (?:de|do|dos|da|das)\b|credenciais|chaves? (?:de )?api|prompt|instrucoes internas|ignore (?:as|suas|todas)|dados pessoais|dados privados|segredos|tokens? de acesso)\b/;
export const sensitiveText = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\d[ .-]?){11,19}\b|\b(?:sk-[\w-]{8,}|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b|\b(?:minha senha e|senha\s*[:=]|meu cpf e)\b/i;

const unitTickets = [/\bchamados?\b/, 'Em Unidade → Chamados, abra um chamado e acompanhe as respostas. A página mostra os chamados disponíveis para a sua conta.'];
const unitTeams = [/\b(?:equipes?|convites?|tarefas?)\b/, 'Em Unidade → Equipes, consulte os vínculos que aparecem para sua conta. Convites pendentes ficam disponíveis para aceitar nessa área.'];

const roleGuides = {
    CLIENTE: [
        [/\bexperiencias?\b/,'Abra Experiências no Cinema para solicitar um orçamento. Em Acompanhar minhas solicitações você encontra protocolos, status e mensagens da equipe.'],
        [/\b(?:compras?|pedidos?|ingressos?)\b/,'Abra Minhas compras para acompanhar pedidos e consultar ingressos após a confirmação do pagamento. Para comprar, abra Filmes e escolha uma sessão.'],
        [/\b(?:suporte|chamados?)\b/,'Abra Suporte para iniciar um atendimento e acompanhar as respostas da equipe.'],
        [/\b(?:streaming|assinaturas?|planos?)\b/,'Abra Planos para consultar os benefícios publicados ou vá ao Streaming para ver o catálogo.']
    ],
    COLABORADOR: [unitTickets,unitTeams,[/\b(?:reposicao|recebimento|devolucao|estoque)\b/,'Use as opções de estoque e logística disponíveis para a sua equipe na área Unidade.']],
    SUPERVISOR: [unitTickets,unitTeams,[/\bexperiencias?\b/,'Em Unidade → Experiências, acompanhe as solicitações da sua unidade, atualize status e converse com o cliente.'],[/\b(?:estoque|combos?|insumos?)\b/,'Em Unidade → AstraSnack, consulte os insumos, os combos e o estoque da unidade vinculada à sua conta.']],
    FORNECEDOR: [
        [/\b(?:estoque|insumos?|equipamentos?)\b/,'No Portal do Fornecedor, abra Estoque para consultar seus insumos e equipamentos.'],
        [/\b(?:solicitacoes?|entregas?|transportes?)\b/,'No Portal do Fornecedor, abra Entregas. Use Solicitações para consultar os pedidos disponíveis e Transportes para administrar seus veículos.']
    ],
    ADMIN: [
        [/\bexperiencias?\b/,'Em Admin → Marketing → Solicitações de experiências, faça a triagem e encaminhe os pedidos para uma unidade.'],
        [/\b(?:usuarios?|contas?)\b/,'Em Admin, consulte o cadastro de usuários pelo menu administrativo. Os registros e ações disponíveis são exibidos no próprio painel.'],
        [/\b(?:pedidos?|pagamentos?|reembolsos?)\b/,'Em Admin → Vendas, selecione Pedidos, Pagamentos ou Reembolsos para acompanhar a operação.'],
        [/\b(?:suporte|chamados?)\b/,'Em Admin → Suporte, consulte a fila de chamados e abra o atendimento desejado.']
    ]
};

export function roleGuidance(role, question) {
    const entries=Object.hasOwn(roleGuides,role)?roleGuides[role]:[];
    return entries.find(([pattern])=>pattern.test(question))?.[1]
        ?? (role === 'CLIENTE' ? 'Posso orientar sobre o CineAstra. Para esta dúvida, converse com a equipe pelo Suporte.' :
            'Consulte o menu do seu painel ou o responsável pelo atendimento da sua área. A assistente pode orientar sobre os procedimentos disponíveis ao seu perfil.');
}
