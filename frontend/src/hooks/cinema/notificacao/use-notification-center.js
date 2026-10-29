"use client";
import {useRef,useState} from 'react';
import {useNotifications} from './use-notifications';
export default function useNotificationCenter(userId){
 const list=useNotifications(userId),[filter,setFilter]=useState('all'),[selected,setSelected]=useState(null),[announcement,setAnnouncement]=useState('');
 const headingRef=useRef(null),returnFocusRef=useRef(null);
 const unread=list.items.filter(item=>!item.read),read=list.items.filter(item=>item.read);
 const markRead=async item=>{if(await list.markRead(item.id))setAnnouncement('Notificação marcada como lida.');};
 const openDetails=item=>{returnFocusRef.current=document.activeElement;setSelected(item);};
 const closeDetails=()=>{setSelected(null);requestAnimationFrame(()=>{if(returnFocusRef.current?.isConnected)returnFocusRef.current.focus();else headingRef.current?.focus();});};
 return {list,filter,setFilter,selected,announcement,headingRef,unread,read,markRead,openDetails,closeDetails};
}
