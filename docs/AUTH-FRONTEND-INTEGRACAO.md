# Autenticação no frontend

## Login e destinos

`/auth/login` envia e-mail/senha ao backend. O contrato aceita e-mail, não nome de usuário. Destino confirmado pelo retorno autenticado de `GET /api/users/me`, sem confiar em role fornecida pelo navegador:

| Perfil | Destino após login |
| --- | --- |
| ADMIN | `/admin/dashboard` |
| CLIENTE, FORNECEDOR, COLABORADOR | `/cinema/home` |
| SUPERVISOR | Permanece no login, com mensagem de área ainda indisponível |

Layout administrativo verifica sessão e role no servidor. Sem sessão retorna ao login; outros perfis vão para home, exceto supervisor, que permanece no login. As APIs continuam responsáveis pela autorização de cada operação.

## Sessão

O Next intermedeia a autenticação em `/api/session/{login,me,logout,forgot,reset}`. Cookie `cineastra_session`: HttpOnly, SameSite=Lax, Secure quando o acesso público usa HTTPS (incluindo protocolo encaminhado pelo proxy), path `/`, duração igual ao backend (máximo 900 segundos). O token não é retornado ao JavaScript, nem colocado em localStorage/sessionStorage. Não há refresh token neste contrato; sessão expirada exige novo login.

POSTs exigem Origin igual à origem da aplicação. As chamadas upstream são fixas, sem proxy arbitrário, com timeout de 15 segundos e sem redirecionamentos. Respostas não são cacheadas. Dados retornados ao navegador: id, nome e role, sem token. O backend continua revalidando sessão ativa.

Botões de entrar/criar conta nos cabeçalhos de cinema e streaming, desktop/mobile exibem nome e Sair quando autenticado. Área de admin também oferece Sair. Logout tenta revogar no backend e remove o cookie local; se backend falhar, a sessão remota pode permanecer válida até expirar. Nenhum dado de autenticação é inventado offline.

## Recuperação e redefinição

Esqueci minha senha chama `POST /api/auth/password/forgot`. Falha do serviço não anuncia envio de e-mail. Backend precisa de provider de e-mail real, ainda indisponível na configuração padrão.

`/auth/redefinir-senha?token=...` usa `POST /api/auth/password/reset`. Senha: mínimo 12 caracteres, maiúscula, minúscula, número e símbolo, máximo 72 bytes; confirmação igual. Sucesso exige novo login. Link inválido/expirado e indisponibilidade são tratados. A página define noindex e referrer no-referrer. O template do provider de e-mail deverá apontar para esse caminho.

CAPTCHA/2FA não foram alterados. Se o backend passar a exigir desafio de 2FA, a tela informa a necessidade e não cria cookie nem contorna o desafio. A interface dessa etapa adicional permanece pendente.

## Cadastro integrado

Cadastro autodeclarado implementado em `/auth/cadastro`, com `ALLOW_SELF_DECLARED_AGE=true` por padrão. Sem prova, a idade permanece não verificada, sem registro de verificação ou vínculo de responsável. Para teste, o cadastro usa os PDFs locais 2.0 com aceite obrigatório e origem registrada, habilitados por `ALLOW_LOCAL_REGISTRATION_DOCUMENTS=true`. Ver [contrato do cadastro](CADASTRO-AUTODECLARADO.md).

## Configuração

Definir `BACKEND_API_URL` no **servidor do frontend**, incluindo `/api`, com URL absoluta acessível pelo Next. Na ausência usa `NEXT_PUBLIC_API_URL` se absoluta. Exemplo de desenvolvimento: `http://localhost:8080/api`. Em implantação, usar endereço real/interno apropriado; localhost aponta para o próprio contêiner. O cookie acompanha o protocolo público: o ambiente HTTP atual permite a sessão, e HTTPS habilita Secure. Em HTTP, o transporte não é criptografado.

Essas chamadas de auth passam pelo servidor Next e não dependem de CORS do navegador; a home pública continua usando NEXT_PUBLIC_API_URL. O proxy precisa preservar a origem/host público para a validação de Origin. Rate limits existentes do backend continuam aplicados; chamadas via Next compartilham o IP da origem do servidor quando não há cadeia de proxies confiáveis configurada. Nenhum Docker/YAML foi modificado.

## Organização e validação

- UI: `components/auth`; estado/requisições: `hooks/auth`.
- Servidor: `lib/auth/server.js` e `app/api/session/[action]/route.js`.
- Mapeamento/política de senha: `lib/auth/destination.mjs`.
- Rotas de auth mantêm páginas pequenas; layout de admin verifica acesso.
- Build Next passou; testes de destinos/senha e navegador com backend HTTP controlado passaram para todos os perfis, HttpOnly, logout, acesso direto ao admin, erros 401/429/desafio 2FA, recuperação indisponível, redefinição, CSRF e viewport mobile. ESLint dos módulos de auth sem erros; header já tinha alerta de setState síncrono em effect e imagens sem next/image.

Teste não foi realizado no Coolify/banco remoto. Não houve commit/push nem mudanças nas políticas do backend.

### Origem das requisições no Coolify

As rotas `/api/session/*` validam `Origin` contra `Host` e o protocolo informado pelo proxy (`X-Forwarded-Proto`), evitando comparar o domínio público com a URL interna do Next. O proxy deve preservar `Host` e definir o protocolo encaminhado corretamente. `X-Forwarded-Host` não é usado para autorizar origens.

Se o proxy reescrever `Host`, configure **no frontend** `AUTH_PUBLIC_ORIGIN` com a origem pública exata (ex.: `https://cinema.exemplo.com`, sem barra final ou caminho) e reinicie/reimplante. Quando definida, somente essa origem é aceita. Essa variável é diferente do endereço do backend e de sua configuração de CORS.

### Painel da conta no header

Headers de cinema e streaming compartilham a sessão com `SessionControls`. Usuário autenticado abre `account-sheet.jsx` pelo avatar circular com iniciais; estado e destino do perfil ficam em `use-account-menu.js`. O painel reúne Minhas compras, Notificações, Perfil, Administração quando ADMIN e Sair da conta. O perfil segue a área atual (cinema ou streaming). Navegar fecha o painel; Escape e botão Fechar devolvem o foco ao gatilho. O menu mobile não duplica o painel autenticado.

Notificações e carrinho do header só são renderizados com usuário autenticado, inclusive durante carregamento inicial. Isso controla a apresentação; a autorização continua no backend. Os destinos de perfil/compras/notificações ainda têm suas integrações pendentes conforme o guia. Layout usa os tokens do site e preserva o tema, com painel adaptável e saída ao rodapé.
