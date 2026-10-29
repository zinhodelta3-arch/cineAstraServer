"use client";
import {useRef,useState} from 'react';
import {supportRequest,useSupportResource} from './use-support-resource';
export default function useSupportWorkspace(){
 const list=useSupportResource('');
 const [selected,setSelected]=useState(null),[subject,setSubject]=useState(''),[message,setMessage]=useState(''),[reply,setReply]=useState('');
 const detail=useSupportResource(selected,false),messages=useSupportResource(selected?selected+'/messages':null);
 const [pending,setPending]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(''),[confirmClose,setConfirmClose]=useState(false);
 const [question,setQuestion]=useState(''),[answer,setAnswer]=useState(null),[asked,setAsked]=useState(''),[handedOff,setHandedOff]=useState(false);
 const lock=useRef(false);
 const run=async task=>{
  if(lock.current)return;lock.current=true;setPending(true);setError('');setNotice('');
  try{await task();}catch(e){setError(e.message+' Se a resposta se perdeu, atualize seus chamados antes de reenviar.');}
  finally{lock.current=false;setPending(false);}
 };
 const select=id=>{if(lock.current)return;setSelected(id);setReply('');setError('');setNotice('');setConfirmClose(false);};
 const refresh=()=>{list.retry();detail.retry();messages.retry();};
 const create=e=>{e.preventDefault();return run(async()=>{
  const data=await supportRequest('',{subject,message});
  if(!data.id)throw new Error('Resposta incompleta.');
  setSelected(data.id);setSubject('');setMessage('');setReply('');list.retry();setNotice('Chamado #'+data.id+' aberto.');
 });};
 const sendReply=e=>{e.preventDefault();if(!selected)return;return run(async()=>{
  await supportRequest(selected+'/messages',{message:reply});
  setReply('');refresh();setNotice('Mensagem enviada. Carregue as próximas mensagens, se houver, para ver o histórico completo.');
 });};
 const close=()=>run(async()=>{
  await supportRequest(selected+'/close',{});setConfirmClose(false);refresh();setNotice('Chamado encerrado.');
 });
 const ask=e=>{e.preventDefault();return run(async()=>{
  setAnswer(null);setHandedOff(false);const text=question.trim();
  const data=await supportRequest('assistant/messages',{message:text});
  if(typeof data.message!=='string'||typeof data.available!=='boolean')throw new Error('Resposta incompleta da assistente.');
  setAsked(text);setAnswer(data);
 });};
 const handoff=()=>{if(!asked||handedOff)return;return run(async()=>{
  const data=await supportRequest('assistant/handoff',{message:asked});
  if(!data.id)throw new Error('Resposta incompleta.');
  setHandedOff(true);setSelected(data.id);setReply('');list.retry();setNotice('Dúvida encaminhada no chamado #'+data.id+'.');
 });};
 return {list,selected,select,detail,messages,subject,setSubject,message,setMessage,reply,setReply,pending,notice,error,confirmClose,setConfirmClose,create,sendReply,close,refresh,
 assistant:{question,setQuestion,answer,asked,handedOff,ask,handoff,pending}};
}
