const text=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
const phone=v=>typeof v==='string'&&/^\+?[\d ()-]{8,20}$/.test(v);
const id=v=>typeof v==='string'&&/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n;
export function profileTarget(parts=[],method='GET',body={},cursor=null){
 if(!body||typeof body!=='object'||Array.isArray(body))return null;
 const only=keys=>Object.keys(body).every(k=>keys.includes(k));
 const base='/users/me';
 if(!parts.length){
  if(method==='GET')return {path:base};
  if(method==='PATCH'&&only(['name','phone'])&&text(body.name,2,100)&&(body.phone===null||phone(body.phone)))return {path:base,body:{name:body.name.trim(),phone:body.phone}};
 }
 if(parts.length===1&&parts[0]==='password'&&method==='PATCH'&&only(['currentPassword','password','passwordConfirmation','code'])){
  const bytes=v=>typeof v==='string'&&v.length>0&&new TextEncoder().encode(v).length<=72;
  if(!bytes(body.currentPassword)||!bytes(body.password)||body.password.length<12||body.password!==body.passwordConfirmation||!/[a-z]/.test(body.password)||!/[A-Z]/.test(body.password)||!/[0-9]/.test(body.password)||!/[^a-zA-Z0-9]/.test(body.password)||body.code!==undefined&&!/^\d{6}$/.test(body.code))return null;
  return {path:base,body:{...body},password:true};
 }
 const kind=parts[0];
 if(!['addresses','contacts','payment-methods'].includes(kind)||parts.length>2||parts.length===2&&!id(parts[1]))return null;
 const path=base+'/'+parts.join('/');
 if(method==='GET'&&parts.length===1){
  if(cursor!==null&&!id(cursor))return null;
  return {path:path+(kind==='payment-methods'?'':'?limit=20'+(cursor?'&cursor='+cursor:'')),list:kind==='payment-methods'};
 }
 if(method==='DELETE'&&parts.length===2&&only([]))return {path};
 if(kind==='payment-methods'){
  if(parts.length===2&&method==='PATCH'&&only(['principal'])&&body.principal===true)return {path,body:{principal:true}};
  return null;
 }
 if(!(parts.length===1&&method==='POST'||parts.length===2&&method==='PATCH'))return null;
 if(typeof body.principal!=='boolean')return null;
 if(kind==='contacts'){
  const creating=method==='POST';
  if(!only(creating?['tipo','valor','principal']:['valor','principal'])||!text(body.valor,3,150))return null;
  if(creating&&!['TELEFONE','WHATSAPP','EMAIL_SECUNDARIO'].includes(body.tipo))return null;
  if(creating&&(body.tipo==='EMAIL_SECUNDARIO'?!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.valor):!phone(body.valor)))return null;
  return {path,body:{...(creating?{tipo:body.tipo}:{}),valor:body.valor.trim(),principal:body.principal}};
 }
 if(!only(['cep','logradouro','numero','complemento','bairro','cidade','estado','principal'])||!text(body.logradouro,1,150)||!text(body.numero,1,20)||!text(body.cidade,1,100)||! /^[A-Z]{2}$/.test(body.estado)||body.cep!==undefined&&!/^\d{5}-?\d{3}$/.test(body.cep)||body.bairro!==undefined&&!text(body.bairro,0,100)||body.complemento!=null&&!text(body.complemento,0,100))return null;
 return {path,body:{...body}};
}
