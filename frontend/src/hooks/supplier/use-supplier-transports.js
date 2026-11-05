'use client';

import { useDeferredValue,useState } from 'react';
import { useSupplierAction,useSupplierList } from './use-supplier-data';

export function useSupplierTransports() {
  const [query,setQuery]=useState(''),[status,setStatus]=useState(''),[dialog,setDialog]=useState(null);
  const search=useDeferredValue(query.trim());
  const params=new URLSearchParams({limit:'20'});
  if(search)params.set('q',search);
  if(status)params.set('status',status);
  const list=useSupplierList(`transports?${params}`),action=useSupplierAction(list.reload);
  const item=dialog?.item;
  function open(type,row=null){action.setError('');setDialog({type,item:row});}
  function close(){if(!action.pending)setDialog(null);}
  async function save(event) {
    event.preventDefault();
    const form=new FormData(event.currentTarget),value=name=>String(form.get(name)??'').trim();
    const body={nome:value('nome'),tipo:value('tipo'),identificacao:value('identificacao').toUpperCase()||null,observacao:value('observacao')||null};
    if(!body.nome||body.nome.length>120||!body.tipo||body.tipo.length>60||(body.identificacao?.length??0)>40||(body.observacao?.length??0)>2000)return action.setError('Confira os dados do transporte.');
    if(item){
      body.status=value('status');
      for(const field of Object.keys(body))if(body[field]===item[field])delete body[field];
      if(!Object.keys(body).length)return action.setError('Nenhuma alteração para salvar.');
    }
    if(await action.run(item?`transports/${item.id_transporte}`:'transports',{method:item?'PATCH':'POST',body},item?'Transporte atualizado.':'Transporte cadastrado.'))setDialog(null);
  }
  async function changeStatus() {
    if(await action.run(`transports/${item.id_transporte}`,item.status==='ATIVO'?{method:'DELETE'}:{method:'PATCH',body:{status:'ATIVO'}},item.status==='ATIVO'?'Transporte inativado.':'Transporte reativado.'))setDialog(null);
  }
  return {query,setQuery,status,setStatus,dialog,item,list,action,open,close,save,changeStatus};
}
