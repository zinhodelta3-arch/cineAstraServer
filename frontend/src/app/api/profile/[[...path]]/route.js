import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
import {sessionCookieOptions} from '@/lib/auth/session-cookie.mjs';
import {profileTarget} from '@/lib/api/profile-request.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function handle(request,{params}){
 if(request.method!=='GET'&&!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre na sua conta para acessar seu perfil.'},401);
 try{
  let body={};
  if(['POST','PATCH'].includes(request.method)){
   const text=await request.text();if(text.length>8000)return json({message:'Dados excessivos.'},413);
   try{body=JSON.parse(text);}catch{return json({message:'Dados inválidos.'},400);}
  }
  const parts=(await params).path;
  const target=profileTarget(parts,request.method,body,new URL(request.url).searchParams.get('cursor'));
  if(!target)return json({message:parts?.[0]==='password'?'A senha nova exige 12 caracteres, maiúscula, minúscula, número e símbolo, com confirmação igual (até 72 bytes).':'Confira os campos informados e os limites de cada registro.'},422);
  const data=await backendAuth(target.path,{token,method:request.method,body:target.body});
  if(target.password){
   const response=json({message:'Senha alterada. Entre novamente com a nova senha.'});
   response.cookies.set(SESSION_COOKIE,'',{...sessionCookieOptions(request),maxAge:0});
   return response;
  }
  return json(target.list?{items:data}:data??{success:true});
 }catch(e){
  const messages={401:'Sessão expirada ou senha atual/código de autenticação inválido.',404:'Registro não encontrado ou indisponível para sua conta.',409:'Não foi possível alterar este registro no estado atual. Atualize os dados.',422:'Confira os campos e, na troca de senha, a confirmação e os requisitos informados.'};
  return json({message:messages[e.status]||(e instanceof AuthError?e.message:'Não foi possível acessar seu perfil.')},e instanceof AuthError?e.status:503);
 }
}
export const GET=handle;
export const POST=handle;
export const PATCH=handle;
export const DELETE=handle;
