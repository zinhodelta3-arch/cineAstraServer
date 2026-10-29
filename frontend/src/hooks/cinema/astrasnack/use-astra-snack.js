"use client";
import {useEffect,useState} from 'react';
import {useCart} from '@/components/cart/cart-provider';
import {useSession} from '@/hooks/auth/use-session';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {publicGet} from '@/lib/api/public-api.mjs';
import {readSessionResponse} from '@/lib/auth/session-response.mjs';
import {snackProduct} from '@/lib/api/snack-products.mjs';
export function useAstraSnack(){
 const session=useSession(),cart=useCart();
 const [localId,setLocalId]=useState(''),[category,setCategory]=useState('todos'),[query,setQuery]=useState('');
 const [selected,setSelected]=useState(null),[quantity,setQuantity]=useState(1),[cartOpen,setCartOpen]=useState(false),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 const [detail,setDetail]=useState(null),[quote,setQuote]=useState(null);
 const locations=usePublicList('/locations?limit=100');
 const snacks=usePublicList(localId?`/locations/${localId}/snacks?limit=20`:null),combos=usePublicList(localId?`/combos?localId=${localId}&limit=20`:null);
 const products=[...snacks.items.map(r=>snackProduct(r,'INPUT',localId)),...combos.items.map(r=>snackProduct(r,'COMBO',localId))];
 const filteredProducts=products.filter(p=>(category==='todos'||p.categoryId===category)&&`${p.name} ${p.description} ${p.category}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
 const detailKey=selected?`${selected.id}:${revision}`:null;
 useEffect(()=>{if(!selected)return;const abort=new AbortController();const path=selected.purchaseKind==='INPUT'?`/locations/${selected.localId}/snacks/${selected.sourceId}`:`/combos/${selected.sourceId}`;
 publicGet(path,{signal:abort.signal}).then(row=>{if(!abort.signal.aborted){if(String(selected.purchaseKind==='INPUT'?row.localId:row.id_local)!==selected.localId)throw new Error('Produto indisponível neste cinema.');setDetail({key:detailKey,product:snackProduct(row,selected.purchaseKind,selected.localId)});}}).catch(e=>{if(!abort.signal.aborted)setDetail({key:detailKey,error:e.message});});return()=>abort.abort();},[selected,detailKey]);
 const selectedProduct=detail?.key===detailKey?detail.product:null;
 const quoteKey=selectedProduct&&session.user?`${detailKey}:${quantity}:${session.user.id}`:null;
 useEffect(()=>{if(!quoteKey||selectedProduct.inStock===false)return;const abort=new AbortController();const timer=setTimeout(()=>{fetch('/api/snacks/quote',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',signal:abort.signal,body:JSON.stringify({kind:selectedProduct.purchaseKind,id:selectedProduct.sourceId,quantity})}).then(readSessionResponse).then(data=>{if(!abort.signal.aborted)setQuote({key:quoteKey,...data});}).catch(e=>{if(!abort.signal.aborted)setQuote({key:quoteKey,error:e.message});});},250);return()=>{clearTimeout(timer);abort.abort();};},[quoteKey,selectedProduct,quantity]);
 const currentQuote=quote?.key===quoteKey?quote:null;
 const gallery=usePublicList(selectedProduct?`/${selectedProduct.purchaseKind==='INPUT'?'inputs':'combos'}/${selectedProduct.sourceId}/images?limit=20`:null);
 const canAdd=Boolean(selectedProduct&&selectedProduct.inStock!==false&&currentQuote?.finalizable&&!currentQuote.error);
 const close=()=>setSelected(null);
 const changeLocation=id=>{setLocalId(id);setCategory('todos');setQuery('');close();setNotice('');};
 const handleAddToCart=()=>{if(!canAdd)return;cart.addItem({...selectedProduct,price:currentQuote.unitPrice,details:`Cinema: ${locations.items.find(l=>l.id_local===localId)?.nome||localId}`},quantity);setNotice(`${selectedProduct.name} adicionado ao carrinho. O checkout confirmará preço e estoque.`);close();};
 return {session,localId,changeLocation,locations,snacks,combos,category,setCategory,query,setQuery,filteredProducts,selectedProduct,selected,drawerOpen:Boolean(selected),setDrawerOpen:open=>{if(!open)close();},quantity,cartOpen,setCartOpen,cartCount:cart.itemCount,notice,
 openProduct:p=>{setSelected(p);setQuantity(1);setNotice('');},handleAddToCart,productTotal:Number(currentQuote?.total||0),decreaseQuantity:()=>setQuantity(v=>Math.max(1,v-1)),increaseQuantity:()=>setQuantity(v=>Math.min(100,v+1)),gallery,canAdd,currentQuote,
 loadingDetail:Boolean(selected)&&detail?.key!==detailKey,detailError:detail?.key===detailKey?detail.error:null,retry:()=>setRevision(v=>v+1)};
}
