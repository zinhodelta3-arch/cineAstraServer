# Fotos privadas de perfis de streaming

Backend implementado. Migration 36 e integração frontend ainda pendentes.

| Rota | Resultado |
| --- | --- |
| PUT `/api/streaming/profiles/{id}/photo` | Cria/substitui foto, retorna 200 com photoUrl, width, height e bytes |
| GET `/api/streaming/profiles/{id}/photo` | Bytes image/webp; 404 se ausente |
| DELETE `/api/streaming/profiles/{id}/photo` | Remove foto, 204 mesmo se já ausente |

Todas exigem Bearer de CLIENTE ativo e propriedade da conta. Outra conta recebe 404, mesmo conhecendo o ID; ADMIN não ganha acesso. Escritas usam rate limit de upload e auditoria. GET usa Cache-Control private, no-store, nosniff e CSP restritiva.

Enviar multipart/form-data com **um único arquivo no campo image**, sem campos extras. Não enviar base64, URLs, ownerId ou foto no PATCH de perfil. Formatos JPEG, PNG e WebP estáticos até 5 MiB. A validação verifica assinatura, decodificação, máximo de 16 milhões de pixels/8192 pixels por lado e ausência de animação. Reencoda para WebP sem metadados, preservando proporção, até 512 pixels por lado e 256 KiB; imagem menor não é ampliada. Uploads concorrentes limitados a dois por processo neste módulo; proprietário revalidado depois do processamento.

Erros: 400 multipart/campos inválidos; 401 sem sessão; 403 role inválida; 404 perfil alheio/inexistente ou foto ausente; 408 interrompido; 413 tamanho excessivo; 415 formato inválido; 422 ID/arquivo ausente; 429 limite de requisições; 503 processamento ocupado ou dependência indisponível.

O DTO de perfil passa a retornar `photoUrl` (caminho autenticado ou null). `avatar` continua sendo a opção padrão; atualizar avatar não apaga a foto. DELETE photo restaura visualmente o avatar sem apagar nome, seleção, favoritos ou progresso. Exclusão do perfil elimina os bytes por FK ON DELETE CASCADE. Uma foto por perfil; substituição não deixa versões anteriores.

## Frontend

Para enviar, usar FormData e deixar o navegador definir Content-Type com boundary. Para exibir, buscar photoUrl com Authorization e converter resposta em Blob/object URL; um img com caminho direto não envia Bearer. Revogar object URL ao trocar/desmontar e limpar dados de imagem no logout/troca de conta. Após alteração, refazer listagem/perfil e foto, sem cache persistente. Se conexão cair depois do commit, a escrita pode ter ocorrido: consultar novamente antes de mostrar erro definitivo.

## Persistência e implantação

A tabela `streaming_perfil_fotos` guarda o WebP pequeno no MySQL, evitando dependência de disco efêmero do contêiner. Até cinco fotos por conta (limite existente de perfis), aproximadamente 1,25 MiB de bytes por conta. Isso aumenta tamanho de backups e tráfego do banco; não há staging público nem arquivos órfãos. Nenhuma configuração Docker/YAML foi alterada.

Aplicar `database/migrations/20261026_36_streaming_profile_photos.sql` pelo runner existente antes de implantar: a listagem de perfis passa a consultar a presença da foto. Snapshot `cineastra-install.sql` atualizado até a migration 36; usar somente em schema vazio. Banco real não foi alterado; teste da migration no MySQL alvo continua pendente.

Model/service/controller/router: `backend/src/{models,services,controllers,routes}/streamingPhoto*.js`; validação de IDs e imagens reutiliza streamingProfileValidators, uploadMiddleware e imageProcessor. Contrato OpenAPI gerado por `generateStreamingPhotoOpenapi.js`, com DTO em `generateStreamingProfileOpenapi.js`.

Testes usam imagens reais via sharp e persistência simulada: normalização, limites, isolamento, erros de arquivo, rollback de auditoria, revalidação após processamento e admissão concorrente. Os testes existentes de imagem cobrem também decodificação e remoção de metadados.
