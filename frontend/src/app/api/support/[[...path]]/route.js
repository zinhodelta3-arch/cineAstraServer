import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
import {supportTarget} from '@/lib/api/support-request.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function handle(request,{params}){
 if(request.method==='POST'&&!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre na sua conta para acessar o suporte.'},401);
 try{
  let body={};
  if(request.method==='POST'){
   const text=await request.text();
   if(text.length>65000)return json({message:'Mensagem muito longa.'},413);
   try{body=JSON.parse(text);}catch{return json({message:'Dados inválidos.'},400);}
  }
  const target=supportTarget((await params).path,request.method,new URL(request.url).searchParams.get('cursor')||'0',body);
  if(!target)return json({message:'Confira o assunto, a mensagem e o chamado solicitado.'},422);
  return json(await backendAuth(target.path,{token,method:request.method,body:target.body}));
 }catch(e){
  const messages={403:'Use uma conta de cliente autorizada para este atendimento.',404:'Chamado não encontrado ou indisponível para sua conta.',409:'O estado do chamado mudou. Atualize a conversa antes de continuar.',422:'Confira o assunto e o tamanho da mensagem.'};
  return json({message:messages[e.status]||(e instanceof AuthError?e.message:'Não foi possível acessar o suporte.')},e instanceof AuthError?e.status:503);
 }
}
export const GET=handle;
export const POST=handle;
