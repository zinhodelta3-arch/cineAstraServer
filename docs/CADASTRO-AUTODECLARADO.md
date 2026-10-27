# Cadastro com idade autodeclarada

`ALLOW_SELF_DECLARED_AGE=true` é o padrão temporário autorizado. O backend aceita cadastro sem `ageProof`, cria somente CLIENTE ativo e grava data de nascimento e consentimentos. **Não grava em verificacoes_idade nem cria vínculo de responsável.** Ausência de prova vigente representa idade não verificada, inclusive após novo login. Não requer migration ou atualização do consolidado.

`POST /api/auth/register` e `GET /api/users/me` retornam `ageVerified`. No cadastro sem prova o valor é false; em me é calculado pela prova vigente no banco. O frontend exibe o aviso antes do envio, após a criação e na sessão CLIENTE. Data informada pelo usuário não comprova identidade, maioridade nem vínculo parental.

Se ageProof for enviado, o fluxo anterior de provider/verificação continua obrigatório; prova inválida não vira cadastro autodeclarado. `ALLOW_SELF_DECLARED_AGE=false` volta a exigir comprovação para novas contas. A rota de reverificação continua exigindo ageProof. Nenhuma prova é criada retroativamente para contas autodeclaradas.

As regras existentes de compra, assinatura e streaming continuam consultando comprovação vigente: criar conta e fazer login não libera automaticamente essas operações. Menor autodeclarado não recebe prova de responsável. CAPTCHA/2FA permanecem nas flags existentes.

## Formulário e configuração

`/auth/cadastro` solicita nome, e-mail, CPF, nascimento, senha/confirmar e aceite dos documentos reais. Para testes, o CPF exige apenas 11 números, sem cálculo dos dígitos verificadores ou consulta externa de titularidade. A máscara visual é mantida; números já cadastrados continuam sujeitos à restrição de unicidade. A regra de formato também se aplica ao cadastro administrativo, que compartilha o validador. A senha segue as regras do backend: 12 caracteres, maiúscula/minúscula/número/símbolo e até 72 bytes.

O cadastro de teste usa os PDFs versão 2.0 em `frontend/public/docs`, com links para leitura e checkbox obrigatório. São minutas em revisão. O frontend envia `documentsSource: LOCAL_TEST_PDF`; com `ALLOW_LOCAL_REGISTRATION_DOCUMENTS=true` (padrão temporário), o backend aceita essas versões sem publicação na API e registra a origem `ACEITE_PDF_LOCAL_TESTE` nos consentimentos. Esse modo exige cadastro autodeclarado e não verifica a idade. Para desativá-lo, configure a flag como `false`; o fluxo convencional exige versões e base legal configuradas. Ao encerrar os testes, atualize o formulário para os documentos publicados. Telefone pode ser cadastrado posteriormente no perfil.

O formulário usa hooks e componentes. POST passa por `/api/session/register` no Next, com proteção de origem e URL do backend configurada como nas demais rotas de autenticação. Não faz login automático; após sucesso oferece link para entrar. Não envia role, status, ageVerified ou comprovante fictício. Senhas são limpas após sucesso. Cadastro duplicado e falhas de validação/conexão não exibem sucesso.

## Validação

Testes HTTP verificam cadastro/login sem provider de idade, ageVerified=false persistente, consentimentos, duplicação, ausência de vínculo falso para menor, modo estrito e impossibilidade de forjar role/prova. 310 testes do backend e OpenAPI validados; frontend compilado. Teste de navegador concluiu cadastro seguido de login contra a aplicação backend real com repositório de teste isolado (sem MySQL), incluindo falha/retry dos documentos, aviso de idade não verificada na sessão e viewport mobile. Nenhuma alteração foi aplicada no Coolify/banco remoto.
