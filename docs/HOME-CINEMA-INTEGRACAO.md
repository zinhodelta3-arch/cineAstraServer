# Home do cinema — integração de leitura

`/cinema/home` agora consulta o backend. `page.jsx` continua apenas importando CinemaHome; componentes em `components/cinema/home`, lógica em `hooks/cinema/home` e cliente HTTP público em `lib/api/public-api.mjs`.

## Dados usados

- `GET /api/films?cinema=true&limit=20`: catálogo e hero (primeiros quatro filmes carregados), com paginação. Data de lançamento futura forma “Em breve”; os demais ficam em “No catálogo”. Isso não presume que existam sessões ou pré-venda. Imagem vem de imagem; sem imagem, usa placeholder. Sem notas, preços ou horários inventados.
- `GET /api/banners?placement=cinema-home&limit=6`: destaques publicados.
- `GET /api/experiences?limit=6`: experiências publicadas.
- `GET /api/locations`: seleção de cinema no modal e na bomboniere.
- `GET /api/locations/{id}/rooms`: nomes das salas.
- `GET /api/sessions?localId=...&date=...`: consulta de sessões pelo cinema e dia em UTC, com filtragem do filme selecionado e horários futuros. O backend não possui filtro filmId nesta rota; carregar próximas páginas continua a busca, sem anunciar ausência definitiva quando ainda houver cursor.
- `GET /api/combos?localId=...`: composição e preço cadastrado dos combos da unidade.

Todas as listas têm carregamento, erro com tentativa novamente, vazio e paginação. Trocar parâmetros/desmontar cancela requisições antigas; timeout de 15 segundos. Nenhuma resposta simulada substitui falha de API. Links editoriais aceitam caminhos internos ou HTTPS; trailer abre a URL cadastrada em nova aba, sem supor que seja URL de embed.

## Limite desta etapa

Consulta pública, sem autenticação, reserva, cotação ou cobrança. A compra rápida, o carrinho local e os combos fictícios deixaram de ser usados na home. O modal apresenta sessões reais, mas ainda não inicia a compra; integrar assentos/carrinho/checkout nas próximas páginas. Não envia o usuário a uma tela de assentos ainda demonstrativa como se ela representasse a sessão real. Componentes antigos permanecem nos arquivos, sem uso pela home.

Galeria de fotos demonstrativas e tecnologias estáticas da antiga home deixaram de ser exibidas; as experiências e destaques agora vêm do conteúdo publicado. Mantidos cores, fontes, hero, cartões e carrossel existentes. Não foram alteradas outras páginas.

## Configuração e implantação

`NEXT_PUBLIC_API_URL` é a base com `/api`, por exemplo `https://dominio-do-backend/api`. Sem configuração, usa `/api` na mesma origem. Variável pública incorporada no build: reconstruir frontend após alterá-la. Nunca usar localhost como endereço de produção; configurar no Coolify sem alterar Docker/YAML. A origem do frontend deve estar permitida no CORS do backend; frontend HTTPS precisa backend HTTPS para evitar conteúdo misto.

Aplicar migrations pendentes do backend (incluindo conteúdo promocional) e publicar/cadastrar dados reais. Backend indisponível exibe erro; banco vazio exibe vazio. Integração contra banco remoto não foi executada nesta entrega.

Validação: ESLint nos arquivos alterados, build Next, testes do cliente/adaptador em `frontend/tests/home-api.test.mjs`; teste de navegador com respostas HTTP controladas verifica dados, paginação, modal/sessões, combos, estados de erro/vazio e mobile. Não equivale a testar Coolify/MySQL real.
