# Troca de senha autenticada

Correção do levantamento: o backend já implementa troca de senha em `PATCH /api/users/me`. Não era necessário criar outra rota. Este item acrescentou testes específicos e documentou o contrato; não mudou o comportamento de produção, flags de CAPTCHA/2FA ou banco.

## Requisição

Bearer token válido e senha atual da própria conta:

```http
PATCH /api/users/me
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "currentPassword":"<senha atual>",
  "password":"<nova senha>",
  "passwordConfirmation":"<nova senha repetida>"
}
```

Os valores acima são placeholders. Não enviar credenciais no chat ou em URLs.

- Senha nova: pelo menos 12 caracteres, até 72 bytes UTF-8; maiúscula, minúscula, número e símbolo; confirmação idêntica. O schema também limita a 72 caracteres, sem truncamento bcrypt.
- `code` é aceito quando o fator estiver habilitado e aplicável. Com TWO_FACTOR_ENABLED=false, a troca funciona sem código. Não há CAPTCHA obrigatório neste endpoint.
- O usuário vem da sessão. `userId`, `role`, CPF e campos fora do schema são rejeitados.
- O corpo do PATCH também admite atualização de perfil/e-mail, mas para o formulário de senha enviar somente os campos acima (e code quando aplicável).

## Resultado e integração

Sucesso: 200, envelope `{success, data, requestId}`, com DTO público do usuário. Não retorna nova sessão, senha ou hash.

Na mesma transação, o servidor atualiza o hash, revoga **todas** as sessões da conta (inclusive a atual), invalida desafios e tokens de recuperação anteriores e registra auditoria. Após sucesso, o frontend deve limpar sua sessão e redirecionar para login. A senha nova passa a autenticar; a anterior deixa de autenticar. Outras contas não são afetadas.

O formulário atual de perfil ainda é demonstrativo: deve chamar esta API e exibir erros reais, em vez de mostrar confirmação local.

## Falhas

- 401: sessão ausente/expirada/revogada ou senha atual ausente/incorreta (e fator inválido quando aplicável).
- 422: política de senha, confirmação divergente, tipo/campos inválidos.
- 429: limite de tentativas da rota/fluxo; respeitar o retry informado pelo servidor.
- Falha de persistência: a transação reverte a mudança e revogações; não apresentar sucesso ao usuário.

Se a resposta se perder após commit, a sessão já poderá estar revogada. O frontend deve pedir novo login, não presumir que a senha antiga permanece válida.

Recuperação sem sessão é outro fluxo: `POST /api/auth/password/forgot` e `/api/auth/password/reset`, com token e dependência de envio de e-mail. Não é necessária uma integração externa de e-mail para trocar apenas a senha da sessão autenticada.

## Arquivos e testes

- [Router](../backend/src/routes/identityRoutes.js)
- [Controller](../backend/src/controllers/identityController.js)
- [Profile service](../backend/src/services/profileService.js), método patch
- [Identity service](../backend/src/services/identityService.js), reautenticação e validade da sessão
- [Model](../backend/src/models/identityModel.js), updateUser/revoke/invalidateChallenges/invalidateRecovery
- [Validators](../backend/src/validators/identityValidators.js), schemas.profile
- [Política e hashing](../backend/src/utils/identityCrypto.js)
- [Novos testes](../backend/tests/passwordChange.test.js)

Testes HTTP usam bcrypt/JWT reais e persistência simulada. Cobrem sucesso em standby, múltiplas sessões, invalidação de recuperação/desafios, isolamento de outras contas, senha antiga/nova, falhas de validação, logs sem senhas e rollback. Não substituem validação transacional contra MySQL real antes de implantação.
