"use client";
import {useState,useRef,useMemo,useEffect} from 'react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {cinemaLocation} from '@/lib/api/cinema-locations.mjs';
export function useCinemaLocations(){
 const [selectedId,setSelectedId]=useState(null),[searchTerm,setSearchTerm]=useState('');
 const [query,setQuery]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setQuery(searchTerm.trim().slice(0,150)),250);return()=>clearTimeout(timer);},[searchTerm]);
 const list=usePublicList(`/locations?limit=20${query?`&q=${encodeURIComponent(query)}`:''}`);
 const panelRef=useRef(null);
 const locations=useMemo(()=>list.items.map(cinemaLocation),[list.items]);
 const selected=locations.find(l=>l.id===selectedId);
 const filteredLocations=locations;
 useEffect(()=>{if(!selectedId||window.innerWidth>=1024)return;const timer=setTimeout(()=>panelRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}),60);return()=>clearTimeout(timer);},[selectedId]);
 return {list,selectedId,setSelectedId,searchTerm,setSearchTerm,panelRef,selected,filteredLocations};
}
