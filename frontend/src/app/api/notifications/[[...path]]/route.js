import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
import {notificationId} from '@/lib/api/notifications.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const failure=e=>json({message:e.status===404?'Notificação não encontrada para esta conta.':e instanceof AuthError?e.message:'Não foi possível acessar suas notificações.'},e instanceof AuthError?e.status:503);
export async function GET(request,{params}){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre para consultar notificações.'},401);
 const parts=(await params).path||[],cursor=new URL(request.url).searchParams.get('cursor');
 if(parts.length||cursor!==null&&!notificationId(cursor))return json({message:'Página inválida.'},422);
 try{return json(await backendAuth('/notifications/me?limit=20'+(cursor?'&cursor='+cursor:''),{token}));}catch(e){return failure(e);}
}
export async function PATCH(request,{params}){
 if(!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre para acessar notificações.'},401);
 const parts=(await params).path||[];
 if(parts.length!==2||!notificationId(parts[0])||parts[1]!=='read')return json({message:'Notificação inválida.'},422);
 try{
  // No payload: the API supports only the transition to read.
  if((await request.text()).length)return json({message:'Esta ação não aceita alteração de conteúdo.'},422);
  return json(await backendAuth('/notifications/me/'+parts[0]+'/read',{token,method:'PATCH'}));
 }catch(e){return failure(e);}
}
