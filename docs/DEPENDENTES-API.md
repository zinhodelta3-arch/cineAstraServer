# Dependentes e controle parental

Lacuna de descoberta resolvida com `GET /api/users/me/children`. Controles e autorizações já existiam e continuam com suas verificações atuais. Não houve migration nova nem implantação/frontend neste item.

## Listagem

Exige Bearer token e usuário com sessão ativa. O responsável é obtido da autenticação; não aceita userId/guardianId na query. Não há bypass para ADMIN: a lista é sempre dos próprios vínculos.

```text
GET /api/users/me/children?limit=20
```

Envelope `{success, data, requestId}`. Exemplo de data:

```json
{
  "items":[{"id":"9","name":"Dependente","status":"ATIVO","parentalControlsAvailable":true}],
  "pagination":{"limit":20,"nextCursor":null}
}
```

- `limit`: padrão 20, máximo 100. `cursor`: ID do último dependente, string INT UNSIGNED. Ordem decrescente, cursor exclusivo; null indica fim.
- Apenas vínculos `responsaveis_usuario.status = ATIVO`. Revogados e vínculos de outros responsáveis não aparecem.
- Inclui dependentes com conta inativa/bloqueada ou prova expirada, para a tela conseguir indicar a situação sem inventar novo vínculo.
- `parentalControlsAvailable` é true somente para conta ATIVO com última prova vigente de idade ATE_16. É informativo: os endpoints de controle/autorização revalidam o acesso no momento da ação.
- Não retorna CPF, e-mail, data de nascimento, referência do provedor, senha ou provas.
- Lista vazia retorna 200. Sessão ausente/inválida: 401. Parâmetro inválido/desconhecido/repetido: 422. Resposta sem cache.

## Como o vínculo é criado hoje

O cadastro `/api/auth/register` já usa o provedor de idade e, quando necessário, `guardianProof`. O provedor de responsável precisa confirmar o vínculo e devolver o responsável verificado; o backend verifica conta ativa e comprovação vigente de idade do responsável antes de persistir o vínculo e os controles iniciais.

O provedor padrão é indisponível. A listagem não transforma dados de teste ou um ID informado em prova de responsabilidade. Sem integração real de identidade, não presumir que cadastro de dependentes está pronto em produção.

A renovação `/api/users/me/age-verification` aceita o vínculo já comprovado. Troca de responsável exige revisão (`GUARDIAN_REVIEW_REQUIRED`). Não foi criado endpoint para vincular, transferir ou revogar responsáveis arbitrariamente; esse processo continua dependendo de prova/revisão específica. Perfil de streaming, inclusive kids, não é dependente legal.

## Controles e autorização já existentes

Usar o `id` do dependente retornado pela listagem:

- `GET /api/users/me/children/{id}/controls`
- `PATCH /api/users/me/children/{id}/controls`
- `POST /api/users/me/children/{id}/authorizations`
- `GET /api/users/me/children/{id}/authorizations/{authorizationId}`

Controles: `compras_permitidas`, `assinaturas_permitidas`, `limite_minutos_diarios` (1–1440). Autorização: finalidade COMPRA/ASSINATURA, referência da operação e prazo futuro de no máximo 24h, sujeita aos controles existentes. Não foi implementado neste item um bloqueio de player por tempo de tela: persistir esse limite não comprova aplicação no streaming.

## Arquivos e validação

- [Model](../backend/src/models/identityModel.js), método children
- [Service](../backend/src/services/profileService.js), método children
- [Controller](../backend/src/controllers/identityController.js)
- [Router](../backend/src/routes/identityRoutes.js)
- [Validator](../backend/src/validators/childrenValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateIdentityOpenapi.js)
- [Testes](../backend/tests/children.test.js)

Reutiliza responsaveis_usuario, usuarios e verificacoes_idade. Testes com persistência simulada cobrem propriedade, vínculos revogados, estado/idade, paginação, sessão e validação; o teste de model confere filtros SQL. Falta verificar a consulta no MySQL real antes da implantação.
