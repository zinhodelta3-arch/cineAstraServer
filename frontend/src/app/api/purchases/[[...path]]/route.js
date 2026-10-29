import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
import {purchaseTarget,publicReceipt,validOrderId} from '@/lib/api/purchases.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const failure=e=>json({message:e.status===404?'Pedido ou documento indisponível para sua conta.':e.status===409?'Este pedido não pode ser cancelado nesta etapa. Atualize os dados.':e instanceof AuthError?e.message:'Não foi possível consultar a compra.'},e instanceof AuthError?e.status:503);
export async function GET(request,{params}){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre para consultar suas compras.'},401);
 const parts=(await params).path||[],path=purchaseTarget(parts,new URL(request.url).searchParams.get('cursor'));
 if(!path)return json({message:'Pedido ou página inválidos.'},422);
 try{const data=await backendAuth(path,{token});return json(parts[1]==='receipt'?publicReceipt(data):data);}catch(e){return failure(e);}
}
export async function POST(request,{params}){
 if(!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre para acessar suas compras.'},401);
 const parts=(await params).path||[],key=request.headers.get('Idempotency-Key');
 if(parts.length!==2||!validOrderId(parts[0])||parts[1]!=='cancel'||!/^[A-Za-z0-9._:-]{8,120}$/.test(key||''))return json({message:'Solicitação inválida.'},422);
 try{
  const raw=await request.text();if(raw.length>20)return json({message:'Dados inválidos.'},422);
  let body;try{body=JSON.parse(raw);}catch{return json({message:'Dados inválidos.'},400);}
  if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).length)return json({message:'Dados inválidos.'},422);
  return json(await backendAuth('/orders/'+parts[0]+'/cancel',{token,method:'POST',body:{},idempotencyKey:key}));
 }catch(e){return failure(e);}
}
