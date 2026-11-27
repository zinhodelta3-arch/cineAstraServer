"use client";
import {TabsList,TabsTrigger} from '@/components/ui/tabs';
import {SECTIONS} from './movie-utils';
import styles from './filmes.module.css';
export default function CatalogNavigation({ location }){
 return <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
  <p className="text-sm text-muted-foreground">{location ? <>Programação de <strong className="text-foreground">{location.nome}</strong>.</> : "Escolha um cinema no cabeçalho para ver a programação da unidade."}</p>
  <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border/60 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-11 sm:w-auto sm:min-w-[340px]">
   {SECTIONS.map(item=><TabsTrigger key={item.value} value={item.value} className={`${styles.tab} h-11 rounded-none px-1 text-sm font-bold sm:px-3`}>{item.label}</TabsTrigger>)}
  </TabsList>
 </div>;
}
