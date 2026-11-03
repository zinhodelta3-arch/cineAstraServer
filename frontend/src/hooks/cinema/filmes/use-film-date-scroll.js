"use client";
import {useRef} from 'react';
export function useFilmDateScroll(){
 const listRef=useRef(null);
 const scroll=direction=>listRef.current?.scrollBy({left:direction*listRef.current.clientWidth*.7,behavior:'smooth'});
 return {listRef,scroll};
}
