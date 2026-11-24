"use client";
import {useEffect,useRef,useState} from 'react';
import {useCart} from '@/components/cart/cart-provider';
import {useSession} from '@/hooks/auth/use-session';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {publicGet} from '@/lib/api/public-api.mjs';
import { sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';
import {snackProduct} from '@/lib/api/snack-products.mjs';
import {cartOrder} from '@/lib/api/cart-order.mjs';
export function useAstraSnack(){
 const session=useSession(),cart=useCart();
 const [ticketPromotionBps,setTicketPromotionBps]=useState(0);
 useEffect(()=>{
  const abort=new AbortController();
  const refresh=()=>publicGet('/pricing/promotions/tuesday',{signal:abort.signal})
   .then(data=>{if(!abort.signal.aborted)setTicketPromotionBps(data.discountBps);})
   .catch(()=>{if(!abort.signal.aborted)setTicketPromotionBps(0);});
  refresh();
  window.addEventListener('focus',refresh);
  return ()=>{abort.abort();window.removeEventListener('focus',refresh);};
 },[]);
 const customerId=!session.loading&&session.user?.role==='CLIENTE'?session.user.id:null;
 const guest=!session.loading&&!session.user;
 const quoteAudience=guest?'guest':customerId;
 const [chosenLocalId,setLocalId]=useState(''),[category,setCategory]=useState('todos'),[query,setQuery]=useState('');
 const [selected,setSelected]=useState(null),[quantity,setQuantity]=useState(1),[cartOpen,setCartOpen]=useState(false),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 const [detail,setDetail]=useState(null),[quote,setQuote]=useState(null),[catalogQuotes,setCatalogQuotes]=useState({key:null,prices:{}});
 const locationValidation=useRef(null);
 useEffect(()=>()=>locationValidation.current?.abort(),[quoteAudience]);
 const locations=usePublicList('/locations?limit=100');
 const cartLocal=locations.items.find(local=>String(local.id_local)===cart.items[0]?.localId);
 const localId=chosenLocalId||String((cartLocal??locations.items[0])?.id_local||'');
 const location=locations.items.find(local=>String(local.id_local)===localId);
 const snacks=usePublicList(localId?`/locations/${localId}/snacks?limit=20`:null),combos=usePublicList(localId?`/combos?localId=${localId}&limit=20`:null);
 const products=[...snacks.items.map(r=>snackProduct(r,'INPUT',localId)),...combos.items.map(r=>snackProduct(r,'COMBO',localId))];
 const loadingCatalog=(snacks.loading&&!snacks.items.length)||(combos.loading&&!combos.items.length);
 const catalogKey=loadingCatalog||!localId?null:JSON.stringify([quoteAudience,localId,revision,products.map(p=>[p.purchaseKind,p.sourceId,p.price,p.inStock])]);
 useEffect(()=>{
  if(!catalogKey)return;
  const [userId,location,,entries]=JSON.parse(catalogKey);if(!userId||!entries.length)return;
  const abort=new AbortController();
  async function load(){
   const prices={};
   async function loadBatch(batch){
    if(abort.signal.aborted)return;
    try{
     const response=await sessionFetch('/api/snacks/quote',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',signal:abort.signal,body:JSON.stringify({localId:location,lines:batch.map(([kind,id])=>({kind,id,quantity:1}))})});
     const data=await readSessionResponse(response);
     for(const line of data.lines)prices[`${line.kind}:${line.id}`]=line;
    }catch(error){
     if(abort.signal.aborted)return;
     for(const [kind,id] of batch)prices[`${kind}:${id}`]={error:error.message};
    }
   }
   for(let index=0;index<entries.length;index+=50){
    const batch=entries.slice(index,index+50).filter(entry=>entry[3]!==false);if(!batch.length)continue;
    await loadBatch(batch);
    if(abort.signal.aborted)return;
    setCatalogQuotes({key:catalogKey,prices:{...prices}});
   }
  }
  load();return()=>abort.abort();
 },[catalogKey]);
 const filteredProducts=products.map(p=>({...p,pricing:catalogQuotes.key===catalogKey?catalogQuotes.prices[`${p.purchaseKind}:${p.sourceId}`]:null,requiresQuote:Boolean(quoteAudience),guest})).filter(p=>(category==='todos'||p.categoryId===category)&&`${p.name} ${p.description} ${p.category}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
 const detailKey=selected?`${selected.id}:${revision}`:null;
 useEffect(()=>{if(!selected)return;const abort=new AbortController();const path=selected.purchaseKind==='INPUT'?`/locations/${selected.localId}/snacks/${selected.sourceId}`:`/combos/${selected.sourceId}`;
 publicGet(path,{signal:abort.signal}).then(row=>{if(!abort.signal.aborted){if(String(selected.purchaseKind==='INPUT'?row.localId:row.id_local)!==selected.localId)throw new Error('Produto indisponível neste cinema.');setDetail({key:detailKey,product:snackProduct(row,selected.purchaseKind,selected.localId)});}}).catch(e=>{if(!abort.signal.aborted)setDetail({key:detailKey,error:e.message});});return()=>abort.abort();},[selected,detailKey]);
 const selectedProduct=detail?.key===detailKey?detail.product:null;
 const quoteKey=selectedProduct&&quoteAudience?`${detailKey}:${quantity}:${quoteAudience}`:null;
 useEffect(()=>{if(!quoteKey||selectedProduct.inStock===false)return;const abort=new AbortController();const timer=setTimeout(()=>{sessionFetch('/api/snacks/quote',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',signal:abort.signal,body:JSON.stringify({localId:selectedProduct.localId,kind:selectedProduct.purchaseKind,id:selectedProduct.sourceId,quantity})}).then(readSessionResponse).then(data=>{if(!abort.signal.aborted)setQuote({key:quoteKey,...data});}).catch(e=>{if(!abort.signal.aborted)setQuote({key:quoteKey,error:e.message});});},250);return()=>{clearTimeout(timer);abort.abort();};},[quoteKey,selectedProduct,quantity]);
 const currentQuote=quote?.key===quoteKey?quote:null;
 const gallery=usePublicList(selectedProduct?`/${selectedProduct.purchaseKind==='INPUT'?'inputs':'combos'}/${selectedProduct.sourceId}/images?limit=20`:null);
 const pickupConflict=cart.items.some(item=>item.localId&&item.localId!==localId);
 const canAdd=Boolean(selectedProduct&&!pickupConflict&&selectedProduct.inStock!==false&&
  (!guest||!selectedProduct.eventSessionId)&&currentQuote?.finalizable&&!currentQuote.error);
 const close=()=>setSelected(null);
 const changeLocation=async id=>{
  locationValidation.current?.abort();
  const hasSnacksFromAnotherCinema=cart.items.some(item=>['INPUT','COMBO'].includes(item.purchaseKind)&&item.localId&&item.localId!==id);
  const activeItems=cart.selectSnackLocation(id);
  setLocalId(id);setCategory('todos');setQuery('');close();
  const saved=hasSnacksFromAnotherCinema?'Os lanches do carrinho foram guardados no cinema original. Selecione aquele cinema para recuperá-los.':'';
  setNotice(saved);
  if(!quoteAudience||!activeItems.some(item=>['INPUT','COMBO'].includes(item.purchaseKind)&&item.localId===id))return;
  const abort=new AbortController();
  locationValidation.current=abort;
  try{
   const order=cartOrder(activeItems);
   const endpoint=guest?'/api/snacks/quote':'/api/cart/quote';
   const response=await sessionFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',signal:abort.signal,body:JSON.stringify(order)});
   const validation=await readSessionResponse(response);
   if(abort.signal.aborted)return;
   if((!guest&&!validation.finalizable)||validation.lines.some(line=>line.error||line.catalogOutOfSync))throw new Error();
   const prices=activeItems.map(item=>{
    const index=order.lines.findIndex(line=>line.kind===item.purchaseKind&&line.id===item.sourceId&&(line.kind!=='SESSION'||line.seatId===item.seatId));
    return validation.lines[index];
   });
   cart.updatePrices(activeItems,prices);
  }catch{
   if(!abort.signal.aborted)setNotice([saved,'Abra o carrinho para revisar o preço e a disponibilidade dos itens desta unidade.'].filter(Boolean).join(' '));
  }
 };
 const handleAddToCart=()=>{if(!canAdd)return;cart.addItem({...selectedProduct,price:currentQuote.unitPrice,originalPrice:currentQuote.originalPrice,discountSources:currentQuote.discountSources,details:`Cinema: ${location?.nome||selectedProduct.localId}`},quantity);setNotice(`${selectedProduct.name} adicionado ao carrinho. O checkout confirmará preço e estoque.`);close();};
 return {session,ticketPromotionBps,localId,location,changeLocation,locations,snacks,combos,category,setCategory,query,setQuery,filteredProducts,selectedProduct,selected,drawerOpen:Boolean(selected),setDrawerOpen:open=>{if(!open)close();},quantity,cartOpen,setCartOpen,cartCount:cart.itemCount,notice,pickupConflict,
  openProduct:p=>{setDetail(null);setQuote(null);setSelected(p);setQuantity(1);setNotice('');},handleAddToCart,productTotal:Number(currentQuote?.total||0),decreaseQuantity:()=>setQuantity(v=>Math.max(1,v-1)),increaseQuantity:()=>setQuantity(v=>Math.min(100,v+1)),gallery,canAdd,currentQuote,guest,
 loadingDetail:Boolean(selected)&&detail?.key!==detailKey,detailError:detail?.key===detailKey?detail.error:null,retry:()=>setRevision(v=>v+1)};
}
