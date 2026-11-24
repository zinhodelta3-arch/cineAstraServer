"use client";
import {useEffect,useRef,useState} from 'react';
export function useHorizontalScroll(count){
 const listRef=useRef(null);
 const [position,setPosition]=useState({back:false,next:false});
 useEffect(()=>{
  const list=listRef.current;
  if(!list)return;
  const update=()=>setPosition(previous=>{
   const back=list.scrollLeft>2,next=list.scrollLeft+list.clientWidth<list.scrollWidth-2;
   return previous.back===back&&previous.next===next?previous:{back,next};
  });
  const observer=new ResizeObserver(update);
  observer.observe(list);
  list.addEventListener('scroll',update,{passive:true});
  update();
  return()=>{observer.disconnect();list.removeEventListener('scroll',update);};
 },[count]);
 const scroll=direction=>{
  const list=listRef.current;
  if(list)list.scrollBy({left:direction*list.clientWidth*.7,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
 return {listRef,scroll,...position};
}
