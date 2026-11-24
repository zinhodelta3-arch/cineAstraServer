"use client";
import {useRef,useState} from 'react';
import {useNotifications} from './use-notifications';
import {experienceNotificationType} from '@/lib/api/notifications.mjs';
export default function useNotificationCenter(userId,role){
 const [filter,setFilter]=useState('all'),[selected,setSelected]=useState(null),[announcement,setAnnouncement]=useState('');
 const list=useNotifications(userId,filter==='experience'?experienceNotificationType:null,role);
 const headingRef=useRef(null),returnFocusRef=useRef(null);
 const unread=list.items.filter(item=>!item.read),read=list.items.filter(item=>item.read);
 const markRead=async item=>{if(await list.markRead(item.id))setAnnouncement('Notificação marcada como lida.');};
 const openDetails=item=>{returnFocusRef.current=document.activeElement;setSelected(item);};
 const closeDetails=()=>{setSelected(null);requestAnimationFrame(()=>{if(returnFocusRef.current?.isConnected)returnFocusRef.current.focus();else headingRef.current?.focus();});};
 return {list,filter,setFilter,selected,announcement,headingRef,unread,read,markRead,openDetails,closeDetails};
}
