import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import { authErrorPayload,backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request){
 if(!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre na sua conta para cotar os produtos.'},401);
 try{
  const text=await request.text();if(text.length>10000)return json({message:'Dados excessivos.'},413);
  let body;try{body=JSON.parse(text);}catch{return json({message:'Dados inválidos.'},400);}
  const batch=Array.isArray(body?.lines),items=batch?body.lines:[body];
  if(!items.length||items.length>50||items.some(item=>!item||!['INPUT','COMBO'].includes(item.kind)||typeof item.id!=='string'||! /^[1-9]\d{0,9}$/.test(item.id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>100))return json({message:'Confira os produtos e as quantidades (1 a 100).'},422);
  const quote=await backendAuth('/pricing/quote',{token,method:'POST',body:{lines:items.map(item=>({category:item.kind,id:item.id,quantity:item.quantity}))}});
  if(quote.lines?.length!==items.length)throw new AuthError(503,'Cotação inválida.');
  const lines=quote.lines.map((line,index)=>{
   const item=items[index];if(line.id!==item.id||line.category!==item.kind||line.quantity!==item.quantity||!/^\d+\.\d{2}$/.test(line.unitPrice)||!/^\d+\.\d{2}$/.test(line.base))throw new AuthError(503,'Cotação inválida.');
   return {kind:line.category,id:line.id,unitPrice:line.unitPrice,originalPrice:line.base,discountSources:line.discountSources??[],total:line.subtotal,finalizable:quote.finalizable===true,catalogOutOfSync:line.catalogOutOfSync===true,quotedAt:quote.quotedAt};
  });
  return json(batch?{lines}:lines[0]);
 }catch(e){
  const message=e instanceof AuthError&&e.code==='PRICING_CONFLICT'
   ? 'O cinema precisa revisar a configuração de preço deste produto antes da compra.'
   : e instanceof AuthError?e.message:'Não foi possível cotar o produto.';
  return json(authErrorPayload(e, {message}),e instanceof AuthError?e.status:500);
 }
}
