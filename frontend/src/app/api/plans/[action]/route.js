
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
import {subscriptionInput} from '@/lib/api/plan-subscription.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const failure=e=>json({message:e.status===409?'A oferta mudou ou você já possui uma assinatura ativa ou pendente. Consulte suas assinaturas e revise a oferta.':e.status===403?'Sua conta não está habilitada para esta contratação. Confira seu perfil e a verificação de idade.':e.status===404?'Plano ou recurso indisponível. Atualize a página.':e instanceof AuthError?e.message:'Não foi possível acessar os planos.'},e instanceof AuthError?e.status:503);
export async function GET(request,{params}){
 if((await params).action!=='mine')return json({message:'Recurso não encontrado.'},404);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre na sua conta.'},401);
 const cursor=new URL(request.url).searchParams.get('cursor')||'0';
 if(!/^(0|[1-9]\d{0,9})$/.test(cursor)||BigInt(cursor)>4294967295n)return json({message:'Página inválida.'},422);
 try{return json(await backendAuth(`/subscriptions/me?limit=20&cursor=${cursor}`,{token}));}catch(e){return failure(e);}
}
export async function POST(request,{params}){
 if(!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const action=(await params).action;
 if(!['summary','subscribe'].includes(action))return json({message:'Recurso não encontrado.'},404);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre na sua conta para contratar.'},401);
 try{
  const text=await request.text();if(text.length>2048)return json({message:'Dados excessivos.'},413);
  let raw;try{raw=JSON.parse(text);}catch{return json({message:'Dados inválidos.'},400);}
  const input=subscriptionInput(raw,action==='subscribe');
  if(!input)return json({message:'Confira o plano, período e aceite do contrato.'},422);
  const key=request.headers.get('Idempotency-Key');
  if(action==='subscribe'&&!/^[A-Za-z0-9._:-]{8,120}$/.test(key||''))return json({message:'Identificador da contratação inválido.'},422);
  return json(await backendAuth(action==='summary'?'/subscriptions/summary':'/subscriptions',{token,method:'POST',body:input,idempotencyKey:action==='subscribe'?key:undefined}),action==='subscribe'?201:200);
 }catch(e){return failure(e);}
}
