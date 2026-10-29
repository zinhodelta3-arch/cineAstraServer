"use client";
import {useState} from 'react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {publicAsset,safeLink} from '@/lib/api/public-api.mjs';

export default function useCinemaPartnerships(){
 const list=usePublicList('/partners?limit=12');
 const [category,setCategory]=useState(null);
 const partners=list.items.map(item=>({...item,image:publicAsset(item.imageUrl),href:safeLink(item.targetUrl)}));
 const categories=[...new Set(partners.map(item=>item.tag).filter(Boolean))];
 const benefits=category===null?partners:partners.filter(item=>item.tag===category);
 return {list,category,setCategory,categories,benefits};
}
