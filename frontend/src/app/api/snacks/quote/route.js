import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request){
 if(!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre na sua conta para cotar os produtos.'},401);
 try{
  const text=await request.text();if(text.length>1000)return json({message:'Dados excessivos.'},413);
  let body;try{body=JSON.parse(text);}catch{return json({message:'Dados inválidos.'},400);}
  if(!body||!['INPUT','COMBO'].includes(body.kind)||typeof body.id!=='string'||! /^[1-9]\d{0,9}$/.test(body.id)||!Number.isInteger(body.quantity)||body.quantity<1||body.quantity>100)return json({message:'Confira o produto e a quantidade (1 a 100).'},422);
  const quote=await backendAuth('/pricing/quote',{token,method:'POST',body:{lines:[{category:body.kind,id:body.id,quantity:body.quantity}]}});
  const line=quote.lines?.[0];if(!line||line.id!==body.id||line.quantity!==body.quantity)throw new AuthError(503,'Cotação inválida.');
  return json({unitPrice:line.unitPrice,total:quote.total,finalizable:quote.finalizable===true,quotedAt:quote.quotedAt});
 }catch(e){return json({message:e instanceof AuthError?e.message:'Não foi possível cotar o produto.'},e instanceof AuthError?e.status:503);}
}
