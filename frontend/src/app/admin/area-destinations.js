export const areaDestinations = [
  {
    id: 'supervisao',
    label: 'Supervisão',
    links: [
      { label: 'Sessões', href: '/admin/sessoes' },
      { label: 'Salas', href: '/admin/locais/salas' },
      { label: 'Equipes', href: '/admin/equipes' },
    ],
  },
  {
    id: 'colaborador',
    label: 'Colaborador',
    links: [
      { label: 'Presença nas sessões', href: '/admin/sessoes/presenca' },
      { label: 'Chamados da equipe', href: '/admin/equipes/chamados' },
    ],
  },
  {
    id: 'fornecedor',
    label: 'Fornecedor',
    links: [
      { label: 'Suprimentos', href: '/admin/suprimentos' },
      { label: 'Solicitações', href: '/admin/suprimentos/solicitacoes' },
      { label: 'Logística', href: '/admin/suprimentos/logistica' },
    ],
  },
];
