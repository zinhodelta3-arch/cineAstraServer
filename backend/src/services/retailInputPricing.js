import { ApiError } from '../utils/ApiError.js';
import { cents } from './pricingMath.js';

export function validateRetailInput({ status, venda_avulsa, preco, custo_receita, custo_parceria }) {
    if (status !== 'DISPONIVEL' || !venda_avulsa) return;
    const conflict = message => new ApiError(message, 409, null, 'PRODUCT_RETAIL_CONFLICT');
    if (custo_receita == null || custo_parceria == null) {
        throw conflict('Preencha o custo da receita e o custo da parceria para liberar a venda avulsa.');
    }
    const price = cents(preco);
    if (price === 0n || price < cents(custo_receita) + cents(custo_parceria)) {
        throw conflict('O preço de venda avulsa deve ser positivo e cobrir a soma dos custos.');
    }
}
