"use client";
import {useRef,useState} from 'react';
import useProfileResource,{profileRequest} from './use-profile-resource';
export default function useProfileRecords(kind){
 const list=useProfileResource(kind),[editor,setEditor]=useState(null),[removing,setRemoving]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[pending,setPending]=useState(false);
 const lock=useRef(false);
 const idOf=item=>item[kind==='addresses'?'id_endereco':kind==='contacts'?'id_contato':'id'];
 const openEditor=item=>{if(lock.current)return;setError('');setEditor(item||{});};
 const closeEditor=()=>{if(!lock.current)setEditor(null);};
 const openRemoval=item=>{if(!lock.current){setError('');setRemoving(item);}};
 const closeRemoval=()=>{if(!lock.current)setRemoving(null);};
 const run=async task=>{
  if(lock.current)return;lock.current=true;setPending(true);setError('');setNotice('');
  try{await task();list.retry();}
  catch(e){setError(e.message+' Atualize os registros antes de repetir uma inclusão.');}
  finally{lock.current=false;setPending(false);}
 };
 const save=e=>{
  e.preventDefault();const form=new FormData(e.currentTarget),id=idOf(editor);
  let body=Object.fromEntries(form.entries());body.principal=form.get('principal')==='on';
  if(kind==='addresses'){if(!body.cep)delete body.cep;}
  else if(id)delete body.tipo;
  return run(async()=>{await profileRequest(kind+(id?'/'+id:''),id?'PATCH':'POST',body);setEditor(null);setNotice('Registro salvo.');});
 };
 const remove=()=>run(async()=>{await profileRequest(kind+'/'+idOf(removing),'DELETE');setRemoving(null);setNotice('Registro removido.');});
 const makePrimary=item=>run(async()=>{
  const body=kind==='payment-methods'?{principal:true}:kind==='contacts'?{valor:item.valor,principal:true}:{logradouro:item.logradouro,numero:item.numero,cidade:item.cidade,estado:item.estado,principal:true,...(item.cep?{cep:item.cep}:{}),...(item.bairro?{bairro:item.bairro}:{}),...(item.complemento?{complemento:item.complemento}:{})};
  await profileRequest(kind+'/'+idOf(item),'PATCH',body);setNotice('Registro principal atualizado.');
 });
 return {list,editor,removing,error,notice,pending,idOf,openEditor,closeEditor,openRemoval,closeRemoval,save,remove,makePrimary};
}
