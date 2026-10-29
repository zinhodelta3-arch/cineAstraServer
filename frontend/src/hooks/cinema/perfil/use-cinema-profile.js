"use client";
import {useState} from 'react';
import useProfileResource,{profileRequest} from './use-profile-resource';
export default function useCinemaProfile(){
 const resource=useProfileResource(''),[notice,setNotice]=useState('');
 const saveProfile=async input=>{
  await profileRequest('','PATCH',input);resource.retry();
  window.dispatchEvent(new Event('cineastra-session'));setNotice('Perfil atualizado.');
 };
 return {resource,saveProfile,notice};
}
