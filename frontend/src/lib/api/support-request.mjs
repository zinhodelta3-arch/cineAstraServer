export function supportTarget(parts=[],method='GET',cursor='0',body={}){
 const id=value=>typeof value==='string'&&/^[1-9]\d{0,9}$/.test(value)&&BigInt(value)<=4294967295n;
 const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max;
 const only=keys=>body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).every(k=>keys.includes(k));
 const root='/support';
 if(method==='GET'){
  if(!/^(0|[1-9]\d{0,19})$/.test(cursor)||BigInt(cursor)>18446744073709551615n)return null;
  if(!parts.length)return {path:root+'?limit=20&cursor='+cursor};
  if(parts.length===1&&id(parts[0]))return {path:root+'/'+parts[0]};
  if(parts.length===2&&id(parts[0])&&parts[1]==='messages')return {path:root+'/'+parts[0]+'/messages?limit=20&cursor='+cursor};
  return null;
 }
 if(method!=='POST')return null;
 if(!parts.length&&only(['subject','message'])&&text(body.subject,150)&&text(body.message,10000))return {path:root,body:{subject:body.subject.trim(),message:body.message.trim()}};
 if(parts.length===2&&id(parts[0])){
  if(parts[1]==='messages'&&only(['message'])&&text(body.message,10000))return {path:root+'/'+parts[0]+'/messages',body:{message:body.message.trim(),mode:'ASYNC'}};
  if(parts[1]==='close'&&only([]))return {path:root+'/'+parts[0]+'/close',body:{}};
 }
 if(parts.length===2&&parts[0]==='assistant'&&['messages','handoff'].includes(parts[1])&&only(['message'])&&text(body.message,parts[1]==='messages'?1000:4000))return {path:'/assistant/'+parts[1],body:{message:body.message.trim()}};
 return null;
}
