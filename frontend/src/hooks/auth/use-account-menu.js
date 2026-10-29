"use client";
import {useState} from 'react';
import {usePathname} from 'next/navigation';
export function useAccountMenu(user){
 const path=usePathname(),[opened,setOpened]=useState(null),key=`${path}:${user?.id}`;
 return {open:opened===key,onOpenChange:value=>setOpened(value?key:null),close:()=>setOpened(null),initials:user?.name?.trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>Array.from(part)[0]).join('').toUpperCase()||'U',profilePath:path.startsWith('/streaming')?'/streaming/meuperfil':'/cinema/perfil'};
}
