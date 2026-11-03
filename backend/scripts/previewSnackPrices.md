# Prévia informativa de preços do AstraSnack

O script `previewSnackPrices.js` está preparado para execução posterior, quando a API estiver disponível. Não inicia a aplicação, não conecta diretamente ao banco e não publica preços.

Execute `node backend/scripts/previewSnackPrices.js https://servidor/api`, fornecendo um token de administrador pela entrada padrão (stdin), via seu mecanismo seguro de credenciais. Não inclua o token na URL, nos argumentos ou no relatório. Não é necessário editar arquivos de ambiente.

O script percorre todas as páginas de insumos disponíveis e combos ativos. Consulta `POST /admin/pricing/quote`, operação de cálculo sem publicação. O JSON contém diferenças informativas entre o preço cadastrado e a sugestão por custos/markup (`SUGESTAO`), além dos itens cuja cotação foi bloqueada (`BLOQUEADO`). Falhas de autenticação, permissão, limite de requisições ou resposta inválida interrompem a prévia, sem produzir um relatório final incompleto. A API deve conter a nova regra de preços cadastrados.

`currentPrice` é o preço cadastrado utilizado como base da venda. `suggestedPrice` é apenas a sugestão por custos e markup; diferenças entre esses valores não impedem a compra nem exigem republicação. Promoções, benefícios, cupons, teto de desconto e piso de custo continuam aplicáveis. A prévia também confere se a composição do combo contém insumos disponíveis do mesmo local e quantidades válidas. Custos ausentes, preço inválido, zero ou abaixo do custo são bloqueados pelo serviço de cotação. Estoque e autorização do fornecedor continuam sendo validados pelo checkout, não por esta prévia.

Para INPUT e COMBO, `POST /admin/pricing/publish/{category}/{id}` valida e mantém o preço cadastrado, retornando também a sugestão. Não sobrescreve o valor com o resultado do markup. Alterações de preço de venda usam os cadastros existentes de produtos e combos, respeitando suas permissões e vínculos. O script não chama publicação nem edição. Pedidos, snapshots e pagamentos históricos não são atualizados.

O script foi apenas escrito e revisado estaticamente; não foi executado. Nenhuma mudança de schema, migration ou regularização em lote dos preços é necessária para a nova regra. A aplicação em execução deve receber o código atualizado. A política de idade continua independente da precificação.
