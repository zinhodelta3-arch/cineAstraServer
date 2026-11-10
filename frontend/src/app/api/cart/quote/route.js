import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import { authErrorPayload,backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
import {validCartOrder} from '@/lib/api/cart-order.mjs';
import {commerceErrors} from '@/lib/api/commerce-errors.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request){
 if(!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return json({message:'Entre para consultar seu pedido.'},401);
 try{
  const raw=await request.text();if(raw.length>10000)return json({message:'Carrinho muito grande.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({message:'Dados inválidos.'},400);}
  if(!validCartOrder(body))return json({message:'Confira os produtos, quantidades e cinema do carrinho.'},422);
  const quote=await backendAuth('/orders/quote',{token,method:'POST',body});
  if(!Array.isArray(quote.lines)||quote.lines.length!==body.lines.length||quote.total==null)throw new AuthError(503,'Cotação incompleta.');
  for(const [index,line] of body.lines.entries()){
   const result=quote.lines[index];
   if(!result||result.category!==line.kind||result.id!==line.id||result.quantity!==line.quantity||result.unitPrice==null)throw new AuthError(503,'Cotação incompatível com o carrinho.');
  }
  return json({total:quote.total,fees:quote.fees??'0.00',finalizable:quote.finalizable===true,guardianAuthorizationRequired:quote.guardianAuthorizationRequired===true,
   lines:quote.lines.map(line=>({category:line.category,id:line.id,quantity:line.quantity,unitPrice:line.unitPrice,originalPrice:line.base,discountSources:line.discountSources??[],subtotal:line.subtotal,catalogOutOfSync:line.catalogOutOfSync===true}))});
 }catch(e){
  const messages={AGE_VERIFICATION_REQUIRED:'Sua conta ainda não possui verificação de idade vigente. A idade informada no cadastro é autodeclarada e não habilita a cotação. Este ambiente precisa de um provedor de verificação de idade para liberar essa etapa.',AGE_RESTRICTION:'A classificação etária de um filme no carrinho não permite esta compra para a data de nascimento da conta.',403:'Sua conta não está habilitada para esta compra. Confira o perfil e a autenticação.',409:'Preço, estoque ou disponibilidade mudou. Revise os itens e consulte novamente.',404:'Um produto não está mais disponível.',422:'Confira os itens e a validade do cupom.'};
  return json(authErrorPayload(e, {code:e.code??null,message:commerceErrors[e.code]||messages[e.code]||messages[e.status]||(e instanceof AuthError?e.message:'Não foi possível cotar o pedido.')}),e instanceof AuthError?e.status:500);
 }
}
