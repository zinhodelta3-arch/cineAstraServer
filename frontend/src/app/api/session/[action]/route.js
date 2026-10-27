import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, SESSION_COOKIE, cookieOptions } from '@/lib/auth/server';
import { loginDestination } from '@/lib/auth/destination.mjs';
const json = (body,status=200) => NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const userDto = u => ({id:u.id,name:u.name,role:u.role,ageVerified:u.ageVerified===true});
export async function GET(request,{params}) {
 const {action}=await params;
 if(action!=='me')return json({message:'Recurso inexistente.'},404);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({user:null});
 try {return json({user:userDto(await backendAuth('/users/me',{token}))});}
 catch(error){const res=json({user:null,message:error.message},error.status||503);if([401,403].includes(error.status))res.cookies.set(SESSION_COOKIE,'',{...cookieOptions,maxAge:0});return res;}
}
export async function POST(request,{params}) {
 const {action}=await params;
 if(!['login','logout','forgot','reset','register'].includes(action))return json({message:'Recurso inexistente.'},404);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({message:'Origem não permitida.'},403);
 try {
  if(action==='logout'){
   const token=(await cookies()).get(SESSION_COOKIE)?.value;
   let failed=false;
   try {if(token)await backendAuth('/auth/logout',{method:'POST',token});}catch(e){if(![401,403].includes(e.status))failed=true;}
   const res=json({message:failed?'Sessão local encerrada. Não foi possível confirmar a revogação no servidor.':'Sessão encerrada.'});res.cookies.set(SESSION_COOKIE,'',{...cookieOptions,maxAge:0});return res;
  }
  if(!request.headers.get('content-type')?.includes('application/json'))throw new AuthError(415,'Envie os dados em JSON.');
  const text=await request.text();if(text.length>12000)throw new AuthError(413,'Dados excessivos.');
  let body;try{body=JSON.parse(text);}catch{throw new AuthError(400,'Dados inválidos.');}
  const data=await backendAuth(`/auth/${action==='register'?'register':action==='forgot'?'password/forgot':action==='reset'?'password/reset':'login'}`,{method:'POST',body});
  if(action==='register')return json({user:userDto(data),message:data.ageVerified?'Conta criada. Entre para continuar.':'Conta criada. Sua idade foi informada por você e não foi verificada. Entre para continuar.'},201);
  if(action!=='login')return json({message:action==='forgot'?'Se a conta for elegível, você receberá as instruções de recuperação.':'Senha redefinida. Entre novamente com sua nova senha.'});
  if(!data.accessToken){throw new AuthError(409,'Esta conta exige uma etapa adicional de autenticação que ainda não está disponível nesta tela.');}
  const verified=await backendAuth('/users/me',{token:data.accessToken});
  if(!['ADMIN','CLIENTE','FORNECEDOR','COLABORADOR','SUPERVISOR'].includes(verified.role))throw new AuthError(403,'Perfil de acesso não reconhecido.');
  if(!Number.isInteger(data.expiresIn)||data.expiresIn<1||data.expiresIn>900)throw new AuthError(503,'Sessão inválida.');
  const res=json({user:userDto(verified),destination:loginDestination(verified.role)});
  res.cookies.set(SESSION_COOKIE,data.accessToken,{...cookieOptions,maxAge:data.expiresIn});return res;
 }catch(error){return json({message:error instanceof AuthError?error.message:'Não foi possível concluir a operação.'},error.status||503);}
}
