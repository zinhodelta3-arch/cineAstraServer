import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {backendAuth,AuthError,SESSION_COOKIE} from '@/lib/auth/server';
import {isAllowedAuthOrigin} from '@/lib/auth/request-origin.mjs';
import {validateExperienceInquiry} from '@/lib/api/experience-inquiry.mjs';
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request){
 if(!isAllowedAuthOrigin(request))return json({message:'Origem não permitida.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token)return json({message:'Entre na sua conta para solicitar informações.'},401);
 try{
  const text=await request.text();if(text.length>6000)return json({message:'Dados excessivos.'},413);
  let raw;try{raw=JSON.parse(text);}catch{return json({message:'Dados inválidos.'},400);}
  const input=validateExperienceInquiry(raw);if(!input)return json({message:'Confira a experiência, a data, a quantidade e a descrição (10 a 4.000 caracteres).'},422);
  const user=await backendAuth('/users/me',{token});if(user.role!=='CLIENTE')return json({message:'Use uma conta de cliente para solicitar informações.'},403);
  const experience=await backendAuth(`/experiences/${input.experienceId}`);
  const result=await backendAuth('/support',{token,method:'POST',body:{subject:`Experiência: ${experience.title}`.slice(0,150),message:`Pedido de informações, sem reserva confirmada.\nExperiência: ${experience.title} (ID ${input.experienceId})\nData desejada: ${input.date}\nPessoas/veículos: ${input.guests}\n\n${input.details}`}});
  return json({id:result.id,message:'Solicitação enviada ao suporte. Isso não confirma uma reserva.'},201);
 }catch(e){return json({message:e instanceof AuthError?e.message:'Não foi possível enviar a solicitação.'},e instanceof AuthError?e.status:503);}
}
